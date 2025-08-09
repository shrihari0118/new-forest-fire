import os
import re
import json
import time
import logging
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image
import rasterio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("preprocess")

# Compute backend/data path relative to this file, with env override available.
# This resolves to: C:\Users\sadha\new-forest-fire\backend\data on your setup.
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # <project>/backend
DATA_ROOT_DEFAULT = os.path.join(BACKEND_DIR, "data")
DATA_ROOT = os.path.abspath(os.getenv("DATA_ROOT", DATA_ROOT_DEFAULT))

# Optional: generate small PNG previews for QA (set to False to disable)
GENERATE_PREVIEW = True
PREVIEW_MAX_SIZE = 512  # px


def ensure_dir(path: str) -> Tuple[str, bool]:
    """Ensure directory exists. Returns (path, created_bool)."""
    created = False
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)
        created = True
        logger.info(f"Created directory: {path}")
    return path, created


def to_region_slug(region: Optional[str]) -> str:
    """
    Convert a region id or name to a folder-friendly slug.
    Examples:
      'karnataka-kodagu' -> 'kodagu'
      'Kodagu District'  -> 'kodagu'
    """
    if not region:
        return "unknown"
    s = region.strip().lower()
    # Prefer last token if it's like 'uttarakhand-dehradun'
    if "-" in s:
        parts = [p for p in s.split("-") if p]
        if len(parts) >= 2:
            s = parts[-1]
    s = s.replace(" district", " ").replace("_", " ").strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    return s


def list_tif_files(root: str) -> List[str]:
    """
    Recursively list TIFF files, skipping the preprocessed output folder.
    """
    tif_paths = []
    for r, dirnames, files in os.walk(root):
        # Don't descend into any *_preprocessed_data directories
        dirnames[:] = [d for d in dirnames if not d.lower().endswith("_preprocessed_data")]
        for f in files:
            if f.lower().endswith((".tif", ".tiff")):
                tif_paths.append(os.path.join(r, f))
    tif_paths.sort()
    return tif_paths


def _nanstats(arr_1d: np.ndarray) -> Dict[str, Optional[float]]:
    if arr_1d.size == 0:
        return dict(
            min=None, max=None, mean=None, std=None,
            median=None, q1=None, q3=None, iqr=None
        )
    stats = {
        "min": float(np.nanmin(arr_1d)),
        "max": float(np.nanmax(arr_1d)),
        "mean": float(np.nanmean(arr_1d)),
        "std": float(np.nanstd(arr_1d)),
        "median": float(np.nanmedian(arr_1d)),
        "q1": float(np.nanpercentile(arr_1d, 25)),
        "q3": float(np.nanpercentile(arr_1d, 75)),
    }
    stats["iqr"] = float(stats["q3"] - stats["q1"]) if stats["q3"] is not None and stats["q1"] is not None else None
    return stats


def _impute_and_clip(band: np.ndarray) -> Dict[str, object]:
    """
    band: 2D float32 array with np.nan for missing.
    Returns:
      {
        'cleaned': 2D array (float32),
        'raw_stats': {...},
        'cleaned_stats': {...},
        'pct_missing': float,
        'pct_outliers_clipped': float,
        'clip_bounds': (lower, upper),
        'median_imputed': float
      }
    """
    h, w = band.shape
    total_px = h * w

    valid = ~np.isnan(band)
    valid_vals = band[valid]
    pct_missing = float(100.0 * (total_px - valid_vals.size) / max(total_px, 1))

    # Raw stats
    raw_stats = _nanstats(valid_vals)

    # Median for imputation
    if valid_vals.size == 0:
        median = 0.0  # fallback
    else:
        median = float(np.nanmedian(valid_vals))
    imputed = np.where(np.isnan(band), median, band)

    # IQR clipping bounds
    if valid_vals.size >= 2:
        q1 = np.nanpercentile(valid_vals, 25)
        q3 = np.nanpercentile(valid_vals, 75)
        iqr = q3 - q1
        if iqr <= 0:
            # fallback to [1st, 99th] percentile if IQR degenerate
            lower = np.nanpercentile(valid_vals, 1.0)
            upper = np.nanpercentile(valid_vals, 99.0)
        else:
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
    else:
        lower = median
        upper = median

    # Count outliers before clipping (on imputed)
    outliers_mask = (imputed < lower) | (imputed > upper)
    num_outliers = int(np.count_nonzero(outliers_mask))
    pct_outliers = float(100.0 * num_outliers / max(total_px, 1))

    cleaned = np.clip(imputed, lower, upper)
    cleaned_vals = cleaned.reshape(-1)  # includes imputed and clipped

    cleaned_stats_arr = cleaned_vals  # no NaNs after imputation
    cleaned_stats = _nanstats(cleaned_stats_arr)

    return {
        "cleaned": cleaned.astype(np.float32),
        "raw_stats": raw_stats,
        "cleaned_stats": cleaned_stats,
        "pct_missing": pct_missing,
        "pct_outliers_clipped": pct_outliers,
        "clip_bounds": (float(lower), float(upper)),
        "median_imputed": float(median)
    }


def _save_preview(cleaned_bands: np.ndarray, preview_path: str, max_size: int = PREVIEW_MAX_SIZE) -> Optional[str]:
    """
    cleaned_bands: (C, H, W) float32
    Saves PNG preview. Returns path or None.
    """
    try:
        c, h, w = cleaned_bands.shape
        if c >= 3:
            rgb = cleaned_bands[:3, :, :]
        else:
            # replicate first band to RGB
            rgb = np.repeat(cleaned_bands[:1, :, :], 3, axis=0)
        # Normalize per-channel to 0-255 for a decent preview
        rgb_img = []
        for i in range(3):
            ch = rgb[i]
            ch_min, ch_max = float(np.min(ch)), float(np.max(ch))
            if ch_max - ch_min < 1e-12:
                ch_scaled = np.zeros_like(ch, dtype=np.uint8)
            else:
                ch_scaled = ((ch - ch_min) / (ch_max - ch_min) * 255.0).clip(0, 255).astype(np.uint8)
            rgb_img.append(ch_scaled)
        rgb_img = np.stack(rgb_img, axis=-1)  # H, W, 3
        img = Image.fromarray(rgb_img, mode="RGB")
        img.thumbnail((max_size, max_size))  # Resize down if too big
        img.save(preview_path)
        return preview_path
    except Exception as e:
        logger.warning(f"Failed to save preview {preview_path}: {e}")
        return None


def extract_tif_metadata(file_path: str, generate_preview: bool, preview_dir: str) -> Dict[str, object]:
    """
    Extract raster metadata, handle missing/outliers, compute per-band stats,
    and optionally save a preview image.

    Returns a dictionary ready to be serialized to JSON.
    """
    with rasterio.open(file_path) as src:
        logger.info(f"Opened: {file_path}")
        # Basic metadata
        meta = src.meta.copy()
        width, height = src.width, src.height
        count = src.count
        dtype = src.dtypes[0] if count >= 1 else meta.get("dtype", "unknown")
        crs = src.crs.to_string() if src.crs else None
        transform = tuple(src.transform)
        bounds = dict(left=src.bounds.left, bottom=src.bounds.bottom, right=src.bounds.right, top=src.bounds.top)
        res = src.res
        nodata = src.nodata
        driver = src.driver

        # Tags
        global_tags = src.tags()
        per_band_tags = [src.tags(i) for i in range(1, count + 1)]

        # Read all bands as masked array (C, H, W), float32
        arr_masked = src.read(masked=True).astype(np.float32)
        # Convert to np.nan where masked
        arr = np.where(arr_masked.mask, np.nan, arr_masked.data).astype(np.float32)

        per_band = []
        cleaned_bands = []
        for b in range(count):
            result = _impute_and_clip(arr[b])
            cleaned_bands.append(result["cleaned"])
            per_band.append({
                "band_index": b + 1,
                "raw_stats": result["raw_stats"],
                "cleaned_stats": result["cleaned_stats"],
                "pct_missing": result["pct_missing"],
                "pct_outliers_clipped": result["pct_outliers_clipped"],
                "clip_bounds": result["clip_bounds"],
                "median_imputed_value": result["median_imputed"],
                "tags": per_band_tags[b] if b < len(per_band_tags) else {}
            })

        cleaned_bands_np = np.stack(cleaned_bands, axis=0) if cleaned_bands else np.empty((0, height, width), dtype=np.float32)

        preview_path = None
        if generate_preview and cleaned_bands_np.size > 0:
            base = os.path.splitext(os.path.basename(file_path))[0]
            preview_path = os.path.join(preview_dir, f"{base}_preview.png")
            prev = _save_preview(cleaned_bands_np, preview_path)
            preview_path = prev if prev else None

        file_stats = {
            "file_path": file_path,
            "file_name": os.path.basename(file_path),
            "file_size_bytes": os.path.getsize(file_path),
            "driver": driver,
            "dtype": dtype,
            "width": width,
            "height": height,
            "count": count,
            "crs": crs,
            "transform": transform,
            "bounds": bounds,
            "res": res,
            "nodata": nodata,
            "global_tags": global_tags,
            "per_band": per_band,
            "cleaning": {
                "missing_strategy": "median_imputation",
                "outlier_strategy": "IQR_clipping_1.5",
                "notes": "Stats (cleaned_stats) computed after impute+clip."
            },
            "preview_png": preview_path
        }
        return file_stats


def preprocess_region(
    region: str,
    orig_region_id: Optional[str] = None,
    orig_region_name: Optional[str] = None,
    data_root: str = DATA_ROOT,
    generate_preview: bool = GENERATE_PREVIEW
) -> Dict[str, object]:
    """
    Main entry point:
    - Uses backend/data/<region_slug> as the source of raw .tif/.tiff files
    - Creates backend/data/<region_slug>/<region_slug>_preprocessed_data
    - Extracts metadata, handles missing/outliers, and saves JSON (+ optional preview)
    """
    start = time.time()
    region_slug = to_region_slug(region)
    region_dir = os.path.join(data_root, region_slug)
    preprocessed_dir = os.path.join(region_dir, f"{region_slug}_preprocessed_data")

    _, region_created = ensure_dir(region_dir)
    _, pre_dir_created = ensure_dir(preprocessed_dir)

    # Look for .tif/.tiff directly under backend/data/<region_slug> (recursively)
    tif_files = list_tif_files(region_dir)

    saved_metadata_files: List[str] = []
    saved_previews: List[str] = []

    if not tif_files:
        logger.warning(f"No .tif/.tiff files found under {region_dir}")

    for tif in tif_files:
        try:
            info = extract_tif_metadata(tif, generate_preview=generate_preview, preview_dir=preprocessed_dir)
            base = os.path.splitext(os.path.basename(tif))[0]
            out_json = os.path.join(preprocessed_dir, f"{base}_metadata.json")
            with open(out_json, "w", encoding="utf-8") as f:
                json.dump(info, f, ensure_ascii=False, indent=2)
            saved_metadata_files.append(out_json)
            if info.get("preview_png"):
                saved_previews.append(info["preview_png"])
            logger.info(f"Saved metadata: {out_json}")
        except Exception as e:
            logger.error(f"Failed to process {tif}: {e}")

    # Summary
    summary = {
        "ok": True,
        "region_input": region,
        "region_slug": region_slug,
        "orig_region_id": orig_region_id,
        "orig_region_name": orig_region_name,
        "data_root": data_root,
        "region_dir": region_dir,
        "preprocessed_dir": preprocessed_dir,
        "created": {
            "region_dir_created": region_created,
            "preprocessed_dir_created": pre_dir_created
        },
        "files_scanned": len(tif_files),
        "metadata_files_saved": saved_metadata_files,
        "preview_files_saved": saved_previews,
        "duration_sec": round(time.time() - start, 3),
        "message": "Completed preprocessing." if tif_files else "No TIFF files found to preprocess (folders created)."
    }

    summary_path = os.path.join(preprocessed_dir, f"{region_slug}_preprocessing_summary.json")
    try:
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved summary: {summary_path}")
    except Exception as e:
        logger.warning(f"Failed to save summary {summary_path}: {e}")

    return summary


if __name__ == "__main__":
    # Allow CLI usage: python -m preprocessing.data_preprocessing <region>
    import sys
    region_arg = sys.argv[1] if len(sys.argv) > 1 else "kodagu"
    res = preprocess_region(region_arg)
    print(json.dumps(res, indent=2))
import os
import json
from typing import Optional, Dict, List, Tuple

import numpy as np
import rasterio
from sklearn.cluster import KMeans

# Reuse the same DATA_ROOT and slug function as preprocessing
from preprocessing.data_preprocessing import DATA_ROOT, to_region_slug


def _ensure_dir(path: str) -> str:
    os.makedirs(path, exist_ok=True)
    return path


def _list_metadata_json(preprocessed_dir: str) -> List[str]:
    if not os.path.isdir(preprocessed_dir):
        return []
    return sorted(
        [os.path.join(preprocessed_dir, f) for f in os.listdir(preprocessed_dir)
         if f.lower().endswith("_metadata.json") and os.path.isfile(os.path.join(preprocessed_dir, f))]
    )


def _choose_reference_tif(meta_files: List[str]) -> Optional[Dict]:
    """
    Choose a metadata JSON to reference for segmentation.
    Strategy: pick the largest raster (width*height).
    Returns parsed JSON dict or None.
    """
    best = None
    best_area = -1
    for jf in meta_files:
        try:
            with open(jf, "r", encoding="utf-8") as f:
                data = json.load(f)
            w = int(data.get("width", 0))
            h = int(data.get("height", 0))
            area = w * h
            if area > best_area:
                best_area = area
                best = data
        except Exception:
            continue
    return best


def _read_clean_bands(tif_path: str, max_bands: int = 3) -> Tuple[np.ndarray, int, int, int]:
    """
    Read up to max_bands bands from a GeoTIFF and perform basic cleaning:
    - Convert masked to NaN
    - Median imputation per band
    Returns: (H, W, C) float32, H, W, C
    """
    with rasterio.open(tif_path) as src:
        count = src.count
        c_use = min(max_bands, count) if count > 0 else 0
        if c_use == 0:
            raise RuntimeError(f"No bands to read in {tif_path}")

        arr_masked = src.read(indexes=list(range(1, c_use + 1)), masked=True).astype(np.float32)  # (C, H, W)
        arr = np.where(arr_masked.mask, np.nan, arr_masked.data).astype(np.float32)

        # Median imputation per band
        for b in range(c_use):
            band = arr[b]
            if np.isnan(band).all():
                median = 0.0
            else:
                median = float(np.nanmedian(band))
            band = np.where(np.isnan(band), median, band)
            arr[b] = band

        # Move to H, W, C
        h, w = arr.shape[1], arr.shape[2]
        x = np.transpose(arr[:c_use, :, :], (1, 2, 0)).astype(np.float32)  # (H, W, C)
        return x, h, w, c_use


def _predict_in_batches(model: KMeans, X: np.ndarray, batch_size: int = 1_000_000) -> np.ndarray:
    """
    Predict labels for X (N, C) in batches to reduce memory spikes.
    """
    n = X.shape[0]
    out = np.empty((n,), dtype=np.int32)
    start = 0
    while start < n:
        end = min(start + batch_size, n)
        out[start:end] = model.predict(X[start:end])
        start = end
    return out


def segment_preprocessed_data(region: str, n_clusters: int = 3, data_root: Optional[str] = None) -> Dict[str, object]:
    """
    Segment a region using KMeans on up to 3 bands of a reference GeoTIFF:
    - Looks for backend/data/<region>/<region>_preprocessed_data/*_metadata.json
    - Opens the referenced GeoTIFF, cleans data, runs KMeans
    - Writes backend/data/<region>/<region>_segmented_data/<region>_mask.npy

    Returns a result dict with paths and shape info.
    """
    try:
        region_slug = to_region_slug(region)
        root = os.path.abspath(data_root or DATA_ROOT)
        region_dir = os.path.join(root, region_slug)
        preprocessed_dir = os.path.join(region_dir, f"{region_slug}_preprocessed_data")
        segmented_dir = _ensure_dir(os.path.join(region_dir, f"{region_slug}_segmented_data"))

        meta_files = _list_metadata_json(preprocessed_dir)
        if not meta_files:
            return {
                "ok": False,
                "region_slug": region_slug,
                "preprocessed_dir": preprocessed_dir,
                "segmented_dir": segmented_dir,
                "message": f"No metadata JSON files found in {preprocessed_dir}. Ensure preprocessing ran on GeoTIFFs."
            }

        ref = _choose_reference_tif(meta_files)
        if not ref or not ref.get("file_path"):
            return {
                "ok": False,
                "region_slug": region_slug,
                "preprocessed_dir": preprocessed_dir,
                "segmented_dir": segmented_dir,
                "message": "Could not determine reference GeoTIFF from metadata."
            }

        tif_path = ref["file_path"]
        x, h, w, c = _read_clean_bands(tif_path, max_bands=3)

        # Prepare data for KMeans
        flat = x.reshape(-1, c)  # (H*W, C)

        # Train on a sample for speed if huge
        n_samples = min(200_000, flat.shape[0])
        rng = np.random.default_rng(seed=42)
        sample_idx = rng.choice(flat.shape[0], size=n_samples, replace=False)
        sample = flat[sample_idx]

        kmeans = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
        kmeans.fit(sample)

        labels = _predict_in_batches(kmeans, flat, batch_size=1_000_000).reshape(h, w)

        mask_path = os.path.join(segmented_dir, f"{region_slug}_mask.npy")
        np.save(mask_path, labels.astype(np.int16))

        # Basic distribution stats
        unique, counts = np.unique(labels, return_counts=True)
        cluster_dist = {int(k): int(v) for k, v in zip(unique, counts)}

        return {
            "ok": True,
            "region_slug": region_slug,
            "preprocessed_dir": preprocessed_dir,
            "segmented_dir": segmented_dir,
            "mask_path": mask_path,
            "mask_shape": [int(h), int(w)],
            "n_clusters": int(n_clusters),
            "used_tif": tif_path,
            "used_bands": int(c),
            "cluster_distribution": cluster_dist,
            "message": f"Segmentation mask saved: {mask_path}"
        }

    except Exception as e:
        return {
            "ok": False,
            "region_slug": to_region_slug(region),
            "message": f"Segmentation failed: {e}"
        }


if __name__ == "__main__":
    # Simple CLI test:
    # python -m segmentation.unet_segmentation kodagu
    import sys
    reg = sys.argv[1] if len(sys.argv) > 1 else "kodagu"
    out = segment_preprocessed_data(reg, n_clusters=3)
    print(json.dumps(out, indent=2))
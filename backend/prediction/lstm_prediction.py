import os
import json
import math
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import numpy as np
import rasterio

from preprocessing.data_preprocessing import DATA_ROOT, to_region_slug


def _list_metadata_json(preprocessed_dir: str) -> List[str]:
    if not os.path.isdir(preprocessed_dir):
        return []
    return sorted(
        [
            os.path.join(preprocessed_dir, f)
            for f in os.listdir(preprocessed_dir)
            if f.lower().endswith("_metadata.json")
            and os.path.isfile(os.path.join(preprocessed_dir, f))
        ]
    )


def _choose_reference_tif(meta_files: List[str]) -> Optional[Dict]:
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


def _pixel_area_km2_from_meta(meta: Dict) -> float:
    # Approximate pixel area using geographic CRS (degrees)
    # area ≈ (111.32 km * dLat) * (111.32 km * dLon * cos(latitude))
    res = meta.get("res", [None, None])
    if not res or res[0] is None or res[1] is None:
        # Fallback small-pixel assumption (1km)
        return 1.0
    dlon = float(res[0])
    dlat = float(res[1])
    bounds = meta.get("bounds", {})
    top = float(bounds.get("top", 0.0))
    bottom = float(bounds.get("bottom", 0.0))
    mean_lat = (top + bottom) / 2.0
    mean_lat_rad = math.radians(mean_lat)
    km_per_deg = 111.32
    lat_km = abs(dlat) * km_per_deg
    lon_km = abs(dlon) * km_per_deg * max(math.cos(mean_lat_rad), 1e-6)
    return lat_km * lon_km


def _impute_with_median(arr: np.ndarray, fill_value: float) -> np.ndarray:
    out = arr.astype(np.float32, copy=True)
    mask = ~np.isfinite(out)
    out[mask] = float(fill_value)
    return out


def risk_analysis(region: str) -> Dict[str, object]:
    """
    Compute forest fire risk distribution using slope/aspect from GeoTIFF
    and segmentation mask. Outputs high/moderate/low percentages and areas.
    """
    try:
        region_slug = to_region_slug(region)
        region_dir = os.path.join(os.path.abspath(DATA_ROOT), region_slug)
        preprocessed_dir = os.path.join(region_dir, f"{region_slug}_preprocessed_data")
        segmented_dir = os.path.join(region_dir, f"{region_slug}_segmented_data")
        mask_path = os.path.join(segmented_dir, f"{region_slug}_mask.npy")

        meta_files = _list_metadata_json(preprocessed_dir)
        if not meta_files:
            return {
                "ok": False,
                "region_slug": region_slug,
                "message": f"No metadata found in {preprocessed_dir}. Run preprocessing first."
            }

        ref = _choose_reference_tif(meta_files)
        if not ref or not ref.get("file_path"):
            return {
                "ok": False,
                "region_slug": region_slug,
                "message": "Could not determine reference GeoTIFF from metadata."
            }

        tif_path = ref["file_path"]
        pixel_area_km2 = _pixel_area_km2_from_meta(ref)

        # Read slope (band 1), aspect (band 2) - based on your TIFF convention
        with rasterio.open(tif_path) as src:
            h, w = src.height, src.width

            # Default medians from preprocessing (if present)
            med_slope = None
            med_aspect = None
            for b in ref.get("per_band", []):
                if b.get("band_index") == 1:
                    med_slope = float(b.get("median_imputed_value", 0.0))
                if b.get("band_index") == 2:
                    med_aspect = float(b.get("median_imputed_value", 0.0))
            if med_slope is None:  # safe fallbacks
                med_slope = 0.0
            if med_aspect is None:
                med_aspect = 0.0

            slope = src.read(1, masked=True).astype(np.float32)
            aspect = src.read(2, masked=True).astype(np.float32)

            slope = np.where(slope.mask, med_slope, slope.data).astype(np.float32)
            aspect = np.where(aspect.mask, med_aspect, aspect.data).astype(np.float32)

        # Derive risk score per pixel: combine slope and aspect
        # Normalize slope (cap at 45° for 0..1), southness from aspect (0=north, 1=south)
        slope_norm = np.clip(slope, 0.0, 45.0) / 45.0
        aspect_rad = np.deg2rad(aspect)
        southness = 0.5 * (1.0 - np.cos(aspect_rad))  # 0 at north, 1 at south

        # Weighted risk score (0..1)
        risk_score = 0.65 * slope_norm + 0.35 * southness

        # Load segmentation mask if present; aggregate risk at segment level
        if os.path.isfile(mask_path):
            mask = np.load(mask_path)
            if mask.shape != (h, w):
                # If mismatch, fallback to per-pixel classification
                mask = None
        else:
            mask = None

        high_count = 0
        moderate_count = 0
        low_count = 0

        if mask is not None:
            # Segment-wise classification: each segment gets its mean risk class
            unique_ids = np.unique(mask)
            for seg_id in unique_ids:
                seg_mask = (mask == seg_id)
                seg_mean = float(risk_score[seg_mask].mean())
                if seg_mean >= 0.66:
                    high_count += int(seg_mask.sum())
                elif seg_mean >= 0.33:
                    moderate_count += int(seg_mask.sum())
                else:
                    low_count += int(seg_mask.sum())
        else:
            # Per-pixel classification
            high_count = int(np.sum(risk_score >= 0.66))
            moderate_count = int(np.sum((risk_score >= 0.33) & (risk_score < 0.66)))
            low_count = int(np.sum(risk_score < 0.33))

        total_px = max(1, high_count + moderate_count + low_count)  # avoid div by zero

        # Areas (km²)
        high_area = high_count * pixel_area_km2
        moderate_area = moderate_count * pixel_area_km2
        low_area = low_count * pixel_area_km2
        total_area = high_area + moderate_area + low_area

        # Percentages
        high_pct = 100.0 * high_area / total_area if total_area > 0 else 0.0
        moderate_pct = 100.0 * moderate_area / total_area if total_area > 0 else 0.0
        low_pct = 100.0 * low_area / total_area if total_area > 0 else 0.0

        # Overall risk level = largest share
        shares = [("HIGH", high_pct), ("MODERATE", moderate_pct), ("LOW", low_pct)]
        shares.sort(key=lambda x: x[1], reverse=True)
        overall_risk = shares[0][0]

        # Simple confidence proxy: separation between top-2 classes
        top = shares[0][1]
        second = shares[1][1]
        confidence = max(0.55, min(0.99, 0.6 + 0.4 * ((top - second) / 100.0)))

        result = {
            "ok": True,
            "region_slug": region_slug,
            "used_tif": tif_path,
            "mask_path": mask_path if mask is not None else None,
            "pixel_area_km2": pixel_area_km2,
            "total_area_km2": total_area,
            "high_risk_area_km2": high_area,
            "moderate_risk_area_km2": moderate_area,
            "low_risk_area_km2": low_area,
            "high_risk_percent": high_pct,
            "moderate_risk_percent": moderate_pct,
            "low_risk_percent": low_pct,
            "overall_risk_level": overall_risk,
            "confidence": confidence,  # 0..1
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": "Risk analysis computed from slope/aspect and segmentation."
        }
        return result

    except Exception as e:
        return {
            "ok": False,
            "region_slug": to_region_slug(region),
            "message": f"Risk analysis failed: {e}"
        }


if __name__ == "__main__":
    # CLI test: python -m prediction.lstm_prediction kodagu
    import sys
    reg = sys.argv[1] if len(sys.argv) > 1 else "kodagu"
    out = risk_analysis(reg)
    print(json.dumps(out, indent=2))
import os
import json
from datetime import datetime
from typing import Dict, List

import numpy as np

try:
    from preprocessing.data_preprocessing import DATA_ROOT, to_region_slug
except ImportError:
    DATA_ROOT = "data"

    def to_region_slug(region: str) -> str:
        return region.lower().replace(" ", "_").replace("-", "_")


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


def risk_analysis(region: str) -> Dict[str, object]:
    """
    Computes fire-risk areas (km^2) by thresholding the risk map and
    returns the values for frontend visualization. No charts are created or displayed.
    """
    try:
        region_slug = to_region_slug(region)
        region_dir = os.path.join(os.path.abspath(DATA_ROOT), region_slug)
        preprocessed_dir = os.path.join(region_dir, f"{region_slug}_preprocessed_data")
        segmented_dir = os.path.join(region_dir, f"{region_slug}_segmented_data")
        prediction_dir = os.path.join(region_dir, f"{region_slug}_prediction")
        os.makedirs(prediction_dir, exist_ok=True)

        # Find the first _metadata.json file in preprocessed_dir
        meta_files = _list_metadata_json(preprocessed_dir)
        if not meta_files:
            return {
                "ok": False,
                "message": "No metadata JSON found in preprocessed data.",
                "region": region_slug,
            }

        # Use the first metadata file as reference
        meta_path = meta_files[0]
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        base_name = os.path.basename(meta_path).replace("_metadata.json", "")

        # Load the risk map (.npy). By convention this is often named *_mask.npy here.
        risk_map_path = os.path.join(segmented_dir, f"{base_name}_mask.npy")
        if not os.path.exists(risk_map_path):
            return {
                "ok": False,
                "message": f"No risk map .npy data found for {base_name}. Expected at: {risk_map_path}",
                "region": region_slug,
            }

        arr = np.load(risk_map_path)
        # Normalize to 2D for thresholding
        if arr.ndim == 3:
            # If multi-channel, average across channels; if shape (H, W, 1), squeeze it.
            if arr.shape[2] == 1:
                arr2d = arr[:, :, 0]
            else:
                arr2d = arr.mean(axis=2)
        elif arr.ndim == 2:
            arr2d = arr
        else:
            return {
                "ok": False,
                "message": f"Unexpected array shape for risk map: {arr.shape}",
                "region": region_slug,
            }

        # === RISK CALCULATION LOGIC ===
        HIGH_RISK_THRESHOLD = 0.7
        MODERATE_RISK_THRESHOLD = 0.4

        # Count pixels per risk band
        high_mask = arr2d > HIGH_RISK_THRESHOLD
        moderate_mask = (arr2d > MODERATE_RISK_THRESHOLD) & (~high_mask)
        low_mask = ~high_mask & ~moderate_mask

        high_count = int(np.count_nonzero(high_mask))
        moderate_count = int(np.count_nonzero(moderate_mask))
        low_count = int(np.count_nonzero(low_mask))

        total_pixels = high_count + moderate_count + low_count

        if total_pixels > 0:
            high_percent = (high_count / total_pixels) * 100.0
            moderate_percent = (moderate_count / total_pixels) * 100.0
            low_percent = (low_count / total_pixels) * 100.0
        else:
            high_percent = moderate_percent = low_percent = 0.0

        pixel_area_km2 = float(meta.get("pixel_area_km2", 1.0))
        high_area = high_count * pixel_area_km2
        moderate_area = moderate_count * pixel_area_km2
        low_area = low_count * pixel_area_km2

        # Overall risk and confidence
        shares = [("HIGH", high_percent), ("MODERATE", moderate_percent), ("LOW", low_percent)]
        shares.sort(key=lambda x: x[1], reverse=True)
        overall_risk = shares[0][0]
        top, second = shares[0][1], shares[1][1]
        confidence = max(0.55, min(0.99, 0.6 + 0.4 * ((top - second) / 100.0)))

        return {
            "ok": True,
            "region": region_slug,
            "high_risk_percent": high_percent,
            "moderate_risk_percent": moderate_percent,
            "low_risk_percent": low_percent,
            "high_risk_area_km2": high_area,
            "moderate_risk_area_km2": moderate_area,
            "low_risk_area_km2": low_area,
            "overall_risk_level": overall_risk,
            "confidence": confidence,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

    except Exception as e:
        return {
            "ok": False,
            "region": region,
            "message": f"Risk analysis failed: {e}",
        }


if __name__ == "__main__":
    import sys

    reg = sys.argv[1] if len(sys.argv) > 1 else "kodagu"
    out = risk_analysis(reg)
    # Print JSON only; no charts are displayed or saved.
    print(json.dumps(out, indent=2))
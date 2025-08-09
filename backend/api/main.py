# main.py
import sys
import os

# Allow imports from project root (one level up from this file)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from typing import Optional

import rasterio
import matplotlib.pyplot as plt
from rasterio.plot import show as rio_show

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Use region-based preprocessing
from preprocessing.data_preprocessing import preprocess_region, to_region_slug
from segmentation.unet_segmentation import segment_preprocessed_data
from prediction.lstm_prediction import risk_analysis
from simulation.cellular_automata import simulate_fire

app = FastAPI(title="Forest Fire API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- Schemas ---------
class SomeInputSchema(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    vegetation_index: float

class PreprocessRequest(BaseModel):
    regionId: Optional[str] = None
    regionName: Optional[str] = None


# --------- Health & Root ---------
@app.get("/")
def read_root():
    return {"message": "FastAPI is working!"}

@app.get("/api/health")
def health():
    return {"ok": True, "service": "preprocess", "status": "healthy"}


# --------- Region Preprocessing + Segmentation ---------
@app.post("/api/preprocess")
def api_preprocess(req: PreprocessRequest):
    """
    Triggers region-based preprocessing, then segmentation:
    - Creates /backend/data/<region> and /backend/data/<region>/<region>_preprocessed_data
    - Extracts metadata and cleans TIFFs in the region directory (if present)
    - Then runs KMeans segmentation and writes /backend/data/<region>/<region>_segmented_data/<region>_mask.npy
    """
    region = req.regionId or req.regionName
    if not region:
        raise HTTPException(status_code=400, detail="regionId or regionName is required")
    region_slug = to_region_slug(region)

    try:
        # Step 1: Preprocess
        pre_result = preprocess_region(
            region=region_slug,
            orig_region_id=req.regionId,
            orig_region_name=req.regionName
        )
        # Step 2: Segment immediately
        seg_result = segment_preprocessed_data(region_slug)

        # Combine response for frontend convenience
        combined = dict(pre_result)
        combined["segmentation"] = seg_result
        return JSONResponse(content=combined)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing/Segmentation failed: {e}")


# --------- Demo/Test Endpoints (optional) ---------
@app.get("/test")
def test_geotiff():
    """
    Simple raster info test. Adjust file_path to a valid raster file.
    """
    try:
        file_path = "C:/Users/sadha/forest-fire-duplicate/backend/data/bhoonidhi-files/P5_PAN_CD_N14_000_E074_000_30m.jpg"  # Replace with actual file path if needed
        with rasterio.open(file_path) as src:
            bounds = src.bounds
            crs = src.crs.to_string() if src.crs else None
            width = src.width
            height = src.height
            count = src.count
            dtype = src.dtypes[0]

        return JSONResponse(content={
            "status": "success",
            "file": file_path,
            "crs": crs,
            "dimensions": f"{width} x {height}",
            "bands": count,
            "data_type": dtype,
            "bounds": {
                "left": bounds.left,
                "bottom": bounds.bottom,
                "right": bounds.right,
                "top": bounds.top
            }
        })
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)})


@app.get("/predict")
def predict(region: str = Query(..., description="Region ID or name")):
    """
    Example pipeline endpoint:
    - Preprocess region (creates folders + metadata extraction)
    - Segment
    - Predict risk
    - Simulate fire spread
    """
    try:
        region_slug = to_region_slug(region)

        # Preprocess region (creates folders and processes TIFFs if present)
        preprocessed_summary = preprocess_region(region=region_slug)

        # Segmentation
        segmented = segment_preprocessed_data(region_slug)

        # Downstream steps (adjust to your actual function signatures)
        prediction = risk_analysis(preprocessed_summary)
        simulation_result = simulate_fire(prediction)

        return {
            "region_input": region,
            "region_slug": region_slug,
            "preprocessing_summary": preprocessed_summary,
            "segmentation": segmented,
            "fire_prediction": prediction,
            "simulation_result": simulation_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {e}")


@app.post("/api/predict")
async def predict_risk_endpoint(data: SomeInputSchema):
    """
    Simple placeholder prediction using provided weather/veg inputs.
    Replace with real model logic.
    """
    # Stub: Use your actual model here
    return {"prediction": "HIGH", "inputs": data.dict()}


@app.get("/preview")
def preview_geotiff(path: Optional[str] = Query(None, description="Full path to a raster file (.tif/.tiff)")):
    """
    Render a quick PNG preview of a given raster file path.
    Usage: /preview?path=C:/path/to/file.tif
    """
    try:
        if path is None:
            raise HTTPException(status_code=400, detail="Query parameter 'path' is required and must point to a file")
        if not os.path.isfile(path):
            raise HTTPException(status_code=404, detail=f"File not found: {path}")

        with rasterio.open(path) as src:
            fig, ax = plt.subplots(figsize=(6, 6))
            rio_show(src, ax=ax)
            plt.axis('off')
            preview_path = "preview.png"
            plt.savefig(preview_path, bbox_inches='tight', pad_inches=0)
            plt.close(fig)
            return FileResponse(preview_path)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render preview: {e}")# main.py
import sys
import os

# Allow imports from project root (one level up from this file)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from typing import Optional

import rasterio
import matplotlib.pyplot as plt
from rasterio.plot import show as rio_show

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Use region-based preprocessing
from preprocessing.data_preprocessing import preprocess_region, to_region_slug
from segmentation.unet_segmentation import segment_preprocessed_data
from prediction.lstm_prediction import risk_analysis
from simulation.cellular_automata import simulate_fire

app = FastAPI(title="Forest Fire API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- Schemas ---------
class SomeInputSchema(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    vegetation_index: float

class PreprocessRequest(BaseModel):
    regionId: Optional[str] = None
    regionName: Optional[str] = None


# --------- Health & Root ---------
@app.get("/")
def read_root():
    return {"message": "FastAPI is working!"}

@app.get("/api/health")
def health():
    return {"ok": True, "service": "preprocess", "status": "healthy"}


# --------- Region Preprocessing + Segmentation ---------
@app.post("/api/preprocess")
def api_preprocess(req: PreprocessRequest):
    """
    Triggers region-based preprocessing, then segmentation:
    - Creates /backend/data/<region> and /backend/data/<region>/<region>_preprocessed_data
    - Extracts metadata and cleans TIFFs in the region directory (if present)
    - Then runs KMeans segmentation and writes /backend/data/<region>/<region>_segmented_data/<region>_mask.npy
    """
    region = req.regionId or req.regionName
    if not region:
        raise HTTPException(status_code=400, detail="regionId or regionName is required")
    region_slug = to_region_slug(region)

    try:
        # Step 1: Preprocess
        pre_result = preprocess_region(
            region=region_slug,
            orig_region_id=req.regionId,
            orig_region_name=req.regionName
        )
        # Step 2: Segment immediately
        seg_result = segment_preprocessed_data(region_slug)

        # Combine response for frontend convenience
        combined = dict(pre_result)
        combined["segmentation"] = seg_result
        return JSONResponse(content=combined)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing/Segmentation failed: {e}")


# --------- Demo/Test Endpoints (optional) ---------
@app.get("/test")
def test_geotiff():
    """
    Simple raster info test. Adjust file_path to a valid raster file.
    """
    try:
        file_path = "C:/Users/sadha/forest-fire-duplicate/backend/data/bhoonidhi-files/P5_PAN_CD_N14_000_E074_000_30m.jpg"  # Replace with actual file path if needed
        with rasterio.open(file_path) as src:
            bounds = src.bounds
            crs = src.crs.to_string() if src.crs else None
            width = src.width
            height = src.height
            count = src.count
            dtype = src.dtypes[0]

        return JSONResponse(content={
            "status": "success",
            "file": file_path,
            "crs": crs,
            "dimensions": f"{width} x {height}",
            "bands": count,
            "data_type": dtype,
            "bounds": {
                "left": bounds.left,
                "bottom": bounds.bottom,
                "right": bounds.right,
                "top": bounds.top
            }
        })
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)})


@app.get("/predict")
def predict(region: str = Query(..., description="Region ID or name")):
    """
    Example pipeline endpoint:
    - Preprocess region (creates folders + metadata extraction)
    - Segment
    - Predict risk
    - Simulate fire spread
    """
    try:
        region_slug = to_region_slug(region)

        # Preprocess region (creates folders and processes TIFFs if present)
        preprocessed_summary = preprocess_region(region=region_slug)

        # Segmentation
        segmented = segment_preprocessed_data(region_slug)

        # Downstream steps (adjust to your actual function signatures)
        prediction = risk_analysis(preprocessed_summary)
        simulation_result = simulate_fire(prediction)

        return {
            "region_input": region,
            "region_slug": region_slug,
            "preprocessing_summary": preprocessed_summary,
            "segmentation": segmented,
            "fire_prediction": prediction,
            "simulation_result": simulation_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {e}")


@app.post("/api/predict")
async def predict_risk_endpoint(data: SomeInputSchema):
    """
    Simple placeholder prediction using provided weather/veg inputs.
    Replace with real model logic.
    """
    # Stub: Use your actual model here
    return {"prediction": "HIGH", "inputs": data.dict()}


@app.get("/preview")
def preview_geotiff(path: Optional[str] = Query(None, description="Full path to a raster file (.tif/.tiff)")):
    """
    Render a quick PNG preview of a given raster file path.
    Usage: /preview?path=C:/path/to/file.tif
    """
    try:
        if path is None:
            raise HTTPException(status_code=400, detail="Query parameter 'path' is required and must point to a file")
        if not os.path.isfile(path):
            raise HTTPException(status_code=404, detail=f"File not found: {path}")

        with rasterio.open(path) as src:
            fig, ax = plt.subplots(figsize=(6, 6))
            rio_show(src, ax=ax)
            plt.axis('off')
            preview_path = "preview.png"
            plt.savefig(preview_path, bbox_inches='tight', pad_inches=0)
            plt.close(fig)
            return FileResponse(preview_path)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render preview: {e}")
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import rasterio
from fastapi.responses import JSONResponse
import matplotlib.pyplot as plt
from fastapi.responses import FileResponse


from fastapi import FastAPI, Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from preprocessing.data_preprocessing import preprocess_all_data
from segmentation.unet_segmentation import segment_preprocessed_data
from prediction.lstm_prediction import risk_analysis
from simulation.cellular_automata import simulate_fire

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SomeInputSchema(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    vegetation_index: float

@app.get("/test")
def test_geotiff():
    try:
        file_path = "C:/Users/sadha/forest-fire-duplicate/backend/data/bhoonidhi-files/P5_PAN_CD_N14_000_E074_000_30m.jpg"  # Replace this with actual path
        with rasterio.open(file_path) as src:
            bounds = src.bounds
            crs = src.crs.to_string()
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
@app.get("/")
def read_root():
    return {"message": "FastAPI is working!"}

@app.get("/predict")
def predict(region: str = Query(...)):
    preprocessed = preprocess_all_data(region)
    segmented = segment_preprocessed_data(region)
    prediction = predict_fire(preprocessed)
    simulation_result = simulate_fire(prediction)
    
    return {
        "region": region,
        "preprocessing_summary": preprocessed,
        "segmented_fire_areas": segmented,
        "fire_prediction": prediction,
        "simulation_result": simulation_result
    }

@app.post("/api/predict")
async def predict_fire(data: SomeInputSchema):
    # Call your ML model / logic
    return {"prediction": "HIGH"}

@app.get("/preview")
def preview_geotiff():
    path = "C:/Users/sadha/forest-fire-duplicate/backend/data/GEE DATAS- KODAGU"
    with rasterio.open(path) as src:
        fig, ax = plt.subplots()
        rasterio.plot.show(src, ax=ax)
        plt.axis('off')
        preview_path = "preview.png"
        plt.savefig(preview_path, bbox_inches='tight', pad_inches=0)
        return FileResponse(preview_path)

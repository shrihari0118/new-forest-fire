import numpy as np
from PIL import Image
import rasterio

def extract_raster_data(raster_path):
    """
    Extracts data from a raster (.tif) file.
    Returns a numpy array.
    """
    try:
        with rasterio.open(raster_path) as src:
            data = src.read(1)  # Read the first band
            print("DEBUG: Inside extract_raster_data, data shape:", data.shape)
            print("DEBUG: Inside extract_raster_data, data sample:", data.flatten()[:10])
            return data
    except Exception as e:
        print(f"ERROR: Failed to extract raster data from {raster_path}: {e}")
        return np.array([])

def extract_image_features(image_path):
    """
    Extracts features from an image file (.jpg, .png, etc.).
    Returns a numpy array.
    """
    try:
        with Image.open(image_path) as img:
            img = img.convert('L')  # Convert to grayscale for simplicity
            data = np.array(img)
            print("DEBUG: Inside extract_image_features, data shape:", data.shape)
            print("DEBUG: Inside extract_image_features, data sample:", data.flatten()[:10])
            return data
    except Exception as e:
        print(f"ERROR: Failed to extract image features from {image_path}: {e}")
        return np.array([])
import os
import numpy as np
from PIL import Image
import rasterio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TARGET_SIZE = (224, 224)

def preprocess_tif(file_path, target_size=TARGET_SIZE):
    try:
        with rasterio.open(file_path) as src:
            logger.info(f"Opened .tif file: {file_path}")
            if src.count == 1:
                band = src.read(1)
                arr = np.stack([band]*3, axis=-1)
                logger.info("Single band detected. Converted to RGB by stacking.")
            else:
                arr = np.dstack([src.read(i) for i in range(1, 4)])
                logger.info("Multi-band detected. Using first 3 bands as RGB.")
            arr = arr.astype(np.float32)
            arr_min, arr_max = arr.min(), arr.max()
            if arr_max > 1:
                arr = (arr - arr_min) / (arr_max - arr_min)
            arr_uint8 = (arr * 255).astype(np.uint8)
            img = Image.fromarray(arr_uint8)
            img = img.resize(target_size)
            arr_resized = np.array(img).astype(np.float32) / 255.0
            logger.info(f".tif file preprocessed to shape {arr_resized.shape}")
            return arr_resized
    except Exception as e:
        logger.error(f"Failed to preprocess .tif file {file_path}: {e}")
        return None

def preprocess_image(file_path, target_size=TARGET_SIZE):
    try:
        with Image.open(file_path) as img:
            logger.info(f"Opened image file: {file_path}")
            if img.mode != 'RGB':
                img = img.convert('RGB')
                logger.info("Converted image to RGB.")
            img = img.resize(target_size)
            arr = np.array(img).astype(np.float32) / 255.0
            logger.info(f"Image file preprocessed to shape {arr.shape}")
            return arr
    except Exception as e:
        logger.error(f"Failed to preprocess image file {file_path}: {e}")
        return None

def preprocess_all_data():
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    search_dirs = [
        os.path.join(BASE_DIR, "data", "GEE DATAS- KODAGU"),
    ]
    preprocessed_dir = os.path.join(BASE_DIR, "data", "preprocessed_data")  # You must create this folder manually

    features = []
    used_files = []
    saved_files = []

    logger.info(f"Starting preprocessing for ALL files in the data folders.")

    for directory in search_dirs:
        if not os.path.exists(directory):
            logger.warning(f"Directory does not exist: {directory}")
            continue
        for fname in os.listdir(directory):
            file_path = os.path.join(directory, fname)
            arr = None
            if fname.lower().endswith('.tif'):
                arr = preprocess_tif(file_path)
            elif fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                arr = preprocess_image(file_path)
            if arr is not None:
                features.append(arr)
                used_files.append(file_path)
                # Save preprocessed array as .npy
                base_name = os.path.splitext(fname)[0]
                save_path = os.path.join(preprocessed_dir, f"{base_name}.npy")
                np.save(save_path, arr)
                saved_files.append(save_path)
                logger.info(f"Saved preprocessed data to {save_path}")

    if not features:
        logger.error("No features extracted. Preprocessing failed.")
        return {"error": "No data found for preprocessing."}

    combined = np.concatenate([f.flatten() for f in features]).reshape(1, -1)
    logger.info(f"Combined feature shape: {combined.shape}")

    return {
        "input_sources": used_files,
        "saved_files": saved_files,
        "original_shape": combined.shape,
        "preprocessed_sample": combined.tolist()
    }

if __name__ == "__main__":
    result = preprocess_all_data()
    print("\n=== Preprocessing Result ===")
    print(result)
    if "error" in result:
        print("\n[!] Data preprocessing FAILED.")
    else:
        print("\n[✓] Data preprocessing SUCCESSFUL!")
        print(f"Files used: {result['input_sources']}")
        print(f"Preprocessed files saved to: {result['saved_files']}")
        print(f"Combined feature shape: {result['original_shape']}")
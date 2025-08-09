import numpy as np
import os
from sklearn.cluster import KMeans

def extract_region_name_from_filename(filename):
    # Example: "Kodagu_20230801_image1.npy" -> "Kodagu"
    # You can adjust this logic based on your filename pattern
    base = os.path.splitext(filename)[0]
    region = base.split('_')[0]
    return region

def segment_preprocessed_data(preprocessed_dir, output_base_dir, n_clusters=3):
    npy_files = [f for f in os.listdir(preprocessed_dir) if f.endswith('.npy')]

    if not npy_files:
        print("No .npy files found in the preprocessed data folder.")
        return

    # Extract region name from the first file
    region_name = extract_region_name_from_filename(npy_files[0])
    region_output_dir = os.path.join(output_base_dir, region_name)
    if not os.path.exists(region_output_dir):
        os.makedirs(region_output_dir)
        print(f"Created folder: {region_output_dir}")

    for fname in npy_files:
        arr = np.load(os.path.join(preprocessed_dir, fname))
        h, w, c = arr.shape
        flat = arr.reshape(-1, c)
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        labels = kmeans.fit_predict(flat)
        mask = labels.reshape(h, w)

        # Save the mask in the region output folder
        mask_path = os.path.join(region_output_dir, fname.replace('.npy', '_mask.npy'))
        np.save(mask_path, mask)
        print(f"Segmentation mask saved: {mask_path}")

    print(f"\n[✓] Segmentation process COMPLETED for all files in: {preprocessed_dir}")
    print(f"Segmentation masks saved in: {region_output_dir}")

if __name__ == "__main__":
    # === SET YOUR PATHS HERE ===
    preprocessed_dir = "data/preprocessed_data"         # Path to your preprocessed .npy files
    output_base_dir = "data"       # Path where the region folder should be created

    segment_preprocessed_data(preprocessed_dir, output_base_dir)
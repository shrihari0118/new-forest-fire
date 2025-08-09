import numpy as np
import os

# Get the absolute path of this script
base_dir = os.path.dirname(os.path.abspath(__file__))

# Build the path to the .npy file
file_path = os.path.join(base_dir, "data", "kodagu", "kodagu_segmented_data", "kodagu_mask.npy")

# Check if file exists
if not os.path.exists(file_path):
    raise FileNotFoundError(f"File not found: {file_path}")

# Load the .npy file
data = np.load(file_path, allow_pickle=True)

# Print basic info
print("Data shape:", data.shape)
print("Data type:", data.dtype)

# Optional: print first few values
print("Sample data:\n", data[:5])





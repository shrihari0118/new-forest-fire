import os
import rasterio

# Set your root directory and metadata output directory
root_dir = 'data/GEE DATAS- KODAGU'
metadata_dir = 'data/KODAGU-METADATA'

# Create the metadata directory if it doesn't exist
os.makedirs(metadata_dir, exist_ok=True)

# Recursively find all .tif files
tif_files = []
for dirpath, dirnames, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.lower().endswith('.tif'):
            tif_files.append(os.path.join(dirpath, filename))

if not tif_files:
    print("No .tif files found in the directory.")
else:
    for tif_file in tif_files:
        print(f"\nExtracting metadata from: {tif_file}")
        try:
            with rasterio.open(tif_file) as src:
                meta = {}
                meta['file_name'] = os.path.basename(tif_file)
                meta['crs'] = str(src.crs)
                meta['bounds'] = str(src.bounds)
                meta['width'] = src.width
                meta['height'] = src.height
                meta['count'] = src.count
                meta['driver'] = src.driver
                meta['transform'] = str(src.transform)
                meta['nodata'] = src.nodata

                # Center coordinates
                bounds = src.bounds
                center_x = (bounds.left + bounds.right) / 2
                center_y = (bounds.top + bounds.bottom) / 2
                meta['center_coordinates'] = f"({center_x}, {center_y})"

                # All tags
                tags = src.tags()
                meta['tags'] = tags

                # Search for weather and temperature in tags
                weather_info = {}
                for k, v in tags.items():
                    if 'weather' in k.lower() or 'weather' in str(v).lower():
                        weather_info[k] = v
                    if 'temp' in k.lower() or 'temp' in str(v).lower():
                        weather_info[k] = v
                if weather_info:
                    meta['weather_and_temperature'] = weather_info

                # Write metadata to a text file
                region_name = os.path.splitext(os.path.basename(tif_file))[0]
                metadata_file = os.path.join(metadata_dir, f"{region_name}.txt")
                with open(metadata_file, 'w', encoding='utf-8') as f:
                    for key, value in meta.items():
                        f.write(f"{key}: {value}\n")
                print(f"Metadata written to: {metadata_file}")
        except Exception as e:
            print(f"Failed to extract metadata from {tif_file}: {e}")

print(f"\nAll metadata files are saved in: {metadata_dir}")
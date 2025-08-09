import os
import numpy as np
import matplotlib.pyplot as plt

def risk_analysis(region_name="Kodagu"):
    preprocessed_dir = "data/preprocessed_data"
    segmentation_dir = f"data/{region_name}"
    risk_output_dir = f"data/risk_maps/{region_name}"

    os.makedirs(risk_output_dir, exist_ok=True)

    HIGH_RISK_THRESHOLD = 0.7
    MODERATE_RISK_THRESHOLD = 0.4

    def classify_risk(mean_value):
        if mean_value > HIGH_RISK_THRESHOLD:
            return 2  # High risk
        elif mean_value > MODERATE_RISK_THRESHOLD:
            return 1  # Moderate risk
        else:
            return 0  # Low risk

    risk_labels = {0: "Low Risk", 1: "Moderate Risk", 2: "High Risk"}
    risk_counts = {0: 0, 1: 0, 2: 0}
    total_pixels = 0

    mask_files = [f for f in os.listdir(segmentation_dir) if f.endswith('_mask.npy')]

    if not mask_files:
        print("No segmentation mask files found in the segmentation folder.")
        return {"error": "No segmentation mask files found."}

    for mask_fname in mask_files:
        base_name = mask_fname.replace('_mask.npy', '.npy')
        preprocessed_path = os.path.join(preprocessed_dir, base_name)
        mask_path = os.path.join(segmentation_dir, mask_fname)

        if not os.path.exists(preprocessed_path):
            print(f"Preprocessed file not found for {mask_fname}, skipping.")
            continue

        arr = np.load(preprocessed_path)
        mask = np.load(mask_path)
        h, w, c = arr.shape

        for seg_id in np.unique(mask):
            segment_pixels = arr[mask == seg_id]
            mean_intensity = segment_pixels.mean()
            print(f"Segment {seg_id}: mean_intensity={mean_intensity:.3f}")  # Debug print
            risk = classify_risk(mean_intensity)
            risk_counts[risk] += np.sum(mask == seg_id)
            total_pixels += np.sum(mask == seg_id)

    if total_pixels > 0:
        percentages = {k: (v / total_pixels) * 100 for k, v in risk_counts.items()}
    else:
        percentages = {0: 0, 1: 0, 2: 0}

    print("\nRisk Analysis Results (across all images):")
    print(f"High Risk: {percentages[2]:.2f}%")
    print(f"Moderate Risk: {percentages[1]:.2f}%")
    print(f"Low Risk: {percentages[0]:.2f}%")

    labels = [risk_labels[2], risk_labels[1], risk_labels[0]]
    sizes = [percentages[2], percentages[1], percentages[0]]
    colors = ['red', 'gold', 'green']  # gold for moderate risk

    pie_chart_path = os.path.join(risk_output_dir, f"{region_name}_riskanalysis.jpg")
    if sum(sizes) > 0:
        plt.figure(figsize=(6, 6))
        wedges, texts, autotexts = plt.pie(
            sizes, labels=labels, colors=colors, autopct='%1.1f%%',
            startangle=140, wedgeprops={'width': 0.4}
        )
        plt.title("Forest Fire Risk Distribution")
        plt.axis('equal')
        plt.savefig(pie_chart_path)
        plt.show()
        print(f"Donut chart saved at: {pie_chart_path}")
    else:
        print("No risk data to plot. All risk counts are zero.")

    print(f"\n[✓] Risk analysis prediction COMPLETED for all files in: {preprocessed_dir}")
    print(f"Risk donut chart saved in: {pie_chart_path}")
    print("Risk categories: 0=Low, 1=Moderate, 2=High")

    # Optionally, return the results as a dictionary
    return {
        "high_risk_percent": percentages[2],
        "moderate_risk_percent": percentages[1],
        "low_risk_percent": percentages[0],
        "pie_chart_path": pie_chart_path
    }

# Example usage (uncomment to run as a script)
# if __name__ == "__main__":
#     result = risk_analysis("Kodagu")
#     print(result)
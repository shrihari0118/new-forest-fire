def simulate_fire(prediction_result):
    score = prediction_result.get("fire_risk_score", 0.0)

    spread_area = round(score * 1000, 2)  # Dummy formula
    if score > 0.7:
        severity = "Severe"
    elif score > 0.4:
        severity = "Moderate"
    else:
        severity = "Mild"

    return {
        "spread_estimate": spread_area,
        "severity": severity
    }

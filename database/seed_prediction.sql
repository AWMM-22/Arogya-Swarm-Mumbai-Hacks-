-- Insert sample surge prediction with forecast data
INSERT INTO surge_predictions (
    forecast_horizon,
    surge_likelihood,
    confidence_score,
    predicted_patient_increase,
    departments_affected,
    contributing_factors,
    reasoning,
    status
) VALUES (
    '48h',
    'medium',
    75,
    '+15-25%',
    '["ER", "General"]'::jsonb,
    '{
        "aqi": "moderate", 
        "weather": "humid", 
        "events": [],
        "forecast_data": [
            {"time": "Now", "predicted": 45, "lower": 40, "upper": 50},
            {"time": "+6h", "predicted": 52, "lower": 47, "upper": 57},
            {"time": "+12h", "predicted": 58, "lower": 52, "upper": 64},
            {"time": "+18h", "predicted": 65, "lower": 58, "upper": 72},
            {"time": "+24h", "predicted": 72, "lower": 65, "upper": 79},
            {"time": "+30h", "predicted": 68, "lower": 61, "upper": 75},
            {"time": "+36h", "predicted": 62, "lower": 56, "upper": 68},
            {"time": "+42h", "predicted": 58, "lower": 52, "upper": 64},
            {"time": "+48h", "predicted": 55, "lower": 49, "upper": 61}
        ]
    }'::jsonb,
    'Based on current AQI levels (moderate) and weather patterns showing increased humidity, we predict a moderate surge in respiratory cases over the next 48 hours. Emergency and General departments are most likely to be affected.',
    'active'
) ON CONFLICT DO NOTHING;

-- Insert sample recommendations
INSERT INTO recommendations (
    recommendation_type,
    title,
    description,
    priority,
    estimated_cost_impact,
    reasoning,
    status,
    created_by_agent
) VALUES 
(
    'staff_reallocation',
    'Increase ER Staff for Evening Shift',
    'Reallocate 2 nurses from General ward to ER for evening shift to handle predicted surge',
    'high',
    -5000.00,
    'Predictive models show 20% increase in ER admissions. Proactive staffing will reduce wait times and prevent overtime costs.',
    'pending',
    'StaffReallocationAgent'
),
(
    'supply_order',
    'Stock Up on Respiratory Medications',
    'Order additional inhalers, nebulizers, and oxygen supplies',
    'medium',
    -3000.00,
    'Expected increase in respiratory cases due to air quality. Bulk ordering now saves 15% vs emergency procurement.',
    'pending',
    'SupplyChainAgent'
),
(
    'patient_advisory',
    'Send Air Quality Alert to At-Risk Patients',
    'Send SMS/WhatsApp alerts to asthma and COPD patients about air quality and preventive measures',
    'medium',
    -1000.00,
    'Proactive patient education can reduce preventable ER visits by 10-15%.',
    'pending',
    'PatientAdvisoryAgent'
);

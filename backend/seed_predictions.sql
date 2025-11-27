-- Seed data for surge predictions
INSERT INTO surge_predictions (id, prediction_time, surge_likelihood, confidence_score, departments_affected, forecast_data, created_at) VALUES 
(uuid_generate_v4(), NOW() + INTERVAL '2 hours', 'medium', 0.75, ARRAY['ER', 'ICU'], 
'[
  {"time": "14:00", "predicted": 45, "lower": 40, "upper": 50},
  {"time": "15:00", "predicted": 52, "lower": 47, "upper": 57},
  {"time": "16:00", "predicted": 48, "lower": 43, "upper": 53},
  {"time": "17:00", "predicted": 55, "lower": 50, "upper": 60},
  {"time": "18:00", "predicted": 62, "lower": 57, "upper": 67}
]'::jsonb, 
NOW())
ON CONFLICT DO NOTHING;

SELECT * FROM surge_predictions ORDER BY created_at DESC LIMIT 1;

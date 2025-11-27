-- Insert Beds (400 total for medium-large hospital)
-- ER Beds (50)
INSERT INTO beds (bed_number, department, status) VALUES
('ER-001', 'ER', 'available'),
('ER-002', 'ER', 'occupied'),
('ER-003', 'ER', 'occupied'),
('ER-004', 'ER', 'available'),
('ER-005', 'ER', 'occupied');
-- Note: Generate remaining 45 ER beds programmatically

-- ICU Beds (40)
INSERT INTO beds (bed_number, department, status) VALUES
('ICU-001', 'ICU', 'available'),
('ICU-002', 'ICU', 'occupied'),
('ICU-003', 'ICU', 'occupied'),
('ICU-004', 'ICU', 'occupied');
-- Note: Generate remaining 36 ICU beds programmatically

-- General Ward (250)
INSERT INTO beds (bed_number, department, status) VALUES
('GEN-001', 'General', 'available'),
('GEN-002', 'General', 'occupied'),
('GEN-003', 'General', 'available');
-- Note: Generate remaining 247 general beds programmatically

-- Pediatric (60)
INSERT INTO beds (bed_number, department, status) VALUES
('PED-001', 'Pediatric', 'available'),
('PED-002', 'Pediatric', 'occupied');
-- Note: Generate remaining 58 pediatric beds programmatically

-- Insert Staff (120 total staff)
-- Doctors (30)
INSERT INTO staff (name, role, specialization, shift, hours_worked_week, fatigue_score) VALUES
('Dr. Anil Sharma', 'doctor', 'Emergency Medicine', 'morning', 42, 35),
('Dr. Priya Desai', 'doctor', 'Cardiology', 'morning', 38, 20),
('Dr. Rajesh Kumar', 'doctor', 'Orthopedics', 'evening', 40, 45),
('Dr. Sneha Patel', 'doctor', 'Pediatrics', 'morning', 36, 15),
('Dr. Vikram Singh', 'doctor', 'General Medicine', 'night', 44, 55),
('Dr. Kavita Reddy', 'doctor', 'Infectious Disease', 'evening', 40, 30);

-- Nurses (70)
INSERT INTO staff (name, role, specialization, shift, hours_worked_week, fatigue_score) VALUES
('Nurse Anita Singh', 'nurse', 'ER', 'morning', 44, 50),
('Nurse Kavita Reddy', 'nurse', 'ICU', 'night', 46, 60),
('Nurse Ravi Patil', 'nurse', 'General', 'morning', 40, 35),
('Nurse Pooja Gupta', 'nurse', 'Pediatric', 'evening', 42, 40),
('Nurse Amit Mehta', 'nurse', 'ER', 'evening', 45, 55),
('Nurse Sunita Joshi', 'nurse', 'ICU', 'morning', 43, 45);

-- Support Staff (20)
INSERT INTO staff (name, role, specialization, shift, hours_worked_week, fatigue_score) VALUES
('Ravi Patil', 'support', 'Transport', 'morning', 40, 25),
('Suresh Kumar', 'support', 'Cleaning', 'evening', 40, 30),
('Lakshmi Nair', 'support', 'Admin', 'morning', 38, 20);

-- Insert Critical Inventory Items
INSERT INTO inventory (item_name, category, current_stock, minimum_threshold, unit, supplier, unit_cost) VALUES
('Oxygen Cylinders', 'consumable', 45, 50, 'units', 'MedSupply India', 800.00),
('N95 Masks', 'consumable', 1200, 1000, 'boxes', 'SafeHealth Corp', 150.00),
('IV Fluids (1L)', 'medicine', 300, 250, 'units', 'PharmaCare', 80.00),
('Paracetamol 500mg', 'medicine', 5000, 3000, 'tablets', 'GenericMeds', 2.50),
('Surgical Gloves', 'consumable', 800, 500, 'boxes', 'MedSupply India', 120.00),
('Blood Bags', 'consumable', 30, 40, 'units', 'BloodBank Network', 450.00),
('Ventilator Filters', 'equipment', 15, 20, 'units', 'VentTech Solutions', 1200.00),
('Disposable Syringes', 'consumable', 2500, 2000, 'boxes', 'MedSupply India', 80.00),
('Bandages', 'consumable', 600, 500, 'rolls', 'First Aid Co', 30.00),
('Antiseptic Solution', 'medicine', 120, 100, 'bottles', 'PharmaCare', 150.00);

-- Insert Equipment
INSERT INTO equipment (equipment_name, equipment_type, status, location, last_maintenance) VALUES
('Ventilator-001', 'ventilator', 'operational', 'ICU-A', NOW() - INTERVAL '15 days'),
('Ventilator-002', 'ventilator', 'operational', 'ICU-B', NOW() - INTERVAL '10 days'),
('X-Ray-001', 'xray', 'operational', 'Radiology', NOW() - INTERVAL '30 days'),
('ECG-001', 'ecg', 'maintenance', 'ER', NOW() - INTERVAL '2 days'),
('Ventilator-003', 'ventilator', 'operational', 'ICU-C', NOW() - INTERVAL '20 days');

-- Insert Historical Surge Data (for learning)
INSERT INTO historical_surges (event_date, event_type, peak_patient_count, duration_hours, departments_affected, lessons_learned) VALUES
('2024-11-01', 'pollution', 180, 48, 'ER, Respiratory', 'Increase O2 stock during Diwali period'),
('2024-08-15', 'outbreak', 210, 72, 'ER, Infectious Disease', 'Dengue cases spike in monsoon, prepare IV fluids'),
('2024-12-31', 'accident', 95, 12, 'ER, Orthopedics', 'New Year eve trauma surge, extra staff needed'),
('2024-05-20', 'heatwave', 145, 36, 'ER, General', 'Heat stroke cases peak 2-4 hours after temperature peak'),
('2024-03-10', 'festival', 120, 24, 'ER, Trauma', 'Festival gatherings lead to stampede injuries');

-- Insert Sample Patient Queue
INSERT INTO patient_queue (patient_name, department, priority, estimated_wait_time) VALUES
('Patient A', 'ER', 'critical', 0),
('Patient B', 'ER', 'high', 15),
('Patient C', 'General', 'medium', 45),
('Patient D', 'ER', 'high', 20),
('Patient E', 'Pediatric', 'low', 60);

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HOSPITAL INFRASTRUCTURE TABLES
-- ============================================

-- Beds Table
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bed_number VARCHAR(20) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL, -- 'ER', 'ICU', 'General', 'Pediatric'
    status VARCHAR(20) NOT NULL, -- 'available', 'occupied', 'maintenance', 'reserved'
    patient_id UUID,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff Table
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'doctor', 'nurse', 'support'
    specialization VARCHAR(100),
    shift VARCHAR(20), -- 'morning', 'evening', 'night'
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'on_duty', 'on_leave'
    hours_worked_week INT DEFAULT 0,
    fatigue_score INT DEFAULT 0, -- 0-100 (higher = more fatigued)
    last_assigned TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Table
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- 'medicine', 'equipment', 'consumable'
    current_stock INT NOT NULL,
    minimum_threshold INT NOT NULL,
    unit VARCHAR(20), -- 'units', 'liters', 'boxes'
    last_restocked TIMESTAMP,
    supplier VARCHAR(100),
    unit_cost DECIMAL(10, 2)
);

-- Equipment Table
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_name VARCHAR(100) NOT NULL,
    equipment_type VARCHAR(50), -- 'ventilator', 'xray', 'ecg'
    status VARCHAR(20) DEFAULT 'operational', -- 'operational', 'maintenance', 'broken'
    location VARCHAR(50),
    last_maintenance TIMESTAMP
);

-- Patient Queue Table
CREATE TABLE patient_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_name VARCHAR(100),
    arrival_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    department VARCHAR(50),
    priority VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
    estimated_wait_time INT, -- minutes
    status VARCHAR(20) DEFAULT 'waiting' -- 'waiting', 'in_progress', 'completed'
);

-- ============================================
-- AGENT SYSTEM TABLES
-- ============================================

-- Agent Activity Log
CREATE TABLE agent_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(50) NOT NULL,
    action_type VARCHAR(50), -- 'prediction', 'recommendation', 'execution'
    description TEXT,
    confidence_score INT, -- 0-100
    reasoning TEXT, -- Explainable AI reasoning
    data_sources JSONB, -- Sources used for decision
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Surge Predictions
CREATE TABLE surge_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    forecast_horizon VARCHAR(20), -- '24h', '48h', '72h'
    surge_likelihood VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    confidence_score INT, -- 0-100
    predicted_patient_increase VARCHAR(20), -- '+10-20%', '+20-50%', etc
    departments_affected JSONB, -- ['ER', 'ICU', 'Pediatric']
    contributing_factors JSONB, -- pollution, weather, events
    reasoning TEXT, -- AI reasoning for prediction
    status VARCHAR(20) DEFAULT 'active' -- 'active', 'validated', 'false_alarm'
);

-- Recommendations
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_type VARCHAR(50), -- 'staff_reallocation', 'supply_order', 'patient_advisory'
    title VARCHAR(200),
    description TEXT,
    priority VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
    estimated_cost_impact DECIMAL(10, 2), -- Negative = savings, Positive = cost
    reasoning TEXT, -- AI reasoning for recommendation
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'executed'
    created_by_agent VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    outcome TEXT
);

-- External Data Cache
CREATE TABLE external_data_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_type VARCHAR(50), -- 'weather', 'aqi', 'event', 'twitter'
    data_payload JSONB,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Historical Surge Events
CREATE TABLE historical_surges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_date DATE,
    event_type VARCHAR(50), -- 'pollution', 'festival', 'outbreak', 'accident'
    peak_patient_count INT,
    duration_hours INT,
    departments_affected VARCHAR(200),
    lessons_learned TEXT
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_beds_status ON beds(status);
CREATE INDEX idx_beds_department ON beds(department);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_shift ON staff(shift);
CREATE INDEX idx_inventory_stock ON inventory(current_stock, minimum_threshold);
CREATE INDEX idx_agent_activity_time ON agent_activity_log(created_at DESC);
CREATE INDEX idx_recommendations_status ON recommendations(status);
CREATE INDEX idx_external_data_expires ON external_data_cache(expires_at);

-- ============================================
-- VIEWS FOR QUICK QUERIES
-- ============================================

-- Current Hospital Capacity View
CREATE VIEW current_capacity AS
SELECT 
    department,
    COUNT(*) as total_beds,
    SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds,
    SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
    ROUND(100.0 * SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) / COUNT(*), 2) as occupancy_rate
FROM beds
GROUP BY department;

-- Staff Availability View
CREATE VIEW staff_availability AS
SELECT 
    shift,
    role,
    COUNT(*) as total_staff,
    SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_count,
    AVG(fatigue_score) as avg_fatigue
FROM staff
GROUP BY shift, role;

-- Critical Inventory View
CREATE VIEW critical_inventory AS
SELECT 
    item_name,
    current_stock,
    minimum_threshold,
    unit,
    (minimum_threshold - current_stock) as shortage_units,
    supplier
FROM inventory
WHERE current_stock < minimum_threshold;

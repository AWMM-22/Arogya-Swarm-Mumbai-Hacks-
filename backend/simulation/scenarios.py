# Crisis simulation scenarios

def load_scenario(crisis_type: str):
    """Load crisis scenario data based on type"""
    
    scenarios = {
        "pollution": {
            "name": "Air Quality Crisis",
            "description": "Severe air pollution spike causing respiratory distress",
            "aqi": 350,
            "expected_surge": 45,
            "affected_departments": ["Emergency", "Respiratory", "Pediatrics"],
            "duration_hours": 48,
            "severity": "high"
        },
        "dengue": {
            "name": "Dengue Outbreak",
            "description": "Seasonal dengue outbreak with multiple cases",
            "expected_surge": 30,
            "affected_departments": ["Emergency", "Internal Medicine", "Pediatrics"],
            "duration_hours": 72,
            "severity": "medium"
        },
        "trauma": {
            "name": "Mass Casualty Event",
            "description": "Major accident requiring emergency trauma care",
            "expected_surge": 60,
            "affected_departments": ["Emergency", "Trauma", "Surgery", "ICU"],
            "duration_hours": 24,
            "severity": "critical"
        }
    }
    
    return scenarios.get(crisis_type, scenarios["pollution"])

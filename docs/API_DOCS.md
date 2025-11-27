# Arogya-Swarm API Documentation

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
Currently using development mode. In production, implement JWT tokens.

---

## Hospital Resources

### Get Bed Availability
```http
GET /beds?department={dept}
```

**Query Parameters:**
- `department` (optional): Filter by department (ER, ICU, General, Pediatric)

**Response:**
```json
{
  "ER": {
    "total": 50,
    "available": 12,
    "occupied": 38
  },
  "ICU": {
    "total": 40,
    "available": 5,
    "occupied": 35
  }
}
```

### Get Staff Availability
```http
GET /staff?shift={shift}
```

**Query Parameters:**
- `shift` (optional): Filter by shift (morning, evening, night)

**Response:**
```json
{
  "total": 120,
  "available": 45,
  "on_duty": 75,
  "avg_fatigue": 42.5
}
```

### Get Inventory Status
```http
GET /inventory?critical_only={bool}
```

**Query Parameters:**
- `critical_only` (optional): Show only items below threshold (default: false)

**Response:**
```json
[
  {
    "item": "Oxygen Cylinders",
    "current": 45,
    "threshold": 50,
    "status": "critical"
  }
]
```

---

## Predictions

### Get Latest Prediction
```http
GET /predictions/latest
```

**Response:**
```json
{
  "id": "uuid",
  "prediction_time": "2024-11-26T10:30:00",
  "surge_likelihood": "high",
  "confidence_score": 85,
  "departments_affected": ["ER", "Respiratory"],
  "time_horizon": "24h",
  "contributing_factors": {
    "aqi": 380,
    "weather": "extreme_heat",
    "events": ["Diwali"]
  }
}
```

### Get Prediction History
```http
GET /predictions/history?limit={n}
```

**Query Parameters:**
- `limit` (optional): Number of predictions to return (default: 10)

**Response:**
```json
[
  {
    "id": "uuid",
    "prediction_time": "2024-11-26T10:30:00",
    "surge_likelihood": "high",
    "confidence_score": 85
  }
]
```

---

## Recommendations

### Get Recommendations
```http
GET /recommendations?status={status}
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, rejected)

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "staff_reallocation",
    "title": "Reallocate 5 nurses to ER",
    "description": "Move nurses from General ward to handle surge",
    "priority": "high",
    "estimated_cost": -15000,
    "status": "pending",
    "reasoning": "ER at 24% capacity, predicted 45% surge in 24h",
    "created_at": "2024-11-26T10:30:00"
  }
]
```

### Approve Recommendation
```http
POST /recommendations/{id}/approve
```

**Response:**
```json
{
  "message": "Recommendation approved",
  "recommendation": {
    "id": "uuid",
    "status": "approved",
    "executed_at": "2024-11-26T10:35:00"
  }
}
```

### Reject Recommendation
```http
POST /recommendations/{id}/reject
```

**Request Body:**
```json
{
  "reason": "Manual override - insufficient staff available"
}
```

**Response:**
```json
{
  "message": "Recommendation rejected"
}
```

---

## Analytics

### Get Cost Savings
```http
GET /analytics/cost-savings
```

**Response:**
```json
{
  "total_savings": 65000,
  "total_costs": 20000,
  "net_savings": 45000,
  "roi_percentage": 225,
  "recommendations_count": 12
}
```

---

## Simulation (Demo)

### Trigger Crisis Scenario
```http
POST /simulation/trigger-crisis
```

**Request Body:**
```json
{
  "crisis_type": "pollution"
}
```

**Available Crisis Types:**
- `pollution` - Diwali pollution surge
- `dengue` - Monsoon dengue outbreak
- `trauma` - Weekend trauma surge
- `heatwave` - Heat wave emergency

**Response:**
```json
{
  "message": "Crisis simulation 'pollution' triggered",
  "scenario": {
    "name": "Diwali Pollution Surge",
    "duration": "48 hours",
    "severity": "high"
  }
}
```

### Manually Trigger Agent
```http
POST /agent/run
```

**Response:**
```json
{
  "message": "Agent workflow started",
  "status": "processing"
}
```

---

## WebSocket

### Real-time Updates
```
ws://localhost:8000/ws
```

**Message Format:**
```json
{
  "type": "agent_update",
  "surge_prediction": {...},
  "recommendations": [...],
  "messages": ["[Sentinel] Surge detected"],
  "timestamp": "2024-11-26T10:30:00"
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error message"
}
```

---

## Rate Limits

- Development: No rate limits
- Production: 100 requests/minute per IP

---

## Full API Documentation

Interactive documentation available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

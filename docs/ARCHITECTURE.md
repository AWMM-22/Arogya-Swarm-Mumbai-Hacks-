# Arogya-Swarm Architecture

## System Overview

Arogya-Swarm is a multi-agent AI system built on LangGraph that coordinates specialized agents to manage hospital operations during crisis surges.

## Agent Architecture

### 1. Sentinel Agent (Watcher)
**Purpose:** Monitor external threats

**Tools:**
- OpenWeatherMap API (weather data)
- SAFAR-Air API (India AQI)
- Prophet (time-series forecasting)
- Twitter API mock (social sentiment)

**Workflow:**
```
External Data → Sentinel Agent → Statistical Forecast → LLM Analysis → Surge Prediction
```

**Output:**
```json
{
  "surge_likelihood": "high",
  "confidence_score": 85,
  "predicted_increase": "45%",
  "departments_affected": ["ER", "Respiratory"],
  "time_horizon": "24h",
  "reasoning": "AQI at 380, historical pattern shows 50% surge"
}
```

### 2. Orchestrator Agent (Brain)
**Purpose:** Reason and plan response

**Framework:** ReAct (Reasoning + Acting)

**Tools:**
- QueryLogistics (hospital state)
- CalculateCost (financial impact)
- CheckHistorical (past patterns)

**Workflow:**
```
Thought: "Surge detected in ER"
Action: QueryLogistics(query_type='beds', department='ER')
Observation: "12/50 beds available"
Thought: "Need more staff"
Action: CalculateCost(action='overtime_staff', hours=20)
Observation: "Cost: ₹24,000"
Final Answer: [Recommendations]
```

### 3. Logistics Agent (Data Layer)
**Purpose:** Query hospital resources

**Data Sources:**
- PostgreSQL (beds, staff, inventory, queue)
- Redis (cached external data)

**Methods:**
- `get_bed_availability(department)`
- `get_staff_availability(shift)`
- `get_inventory_status(critical_only)`
- `get_patient_queue_length(department)`

### 4. Action Agents (Executors)

#### Staff Reallocation Agent
- Drafts staff movement plans
- Calculates fatigue scores
- Estimates overtime costs
- Outputs: Specific staff assignments

#### Supply Chain Agent
- Auto-drafts purchase orders
- Compares vendor prices
- Calculates delivery ETAs
- Outputs: PO with approval workflow

#### Patient Advisory Agent
- Generates multi-language SMS
- Creates app notifications
- Suggests alternative hospitals
- Outputs: Messages in EN/HI/MR

## Data Flow

```
┌─────────────┐
│   Weather   │──┐
│     AQI     │  │
│   Events    │  │
└─────────────┘  │
                 │
                 ▼
         ┌───────────────┐
         │  Sentinel     │
         │  Agent        │
         └───────┬───────┘
                 │ Prediction
                 ▼
         ┌───────────────┐
         │ Orchestrator  │◄────┐
         │ Agent         │     │
         └───────┬───────┘     │
                 │ Query       │ State
                 ▼             │
         ┌───────────────┐     │
         │  Logistics    │─────┘
         │  Agent        │
         └───────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Action Agents │
         │ • Staff       │
         │ • Supply      │
         │ • Patient     │
         └───────────────┘
```

## Database Schema

### Core Tables

**beds**
- Tracks bed availability by department
- Status: available, occupied, maintenance

**staff**
- Staff roster with shifts
- Fatigue scoring (0-100)
- Hours worked tracking

**inventory**
- Current stock levels
- Minimum thresholds
- Supplier information

**recommendations**
- Agent-generated actions
- Approval workflow
- Cost impact tracking

### Agent Tables

**agent_activity_log**
- Audit trail of agent decisions
- Reasoning chains (explainability)
- Confidence scores

**surge_predictions**
- Historical predictions
- Validation outcomes
- Contributing factors

## Tech Stack Decisions

### Why LangGraph?
- **Structured workflows:** Define agent communication patterns
- **State management:** Shared state across agents
- **Tool calling:** ReAct framework support
- **Debugging:** Built-in observability

### Why Gemini 2.0 Flash?
- **Free tier:** 1500 RPD limit sufficient for demo
- **Speed:** 2-3s response time
- **Function calling:** Native tool use support
- **JSON mode:** Structured outputs

### Why Prophet?
- **Time-series:** Hospital data has daily/weekly patterns
- **Holiday effects:** Festivals = surges
- **Confidence intervals:** Upper/lower bounds
- **Easy:** Minimal training data needed

### Why PostgreSQL?
- **JSONB:** Store agent reasoning chains
- **Views:** Pre-computed aggregations
- **ACID:** Critical for healthcare data

### Why Redis?
- **Pub/Sub:** Agent communication
- **Caching:** External API responses (5min TTL)
- **Fast:** In-memory performance

## Deployment Architecture

```
┌──────────────────────────────────────┐
│           Vercel (Frontend)          │
│  React + WebSocket Client            │
└────────────┬─────────────────────────┘
             │ HTTPS/WSS
             │
┌────────────▼─────────────────────────┐
│        Railway (Backend)             │
│  FastAPI + LangGraph + Redis         │
└────────────┬─────────────────────────┘
             │
┌────────────▼─────────────────────────┐
│     Managed PostgreSQL               │
│  (Railway Postgres Plugin)           │
└──────────────────────────────────────┘
```

## Security Considerations

- API key management via environment variables
- Rate limiting on all endpoints
- Input validation for agent prompts
- Database connection pooling
- WebSocket authentication tokens

## Scalability

- Horizontal scaling via containerization
- Redis for distributed caching
- PostgreSQL read replicas
- Agent workflow parallelization
- CDN for frontend static assets

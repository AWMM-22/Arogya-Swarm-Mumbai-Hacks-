from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
import asyncio
from typing import List
from datetime import datetime

from core.config import settings
from core.database import engine, get_db, Base
from api.routes import router
from api.websocket import ConnectionManager
from agents import ArogyaSwarmGraph
from services.weather_service import WeatherService
from services.aqi_service import AQIService

# WebSocket manager for real-time updates
manager = ConnectionManager()

# Background task for agent monitoring
agent_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully")
    except Exception as e:
        print(f"⚠ Database initialization warning: {e}")
    
    # Startup: Launch agent monitoring loop
    global agent_task
    agent_task = asyncio.create_task(run_agent_monitoring())
    yield
    # Shutdown: Cancel monitoring
    if agent_task:
        agent_task.cancel()

# Initialize FastAPI app
app = FastAPI(
    title="Arogya-Swarm API",
    description="Multi-Agent Hospital Operations AI System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1")

# WebSocket endpoint for real-time dashboard
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and send heartbeat
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def broadcast_aqi_updates():
    """Background task: Broadcast real-time AQI updates every 15 seconds"""
    aqi_service = AQIService(settings.SAFAR_AIR_API_KEY)
    
    while True:
        try:
            # Get current AQI
            aqi = await aqi_service.get_current_aqi(settings.HOSPITAL_CITY)
            
            # Broadcast AQI to all connected WebSocket clients
            await manager.broadcast({
                "type": "aqi_update",
                "aqi": aqi,
                "timestamp": datetime.now().isoformat()
            })
            
            # Wait 15 seconds before next update
            await asyncio.sleep(15)
            
        except Exception as e:
            print(f"Error broadcasting AQI: {e}")
            await asyncio.sleep(15)  # Retry in 15 seconds on error

async def run_agent_monitoring():
    """Background task: Run agent system every 5 minutes"""
    weather_service = WeatherService(settings.OPENWEATHERMAP_API_KEY)
    aqi_service = AQIService(settings.SAFAR_AIR_API_KEY)
    
    # Start AQI broadcasting task
    asyncio.create_task(broadcast_aqi_updates())
    
    while True:
        try:
            # Gather external data
            weather = await weather_service.get_current_weather(settings.HOSPITAL_CITY)
            aqi = await aqi_service.get_current_aqi(settings.HOSPITAL_CITY)
            
            # Get hospital state (via dependency injection in production)
            # For now, simulate
            db = next(get_db())
            
            # Initialize agent system
            agent_config = {
                'gemini_api_key': settings.GOOGLE_API_KEY,
                'db_session': db,
                'twilio_client': None  # Add if SMS enabled
            }
            swarm = ArogyaSwarmGraph(agent_config)
            
            # Prepare initial state
            initial_state = {
                "current_weather": weather,
                "current_aqi": aqi,
                "upcoming_events": [],  # Fetch from events API
                "social_media_sentiment": {},
                "recommendations": [],
                "messages": [],
                "reasoning_chain": []
            }
            
            # Run agent workflow
            final_state = await swarm.run(initial_state)
            
            # Broadcast results to all connected WebSocket clients
            await manager.broadcast({
                "type": "agent_update",
                "surge_prediction": final_state['surge_prediction'],
                "recommendations": final_state['recommendations'],
                "messages": final_state['messages'],
                "reasoning_chain": final_state.get('reasoning_chain', []),
                "timestamp": datetime.now().isoformat()
            })
            
            # Wait 5 minutes before next run
            await asyncio.sleep(300)
            
        except Exception as e:
            print(f"Error in agent monitoring: {e}")
            await asyncio.sleep(60)  # Retry in 1 minute on error

@app.get("/")
async def root():
    return {
        "message": "Arogya-Swarm API",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from core.database import Base

class AgentActivityLog(Base):
    __tablename__ = "agent_activity_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_name = Column(String(50), nullable=False)
    action_type = Column(String(50))
    description = Column(Text)
    confidence_score = Column(Integer)
    reasoning = Column(Text)
    data_sources = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)

class SurgePrediction(Base):
    __tablename__ = "surge_predictions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prediction_time = Column(DateTime, default=datetime.utcnow)
    surge_likelihood = Column(String(20))
    confidence_score = Column(Integer)
    predicted_patient_increase = Column(String(20))
    departments_affected = Column(JSONB)
    contributing_factors = Column(JSONB)
    reasoning = Column(Text)
    status = Column(String(20), default="active")

class HistoricalSurge(Base):
    __tablename__ = "historical_surges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_date = Column(DateTime, nullable=False)
    event_type = Column(String(50))
    peak_patient_count = Column(Integer)
    duration_hours = Column(Integer)
    departments_affected = Column(String(200))
    lessons_learned = Column(Text)

class ExternalDataCache(Base):
    __tablename__ = "external_data_cache"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    data_source = Column(String(50))
    data_payload = Column(JSONB)
    cached_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

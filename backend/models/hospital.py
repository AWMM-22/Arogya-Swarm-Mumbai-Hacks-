from sqlalchemy import Column, String, Integer, DateTime, DECIMAL, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from core.database import Base

class Bed(Base):
    __tablename__ = "beds"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bed_number = Column(String(20), unique=True, nullable=False)
    department = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default="available")
    patient_id = Column(UUID(as_uuid=True), nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)

class Staff(Base):
    __tablename__ = "staff"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    specialization = Column(String(100))
    shift = Column(String(20))
    status = Column(String(20), default="available")
    hours_worked_week = Column(Integer, default=0)
    fatigue_score = Column(Integer, default=0)
    last_assigned = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_name = Column(String(100), nullable=False)
    category = Column(String(50))
    current_stock = Column(Integer, nullable=False)
    minimum_threshold = Column(Integer, nullable=False)
    unit = Column(String(20))
    last_restocked = Column(DateTime)
    supplier = Column(String(100))
    unit_cost = Column(DECIMAL(10, 2))

class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_name = Column(String(100), nullable=False)
    equipment_type = Column(String(50))
    status = Column(String(20), default="operational")
    location = Column(String(50))
    last_maintenance = Column(DateTime)

class PatientQueue(Base):
    __tablename__ = "patient_queue"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_name = Column(String(100))
    arrival_time = Column(DateTime, default=datetime.utcnow)
    department = Column(String(50))
    priority = Column(String(20))
    estimated_wait_time = Column(Integer)
    status = Column(String(20), default="waiting")

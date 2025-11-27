from sqlalchemy import Column, String, DateTime, Text, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from core.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recommendation_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    priority = Column(String(20))
    estimated_cost_impact = Column(DECIMAL(15, 2))
    reasoning = Column(Text)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by_agent = Column(String(50))
    executed_at = Column(DateTime)
    outcome = Column(Text)

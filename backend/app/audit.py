"""Audit logging system for tracking critical actions"""
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base

# Configure audit logger
audit_logger = logging.getLogger('audit')
audit_logger.setLevel(logging.INFO)

# Create file handler for audit logs
file_handler = logging.FileHandler('audit.log')
file_handler.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
file_handler.setFormatter(formatter)
audit_logger.addHandler(file_handler)

class AuditLog(Base):
    """Model for storing audit logs in database"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)

def log_audit(
    action: str,
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """
    Log an audit event
    
    Args:
        action: Action performed (e.g., 'LOGIN', 'USER_CREATED', 'COURSE_DELETED')
        user_id: ID of user performing action
        user_email: Email of user performing action
        resource_type: Type of resource affected (e.g., 'User', 'Course')
        resource_id: ID of affected resource
        details: Additional details about the action
        ip_address: IP address of request
        user_agent: User agent string
    """
    log_message = f"[AUDIT] Action: {action}"
    if user_email:
        log_message += f" | User: {user_email}"
    if resource_type and resource_id:
        log_message += f" | Resource: {resource_type}#{resource_id}"
    if details:
        log_message += f" | Details: {details}"
    
    audit_logger.info(log_message)

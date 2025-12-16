"""Utilities for pagination"""
from typing import TypeVar, Generic, List
from pydantic import BaseModel
from sqlalchemy.orm import Query

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response model"""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    
    class Config:
        from_attributes = True

def paginate(query: Query, page: int = 1, page_size: int = 10) -> tuple:
    """
    Paginate a SQLAlchemy query
    
    Args:
        query: SQLAlchemy query object
        page: Current page number (1-indexed)
        page_size: Number of items per page
    
    Returns:
        tuple: (items, total_count)
    """
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 10
    if page_size > 100:
        page_size = 100
    
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return items, total

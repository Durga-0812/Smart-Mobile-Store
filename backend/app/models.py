import base64
import secrets
import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from app.database import Base
from sqlalchemy.orm import relationship


def generate_order_id() -> str:
    return base64.b32encode(secrets.token_bytes(10)).decode("ascii").rstrip("=")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(120), nullable=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="USER")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Product(Base):
    __tablename__ = "products"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10,2), nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    category = Column(String(100), nullable=False)
    image_url = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_cart_user_product"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    product = relationship("Product")

# Order Management Models

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_order_id)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="PENDING")
    subtotal = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), nullable=False, default=0)
    tax = Column(Numeric(10, 2), nullable=False, default=0)
    shipping = Column(Numeric(10, 2), nullable=False, default=0)
    total = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(
        String(36),
        ForeignKey("orders.id"),
        nullable=False,
        index=True
    )
    product_id = Column(
        String(36),
        ForeignKey("products.id"),
        nullable=False
    )
    product_name = Column(String(150), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    line_total = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
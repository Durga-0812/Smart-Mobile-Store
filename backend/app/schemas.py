from pydantic import BaseModel, EmailStr, Field, ConfigDict
from decimal import Decimal
from typing import Optional, List
from datetime import datetime


# =========================
# AUTHENTICATION SCHEMAS
# =========================

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    full_name: str
    phone: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "USER"
    recaptcha_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str | None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None
    phone: str | None
    role: str

    model_config = ConfigDict(from_attributes=True)


# =========================
# PRODUCT SCHEMAS
# =========================

class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: Optional[str] = None
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    stock_quantity: int = Field(default=0, ge=0)
    category: str = Field(min_length=1, max_length=100)
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(
        default=None, gt=0, max_digits=10, decimal_places=2
    )
    stock_quantity: Optional[int] = Field(default=None, ge=0)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int
    category: str
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# =========================
# ORDER SCHEMAS
# =========================

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(gt=0, le=100)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(min_length=1)
    coupon_code: str | None = None
    delivery_address: Optional[str] = None
    delivery_latitude: Optional[Decimal] = None
    delivery_longitude: Optional[Decimal] = None


class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    unit_price: Decimal
    quantity: int
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: str
    user_id: str
    status: str
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    shipping: Decimal
    total: Decimal
    created_at: datetime
    delivery_address: Optional[str] = None
    items: List[OrderItemResponse]

    # Razorpay payment information
    payment_status: str | None = None
    payment_method: str | None = None
    razorpay_order_id: str | None = None
    razorpay_payment_id: str | None = None

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str

# =========================
# ORDER TRACKING SCHEMAS
# =========================

class OrderStatusHistoryResponse(BaseModel):
    id: str
    status: str
    description: Optional[str] = None
    updated_by: Optional[str] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderTrackingResponse(BaseModel):
    order: OrderResponse
    history: List[OrderStatusHistoryResponse]



# =========================
# CART SCHEMAS
# =========================

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = Field(default=1, gt=0, le=100)


class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0, le=100)


class CartProductResponse(BaseModel):
    id: str
    name: str
    price: Decimal
    stock_quantity: int
    category: str
    image_url: Optional[str] = None
    quantity: int


class CartResponse(BaseModel):
    items: List[CartProductResponse]
    total_items: int


# =========================
# MESSAGE SCHEMAS
# =========================

class MessageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    subject: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=5, max_length=2000)


class MessageResponse(BaseModel):
    id: str
    name: str
    email: str
    subject: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
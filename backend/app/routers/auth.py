import hashlib
import hmac
import secrets
import smtplib
import json
from urllib.parse import urlencode
from urllib.request import Request as URLRequest, urlopen
from urllib.error import URLError

from datetime import datetime, timedelta
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, PasswordResetOTP
from app.schemas import (
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
)
from app.security import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_user,
    require_admin,
)
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])
def verify_recaptcha(token: str):
    if not settings.RECAPTCHA_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="CAPTCHA is not configured."
        )

    data = urlencode({
        "secret": settings.RECAPTCHA_SECRET_KEY,
        "response": token
    }).encode("utf-8")

    request = URLRequest(
        "https://www.google.com/recaptcha/api/siteverify",
        data=data
    )

    try:
        with urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="CAPTCHA verification service is unavailable."
        )

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail="CAPTCHA verification failed. Please try again."
        )

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8, max_length=72)
class GoogleLoginRequest(BaseModel):
    credential: str


# ---------------- SIGNUP ----------------

@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    payload: SignupRequest,
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()

    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=email,
        full_name=payload.full_name,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role="USER",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# ---------------- LOGIN ----------------

@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    verify_recaptcha(payload.recaptcha_token)
    requested_role = payload.role.upper()

    if requested_role not in ("USER", "ADMIN"):
        raise HTTPException(
            status_code=400,
            detail="Role must be USER or ADMIN",
        )

    user = db.query(User).filter(
        User.email == payload.email.strip().lower()
    ).first()

    if user is None or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account disabled",
        )

    if user.role.upper() != requested_role:
        raise HTTPException(
            status_code=403,
            detail=f"This account is not registered as {requested_role.title()}",
        )

    return {
        "access_token": create_access_token(
            str(user.id),
            user.role,
        ),
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
    }

# ---------------- GOOGLE LOGIN ----------------

@router.post("/google", response_model=TokenResponse)
def google_login(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="Google authentication is not configured.",
        )

    try:
        google_user = id_token.verify_oauth2_token(
            payload.credential,
            GoogleRequest(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid Google authentication token.",
        )

    email = google_user.get("email", "").strip().lower()

    if not email or not google_user.get("email_verified"):
        raise HTTPException(
            status_code=401,
            detail="Google email is not verified.",
        )

    user = db.query(User).filter(User.email == email).first()

    if user:
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account disabled.")

        if user.role.upper() != "USER":
            raise HTTPException(
                status_code=403,
                detail="Google login is available only for user accounts.",
            )
    else:
        user = User(
            email=email,
            full_name=google_user.get("name", email.split("@")[0])[:120],
            password_hash=hash_password(secrets.token_urlsafe(32)),
            role="USER",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "access_token": create_access_token(str(user.id), user.role),
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
    }
# ---------------- CURRENT USER ----------------

@router.get("/me", response_model=UserResponse)
def me(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ---------------- ADMIN USERS ----------------

@router.get(
    "/admin/users",
    response_model=list[UserResponse],
)
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return db.query(User).all()


# ---------------- FORGOT PASSWORD ----------------

@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    response_message = (
        "If this email is registered, an OTP will be sent."
    )

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        return {"message": response_message}

    previous = (
        db.query(PasswordResetOTP)
        .filter(PasswordResetOTP.email == email)
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )

    if (
        previous
        and datetime.utcnow() - previous.created_at
        < timedelta(seconds=60)
    ):
        return {"message": response_message}

    # Generate six-digit OTP
    otp = str(secrets.randbelow(900000) + 100000)

    # Securely hash OTP
    otp_hash = hmac.new(
        settings.JWT_SECRET.encode(),
        f"{email}:{otp}".encode(),
        hashlib.sha256,
    ).hexdigest()

    # Delete previous OTP records
    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == email
    ).delete(synchronize_session=False)

    # Save new OTP
    reset_otp = PasswordResetOTP(
        email=email,
        otp_hash=otp_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
        attempts=0,
    )

    db.add(reset_otp)
    db.commit()

    try:
        if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
            raise ValueError(
                "SMTP credentials are not configured."
            )

        # Create email
        email_message = EmailMessage()

        email_message["Subject"] = (
            "Smart Mobile Store - Password Reset OTP"
        )

        email_message["From"] = settings.SMTP_EMAIL
        email_message["To"] = email

        email_message.set_content(
            f"Your password reset OTP is: {otp}\n\n"
            "This OTP expires in 5 minutes.\n"
            "Do not share this OTP with anyone."
        )

        # Gmail SMTP connection using SSL
        with smtplib.SMTP_SSL(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=30,
        ) as server:

            server.login(
                settings.SMTP_EMAIL,
                settings.SMTP_PASSWORD,
            )

            server.send_message(email_message)

    except Exception as e:

        print(
            "EMAIL ERROR:",
            type(e).__name__,
            str(e),
            flush=True,
        )

        db.delete(reset_otp)
        db.commit()

        raise HTTPException(
            status_code=503,
            detail=f"Email error: {type(e).__name__}: {e}",
        ) from e

    return {"message": response_message}


# ---------------- RESET PASSWORD ----------------

@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    if not payload.otp.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP.",
        )

    reset_record = (
        db.query(PasswordResetOTP)
        .filter(PasswordResetOTP.email == email)
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )

    if not reset_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP.",
        )

    if datetime.utcnow() > reset_record.expires_at:
        db.delete(reset_record)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP.",
        )

    if reset_record.attempts >= 5:
        db.delete(reset_record)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Too many attempts. Please request a new OTP.",
        )

    expected_hash = hmac.new(
        settings.JWT_SECRET.encode(),
        f"{email}:{payload.otp}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        expected_hash,
        reset_record.otp_hash,
    ):
        reset_record.attempts += 1

        if reset_record.attempts >= 5:
            db.delete(reset_record)

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP.",
        )

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP.",
        )

    # Update password
    user.password_hash = hash_password(
        payload.new_password
    )

    # Delete used OTP
    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == email
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "message": "Password reset successful. Please log in."
    }
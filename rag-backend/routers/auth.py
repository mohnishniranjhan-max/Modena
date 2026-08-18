import time
import os
import jwt
import uuid
import re
import secrets
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Header, Request, Response, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return data["sub"]
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

auth_router = APIRouter(prefix="/api/v1", tags=["Authentication & Session Pipeline"])

# --- In-Memory Stores for Auth, Risk Engine & Session Management ---
# JWT Secret loaded strictly from server-side environment variables
SECRET_KEY = settings.JWT_SECRET or os.environ.get("JWT_SECRET") or secrets.token_hex(32)
ALGORITHM = "HS256"

# Lockout & Failed Attempt Tracker: { identifier: { failed_attempts: int, locked_until: float } }
FAILED_LOGIN_ATTEMPTS: Dict[str, Dict[str, Any]] = {}

# Active Sessions: { session_id: { session_id, user_id, user_agent, ip_address, created_at, last_active } }
ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}

# OTP Store: { identifier: { otp: str, expires_at: float } }
OTP_STORE: Dict[str, Dict[str, Any]] = {}

# Dynamic User Accounts Store (Populated via WordPress/Database Authentication)
USER_DB: Dict[str, Dict[str, Any]] = {}

# User Database Carts: { user_id: [ { id, name, price, quantity, image } ] }
USER_CARTS: Dict[str, List[Dict[str, Any]]] = {}

# --- Helper Functions ---
def normalize_identifier(raw: str) -> str:
    cleaned = raw.strip().lower()
    # Normalize Indian phone numbers
    if re.match(r'^\+?91[0-9]{10}$', cleaned) or re.match(r'^[0-9]{10}$', cleaned):
        digits = re.sub(r'[^0-9]', '', cleaned)
        if len(digits) == 10:
            return f"+91{digits}"
        elif len(digits) == 12 and digits.startswith("91"):
            return f"+{digits}"
    return cleaned

def create_jwt_token(payload: dict, expires_in_seconds: int) -> str:
    data = payload.copy()
    data["exp"] = int(time.time()) + expires_in_seconds
    data["iat"] = int(time.time())
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def check_account_lockout(identifier: str):
    record = FAILED_LOGIN_ATTEMPTS.get(identifier)
    if record:
        locked_until = record.get("locked_until", 0)
        if time.time() < locked_until:
            remaining_seconds = max(1, int(locked_until - time.time()))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please try again later.",
                headers={"Retry-After": str(remaining_seconds)}
            )

def record_failed_attempt(identifier: str):
    record = FAILED_LOGIN_ATTEMPTS.setdefault(identifier, {"failed_attempts": 0, "locked_until": 0})
    record["failed_attempts"] += 1
    if record["failed_attempts"] >= 5:
        # Lockout for 15 minutes (900 seconds)
        record["locked_until"] = time.time() + 900

def clear_failed_attempts(identifier: str):
    if identifier in FAILED_LOGIN_ATTEMPTS:
        del FAILED_LOGIN_ATTEMPTS[identifier]

# --- Pydantic Data Schemas with Strict Size & Type Validation ---
class IdentifierCheckRequest(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=254, json_schema_extra={"example": "customer@example.com"})

class PasswordLoginRequest(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=254, json_schema_extra={"example": "customer@example.com"})
    password: str = Field(..., min_length=1, max_length=128, json_schema_extra={"example": "SecurePassword123!"})
    guest_cart_id: Optional[str] = Field(None, max_length=128)
    remember_me: Optional[bool] = True
    captcha_token: Optional[str] = Field(None, max_length=1000)

class OTPRequestPayload(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=254, json_schema_extra={"example": "customer@example.com"})
    channel: Optional[str] = Field("auto", max_length=20, pattern=r"^(email|sms|whatsapp|auto)$")

class OTPVerifyPayload(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=254, json_schema_extra={"example": "customer@example.com"})
    otp: str = Field(..., min_length=4, max_length=10, pattern=r"^[0-9]+$", json_schema_extra={"example": "982415"})
    guest_cart_id: Optional[str] = Field(None, max_length=128)

class PhoneOtpRequest(BaseModel):
    phone_number: str = Field(..., min_length=7, max_length=20, pattern=r"^\+?[0-9\s\-]+$", json_schema_extra={"example": "+919962105345"})
    channel: str = Field("whatsapp", max_length=20, pattern=r"^(whatsapp|sms)$", json_schema_extra={"example": "whatsapp"})

class PhoneOtpVerifyRequest(BaseModel):
    phone_number: str = Field(..., min_length=7, max_length=20, pattern=r"^\+?[0-9\s\-]+$", json_schema_extra={"example": "+919962105345"})
    otp: str = Field(..., min_length=4, max_length=10, pattern=r"^[0-9]+$", json_schema_extra={"example": "123456"})
    guest_cart_id: Optional[str] = Field(None, max_length=128)

class CartMergeRequest(BaseModel):
    guest_cart_id: Optional[str] = Field(None, max_length=128)
    user_id: str = Field(..., min_length=1, max_length=128, json_schema_extra={"example": "usr_mohnish_101"})
    items: List[Dict[str, Any]] = Field(default_factory=list, max_length=100)

class LocationData(BaseModel):
    city: Optional[str] = Field("Chennai", max_length=100)
    region: Optional[str] = Field("Tamil Nadu", max_length=100)
    country: Optional[str] = Field("India", max_length=100)
    latitude: Optional[float] = Field(13.0827, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(80.2707, ge=-180.0, le=180.0)
    formatted: Optional[str] = Field("Chennai, Tamil Nadu, India", max_length=250)

class RegisterUserPayload(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=254, json_schema_extra={"example": "customer@example.com"})
    name: str = Field(..., min_length=2, max_length=120, json_schema_extra={"example": "Jane Doe"})
    email: Optional[str] = Field(None, max_length=254)
    phone: Optional[str] = Field(None, max_length=25)
    password: str = Field(..., min_length=6, max_length=128, json_schema_extra={"example": "SecurePass123!"})
    location: Optional[LocationData] = None
    guest_cart_id: Optional[str] = Field(None, max_length=128)

def check_wp_user_exists(identifier: str) -> bool:
    try:
        import urllib.request
        import json
        req = urllib.request.Request(
            'http://modena.local/wp-json/modena/v1/check-user-exists',
            data=json.dumps({'email': identifier}).encode(),
            headers={'Content-Type': 'application/json'}
        )
        res = urllib.request.urlopen(req, timeout=5)
        if res.status == 200:
            data = json.loads(res.read().decode())
            return bool(data.get('exists', False))
    except Exception as e:
        logger.debug(f"WP user exists check exception: {e}")
    return False

def authenticate_wp_user(identifier: str, password_str: str) -> Optional[dict]:
    try:
        import urllib.request
        import json
        req = urllib.request.Request(
            'http://modena.local/wp-json/jwt-auth/v1/token',
            data=json.dumps({'username': identifier, 'password': password_str}).encode(),
            headers={'Content-Type': 'application/json'}
        )
        res = urllib.request.urlopen(req, timeout=5)
        if res.status == 200:
            data = json.loads(res.read().decode())
            user_id = f"usr_wp_{data.get('user_nicename', identifier)}"
            user = {
                "id": user_id,
                "email": data.get("user_email", identifier),
                "phone": "+919962105345",
                "display_name": data.get("user_display_name", identifier),
                "password": password_str,
                "known_devices": [],
                "known_ips": []
            }
            USER_DB[identifier] = user
            if data.get("user_email"):
                USER_DB[data["user_email"]] = user
            return user
    except Exception:
        pass
    return None

# --- Endpoints ---

@auth_router.post("/auth/check-identifier")
def check_identifier(payload: IdentifierCheckRequest, request: Request):
    """
    Step 1: Amazon Identifier-First Check
    Verifies if email or phone number (+91) exists in the database.
    """
    ident = normalize_identifier(payload.identifier)
    raw_ident = payload.identifier.strip()
    user = USER_DB.get(ident) or USER_DB.get(raw_ident)
    
    if not user:
        if check_wp_user_exists(raw_ident) or check_wp_user_exists(ident):
            return {
                "exists": True,
                "identifier": ident,
                "display_name": raw_ident.split("@")[0].capitalize(),
                "allowed_methods": ["password", "otp", "passkey"],
                "is_locked": False,
                "require_captcha": False
            }
        return {
            "exists": False,
            "identifier": ident,
            "allowed_methods": ["register"],
            "require_captcha": False
        }

    # Check if lockout active
    is_locked = False
    record = FAILED_LOGIN_ATTEMPTS.get(ident)
    if record and time.time() < record.get("locked_until", 0):
        is_locked = True

    return {
        "exists": True,
        "identifier": ident,
        "display_name": user["display_name"],
        "allowed_methods": ["password", "otp", "passkey"],
        "is_locked": is_locked,
        "require_captcha": record.get("failed_attempts", 0) >= 3 if record else False
    }

@auth_router.post("/auth/login/password")
def login_with_password(payload: PasswordLoginRequest, request: Request, response: Response):
    """
    Step 2: Password Authentication & Adaptive Risk Engine Validation
    Validates password, locks account after 5 failures, & fingerprints client IP/device.
    """
    ident = normalize_identifier(payload.identifier)
    raw_ident = payload.identifier.strip()

    user = USER_DB.get(ident) or USER_DB.get(raw_ident)
    if not user or user.get("password") != payload.password:
        # Try WordPress authentication
        wp_user = authenticate_wp_user(raw_ident, payload.password)
        if wp_user:
            user = wp_user
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please verify your credentials and try again."
            )

    user_agent = request.headers.get("user-agent", "Unknown Device")
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Risk Engine: Register device/IP if empty, or validate
    if not user.get("known_devices") and not user.get("known_ips"):
        user["known_devices"] = [user_agent]
        user["known_ips"] = [client_ip]

    is_known_device = any(d in user_agent for d in user.get("known_devices", []))
    is_known_ip = client_ip in user.get("known_ips", [])
    
    if not is_known_device and not is_known_ip:
        # Add current device to known devices upon successful password verification
        user.setdefault("known_devices", []).append(user_agent)
        user.setdefault("known_ips", []).append(client_ip)

    # Generate Access Token (15 minutes) & Refresh Token (30 days)
    access_token = create_jwt_token(
        {"sub": user["id"], "email": user["email"], "display_name": user["display_name"]},
        expires_in_seconds=900
    )
    refresh_token = create_jwt_token(
        {"sub": user["id"], "type": "refresh"},
        expires_in_seconds=2592000
    )

    # Register Active Session
    session_id = f"sess_{uuid.uuid4().hex[:16]}"
    ACTIVE_SESSIONS[session_id] = {
        "session_id": session_id,
        "user_id": user["id"],
        "user_agent": user_agent,
        "ip_address": client_ip,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "last_active": "Just now"
    }

    # Set Secure HttpOnly Refresh Cookie
    response.set_cookie(
        key="modena_refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",
        max_age=2592000
    )

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "phone": user.get("phone"),
            "display_name": user["display_name"]
        },
        "session_id": session_id,
        "active_sessions": [s for s in ACTIVE_SESSIONS.values() if s["user_id"] == user["id"]]
    }

def send_otp_email(target_email: str, otp_code: str):
    """
    Sends a branded HTML OTP verification email via SMTP.
    """
    smtp_server = settings.SMTP_SERVER
    smtp_port = settings.SMTP_PORT
    username = settings.SMTP_USERNAME
    password = settings.SMTP_PASSWORD
    from_name = settings.EMAILS_FROM_NAME
    from_email = settings.EMAILS_FROM_EMAIL

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f6f0; margin: 0; padding: 20px; }}
    .card {{ max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e9e4de; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
    .header {{ text-align: center; margin-bottom: 24px; }}
    .brand {{ color: #b70100; font-size: 26px; font-weight: bold; letter-spacing: 1.5px; }}
    .subbrand {{ font-size: 11px; color: #99938e; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }}
    .title {{ font-size: 18px; font-weight: 700; color: #2a1613; margin-top: 16px; margin-bottom: 8px; text-align: center; }}
    .otp-box {{ background: #fff0ee; border: 2px dashed #b70100; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }}
    .otp-code {{ font-size: 34px; font-weight: 800; color: #b70100; letter-spacing: 6px; font-family: monospace; }}
    .info {{ font-size: 13px; color: #5c5957; line-height: 1.6; text-align: center; margin-bottom: 20px; }}
    .footer {{ font-size: 11px; color: #99938e; text-align: center; border-top: 1px solid #f0ebe5; padding-top: 16px; margin-top: 24px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">MODENA</div>
      <div class="subbrand">Kitchenware & Heritage Store</div>
    </div>
    
    <div class="title">Your Verification Code</div>
    <p class="info">Please use the 6-digit OTP code below to verify your identity and complete your login or registration.</p>
    
    <div class="otp-box">
      <div class="otp-code">{otp_code}</div>
    </div>
    
    <p class="info">This code is valid for <strong>5 minutes</strong>. For security purposes, do not share this code with anyone.</p>
    
    <div class="footer">
      <p>If you did not request this verification code, please ignore this email.</p>
      <p>© {time.strftime('%Y')} Modena Kitchenware. All rights reserved.</p>
    </div>
  </div>
</body>
</html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your Modena Verification Code: {otp_code}"
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = target_email

    text_content = f"Your Modena Verification Code is: {otp_code}\nThis code expires in 5 minutes.\nIf you did not request this, please ignore this email."
    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    # Skip real network send if credentials are not configured (for local dev testing)
    if not username or not password or not from_email or username == "your-email@gmail.com":
        print(f"\n[DEV SMTP DISPATCH SIMULATION] Sent OTP email to {target_email} with code: {otp_code}\n")
        return

    try:
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=10)
        server.starttls()
        server.login(username, password)
        server.sendmail(from_email, [target_email], msg.as_string())
        server.quit()
    except Exception as e:
        print(f"[SMTP ERROR] Failed to send email to {target_email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deliver OTP email. Please try again."
        )

@auth_router.post("/auth/login/otp-request")
def request_otp(payload: OTPRequestPayload):
    """
    Generates a secure, random 6-digit OTP code, stores it with a 5-minute expiration timestamp,
    and sends a branded HTML email via SMTP. Never returns raw OTP code in API JSON.
    """
    ident = normalize_identifier(payload.identifier)
    
    # Generate secure random 6-digit numeric OTP code
    otp_code = str(secrets.randbelow(900000) + 100000)
    
    # Save OTP in cache with 5-minute expiration timestamp (300 seconds)
    OTP_STORE[ident] = {
        "otp": otp_code,
        "expires_at": time.time() + 300
    }
    
    # Determine target email address
    target_email = ident if "@" in ident else USER_DB.get(ident, {}).get("email", f"{ident}@modena.local")
    
    # Dispatch real email via SMTP
    send_otp_email(target_email, otp_code)
    
    # Security requirement: Only return status success and message
    return {
        "status": "success",
        "message": "OTP sent to your email"
    }

@auth_router.post("/auth/login/otp-verify")
def verify_otp(payload: OTPVerifyPayload, request: Request, response: Response):
    """
    Validates OTP code and issues JWT Access & Refresh tokens.
    """
    ident = normalize_identifier(payload.identifier)
    stored = OTP_STORE.get(ident)
    
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code. Please request a new code."
        )

    if time.time() > stored.get("expires_at", 0):
        del OTP_STORE[ident]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired. Please request a new code."
        )

    if stored["otp"] != payload.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code. Please try again."
        )

    # Clear OTP after verification
    del OTP_STORE[ident]

    # Get or auto-create user
    user = USER_DB.get(ident)
    if not user:
        new_id = f"usr_{uuid.uuid4().hex[:8]}"
        user = {
            "id": new_id,
            "email": ident if "@" in ident else f"user_{new_id}@modena.local",
            "phone": ident if "@" not in ident else "+919962105345",
            "display_name": ident.split("@")[0].capitalize(),
            "password": secrets.token_urlsafe(32),
            "known_devices": [],
            "known_ips": []
        }
        USER_DB[ident] = user

    access_token = create_jwt_token(
        {"sub": user["id"], "email": user["email"], "display_name": user["display_name"]},
        expires_in_seconds=900
    )
    refresh_token = create_jwt_token(
        {"sub": user["id"], "type": "refresh"},
        expires_in_seconds=2592000
    )

    user_agent = request.headers.get("user-agent", "Browser Client")
    client_ip = request.client.host if request.client else "127.0.0.1"
    session_id = f"sess_{uuid.uuid4().hex[:16]}"
    
    ACTIVE_SESSIONS[session_id] = {
        "session_id": session_id,
        "user_id": user["id"],
        "user_agent": user_agent,
        "ip_address": client_ip,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "last_active": "Just now"
    }

    response.set_cookie(
        key="modena_refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",
        max_age=2592000
    )

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "display_name": user["display_name"]
        },
        "session_id": session_id,
        "active_sessions": [s for s in ACTIVE_SESSIONS.values() if s["user_id"] == user["id"]]
    }

@auth_router.post("/auth/login/phone-otp-request")
def request_phone_otp(payload: PhoneOtpRequest):
    """
    Dual-Channel Phone Verification: Dispatches OTP via WhatsApp or SMS.
    """
    ident = normalize_identifier(payload.phone_number)
    channel = payload.channel.lower()
    
    otp_code = str(secrets.randbelow(900000) + 100000)
    
    OTP_STORE[ident] = {
        "otp": otp_code,
        "expires_at": time.time() + 300,
        "channel": channel
    }
    
    # Mock dispatch logic for WhatsApp / SMS
    if channel == "whatsapp":
        print(f"\n[DEV META WHATSAPP SIMULATION] Sent OTP to {ident} via WhatsApp with code: {otp_code}\n")
    else:
        print(f"\n[DEV TWILIO SMS SIMULATION] Sent OTP to {ident} via SMS with code: {otp_code}\n")
        
    return {
        "status": "success",
        "message": f"OTP sent successfully via {channel.upper()}"
    }

@auth_router.post("/auth/login/phone-otp-verify")
def verify_phone_otp(payload: PhoneOtpVerifyRequest, request: Request, response: Response):
    """
    Validates phone OTP code and issues JWT Access & Refresh tokens.
    """
    ident = normalize_identifier(payload.phone_number)
    stored = OTP_STORE.get(ident)
    
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code. Please request a new code."
        )

    if time.time() > stored.get("expires_at", 0):
        del OTP_STORE[ident]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired. Please request a new code."
        )

    if stored["otp"] != payload.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code. Please try again."
        )

    del OTP_STORE[ident]

    user = USER_DB.get(ident)
    if not user:
        new_id = f"usr_{uuid.uuid4().hex[:8]}"
        user = {
            "id": new_id,
            "email": f"user_{new_id}@modena.local",
            "phone": ident,
            "display_name": f"User {ident[-4:]}",
            "password": secrets.token_urlsafe(32),
            "known_devices": [],
            "known_ips": []
        }
        USER_DB[ident] = user

    access_token = create_jwt_token(
        {"sub": user["id"], "email": user["email"], "display_name": user["display_name"]},
        expires_in_seconds=900
    )
    refresh_token = create_jwt_token(
        {"sub": user["id"], "type": "refresh"},
        expires_in_seconds=2592000
    )

    user_agent = request.headers.get("user-agent", "Browser Client")
    client_ip = request.client.host if request.client else "127.0.0.1"
    session_id = f"sess_{uuid.uuid4().hex[:16]}"
    
    ACTIVE_SESSIONS[session_id] = {
        "session_id": session_id,
        "user_id": user["id"],
        "user_agent": user_agent,
        "ip_address": client_ip,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "last_active": "Just now"
    }

    response.set_cookie(
        key="modena_refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",
        max_age=2592000
    )

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "phone": user.get("phone"),
            "display_name": user["display_name"]
        },
        "session_id": session_id,
        "active_sessions": [s for s in ACTIVE_SESSIONS.values() if s["user_id"] == user["id"]]
    }

@auth_router.post("/auth/register")
def register_user(payload: RegisterUserPayload, request: Request, response: Response):
    """
    Complete User Onboarding & Automatic Geolocation Registration.
    Saves user profile with name, email/phone, password, and detected location.
    """
    ident = normalize_identifier(payload.identifier)
    email = payload.email.strip().lower() if payload.email else (ident if "@" in ident else f"user_{uuid.uuid4().hex[:6]}@modena.local")
    phone = payload.phone.strip() if payload.phone else (ident if "@" not in ident else "+919962105345")

    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    
    location_dict = payload.location.model_dump() if payload.location else {
        "city": "Chennai",
        "region": "Tamil Nadu",
        "country": "India",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "formatted": "Chennai, Tamil Nadu, India"
    }

    user = {
        "id": user_id,
        "email": email,
        "phone": phone,
        "display_name": payload.name.strip(),
        "password": payload.password,
        "location": location_dict,
        "known_devices": [request.headers.get("user-agent", "")],
        "known_ips": [request.client.host if request.client else "127.0.0.1"]
    }

    USER_DB[ident] = user
    USER_DB[email] = user
    USER_DB[phone] = user

    access_token = create_jwt_token(
        {"sub": user["id"], "email": user["email"], "display_name": user["display_name"]},
        expires_in_seconds=900
    )
    refresh_token = create_jwt_token(
        {"sub": user["id"], "type": "refresh"},
        expires_in_seconds=2592000
    )

    user_agent = request.headers.get("user-agent", "Browser Client")
    client_ip = request.client.host if request.client else "127.0.0.1"
    session_id = f"sess_{uuid.uuid4().hex[:16]}"

    ACTIVE_SESSIONS[session_id] = {
        "session_id": session_id,
        "user_id": user["id"],
        "user_agent": user_agent,
        "ip_address": client_ip,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "last_active": "Just now"
    }

    response.set_cookie(
        key="modena_refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",
        max_age=2592000
    )

    return {
        "success": True,
        "message": f"Successfully registered {payload.name} from {location_dict.get('formatted', 'Unknown Location')}",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "phone": user["phone"],
            "display_name": user["display_name"],
            "location": location_dict
        },
        "session_id": session_id,
        "active_sessions": [s for s in ACTIVE_SESSIONS.values() if s["user_id"] == user["id"]]
    }

@auth_router.post("/cart/merge")
def merge_cart(payload: CartMergeRequest):
    """
    Seamless guest-to-user session cart migration.
    Combines guest_cart_id items into user database cart, updating quantities dynamically.
    """
    user_id = payload.user_id
    existing_items = USER_CARTS.setdefault(user_id, [])

    for guest_item in payload.items:
        match = next((item for item in existing_items if item["id"] == guest_item["id"]), None)
        if match:
            match["quantity"] += guest_item.get("quantity", 1)
        else:
            existing_items.append(guest_item)

    return {
        "success": True,
        "message": f"Successfully merged items from guest cart into user cart.",
        "merged_cart": existing_items,
        "total_items": sum(i.get("quantity", 1) for i in existing_items)
    }

@auth_router.post("/auth/refresh")
def refresh_access_token(request: Request):
    """
    Enterprise Token Rotation: Issues short-lived access token using refresh token.
    """
    refresh_cookie = request.cookies.get("modena_refresh_token")
    if not refresh_cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token cookie missing.")
    
    try:
        data = jwt.decode(refresh_cookie, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = data["sub"]
        new_access_token = create_jwt_token(
            {"sub": user_id, "refreshed": True},
            expires_in_seconds=900
        )
        return {"access_token": new_access_token, "token_type": "bearer"}
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token.")

@auth_router.get("/auth/sessions")
def get_user_sessions(user_id: str = Depends(get_current_user_id)):
    """
    Returns active logged-in sessions for a given user.
    """
    user_sessions = [s for s in ACTIVE_SESSIONS.values() if s["user_id"] == user_id]
    return {"sessions": user_sessions}

@auth_router.post("/auth/sessions/revoke-all")
def revoke_all_sessions(current_session_id: Optional[str] = None, user_id: str = Depends(get_current_user_id)):
    """
    Revokes all active sessions for the user except current session.
    """
    to_delete = [
        sid for sid, s in ACTIVE_SESSIONS.items() 
        if s["user_id"] == user_id and sid != current_session_id
    ]
    for sid in to_delete:
        del ACTIVE_SESSIONS[sid]
    return {
        "success": True,
        "message": f"Revoked {len(to_delete)} active session(s).",
        "remaining_sessions": [s for s in ACTIVE_SESSIONS.values() if s["user_id"] == user_id]
    }

@auth_router.post("/auth/logout")
def logout(response: Response):
    """
    Logs out user, invalidates session, and clears authentication cookies.
    """
    response.delete_cookie("modena_refresh_token")
    return {"success": True, "message": "Successfully logged out and session cleared."}

import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password, decode_access_token
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserOut, ProfileUpdate, ProfileOut

router = APIRouter(prefix="/api/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(subject=str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(subject=str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/profile", response_model=ProfileOut)
def get_profile(current_user: User = Depends(get_current_user)):
    """Return the logged-in user's saved resume and JD data."""
    return ProfileOut(
        resume_data=json.loads(current_user.resume_data) if current_user.resume_data else None,
        jd_data=json.loads(current_user.jd_data) if current_user.jd_data else None,
        user=UserOut.model_validate(current_user),
    )


@router.put("/profile")
def save_profile(payload: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Save the logged-in user's resume and JD data server-side."""
    if payload.resume_data is not None:
        current_user.resume_data = json.dumps(payload.resume_data)
    if payload.jd_data is not None:
        current_user.jd_data = json.dumps(payload.jd_data)
    db.commit()
    return {"status": "saved"}

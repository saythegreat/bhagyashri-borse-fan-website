from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.core.security import verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate administrator credentials and return JWT bearer token."""
    user = db.query(User).filter(User.username == payload.username.strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    token = create_access_token(data={"sub": user.username, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        username=user.username,
        role=user.role,
    )

@router.post("/logout")
def logout():
    """Acknowledge administrator logout."""
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserOut)
def get_current_user_profile(user: User = Depends(get_current_user)):
    """Retrieve profile of currently authenticated administrator."""
    return user

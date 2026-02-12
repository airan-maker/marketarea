from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import get_settings

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """JWT에서 사용자 정보를 추출합니다. NextAuth HS256 토큰과 동일 시크릿을 사용합니다."""
    settings = get_settings()
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.NEXTAUTH_SECRET,
            algorithms=["HS256"],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    google_id = payload.get("sub")
    email = payload.get("email")
    if not google_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing required claims",
        )

    return {
        "google_id": google_id,
        "email": email,
        "name": payload.get("name"),
        "picture": payload.get("picture"),
    }

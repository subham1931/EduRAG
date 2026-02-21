import json
import base64
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import get_settings, Settings
from app.models.schemas import TokenPayload

security = HTTPBearer()


def _decode_jwt_payload_unverified(token: str) -> dict:
    """Decode JWT payload without any signature verification."""
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")
    payload_b64 = parts[1]
    padding = 4 - len(payload_b64) % 4
    if padding != 4:
        payload_b64 += "=" * padding
    payload_bytes = base64.urlsafe_b64decode(payload_b64)
    return json.loads(payload_bytes)


async def get_current_teacher(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
) -> TokenPayload:
    token = credentials.credentials

    # Local dev mode: decode token without verification when no JWT secret is set
    if not settings.supabase_jwt_secret:
        try:
            payload = _decode_jwt_payload_unverified(token)
            return TokenPayload(
                sub=payload.get("sub"),
                email=payload.get("email"),
                exp=payload.get("exp"),
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token decode failed: {str(e)}",
            )

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        token_data = TokenPayload(
            sub=payload.get("sub"),
            email=payload.get("email"),
            exp=payload.get("exp"),
        )
        if not token_data.sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
        return token_data
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
        )

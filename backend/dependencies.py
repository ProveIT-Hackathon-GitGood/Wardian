from fastapi import Depends, Request

from exceptions.exceptions import AppException
from utils.jwt_bearer import JwtBearer
from utils.jwt_handler import decode_jwt


async def get_current_user(request: Request, token: str = Depends(JwtBearer())):
    payload = decode_jwt(token)
    if not payload:
        raise AppException("The token is invalid or expired", 403)
    return payload
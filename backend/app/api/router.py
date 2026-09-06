from fastapi import APIRouter
from app.api.v1 import venues, checkins, speedtest, collections, websockets

api_router = APIRouter()

api_router.include_router(venues.router, prefix="/venues", tags=["venues"])
api_router.include_router(checkins.router, tags=["checkins"])
api_router.include_router(speedtest.router, tags=["speedtest"])
api_router.include_router(collections.router, prefix="/collections", tags=["collections"])
api_router.include_router(websockets.router, tags=["websockets"])

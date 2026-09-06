import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.event_broker import broker

logger = logging.getLogger("citypulse.ws")

router = APIRouter()


@router.websocket("/ws/live")
async def websocket_live_radar_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for live map radar updates.
    Broadcasts 'vibe_updated' and 'speedtest_logged' events in real time.
    """
    await broker.register_client(websocket)
    try:
        # Send initial welcome / connection ack
        await websocket.send_json({
            "type": "connection_established",
            "message": "Connected to CityPulse Live Vibe Radar Stream",
        })

        while True:
            # Keep connection open and listen for client pings or heartbeats
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception:
                pass
    except WebSocketDisconnect:
        broker.disconnect_client(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client disconnected with error: {e}")
        broker.disconnect_client(websocket)

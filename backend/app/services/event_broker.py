import asyncio
import json
import logging
from typing import Set, Dict, Any, Optional
from fastapi import WebSocket
from app.core.config import settings

logger = logging.getLogger("citypulse.broker")


class RealtimeEventBroker:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.redis_client = None
        self.pubsub_task: Optional[asyncio.Task] = None
        self.channel_name = "citypulse:live_events"

    async def connect_redis(self):
        """Attempts to connect to Redis for distributed pub/sub."""
        try:
            import redis.asyncio as aioredis
            self.redis_client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=3.0,
            )
            # Test connection
            await self.redis_client.ping()
            logger.info("Connected to Redis successfully for live pub/sub.")
            
            # Start background subscriber task
            self.pubsub_task = asyncio.create_task(self._redis_listener())
        except Exception as e:
            logger.warning(f"Redis not available ({e}). Running in-memory WebSocket broker mode.")
            self.redis_client = None

    async def _redis_listener(self):
        """Background listener for Redis Pub/Sub channel."""
        try:
            pubsub = self.redis_client.pubsub()
            await pubsub.subscribe(self.channel_name)
            async for message in pubsub.listen():
                if message["type"] == "message":
                    payload = message["data"]
                    await self._broadcast_to_local_sockets(payload)
        except asyncio.CancelledError:
            logger.info("Redis listener task cancelled.")
        except Exception as e:
            logger.error(f"Redis listener encountered error: {e}")

    async def register_client(self, websocket: WebSocket):
        """Registers a newly connected client WebSocket."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Active WebSockets: {len(self.active_connections)}")

    def disconnect_client(self, websocket: WebSocket):
        """Removes a disconnected client WebSocket."""
        self.active_connections.discard(websocket)
        logger.info(f"Client disconnected. Active WebSockets: {len(self.active_connections)}")

    async def _broadcast_to_local_sockets(self, message_str: str):
        """Sends raw JSON string to all local WebSocket connections."""
        if not self.active_connections:
            return

        dead_connections = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message_str)
            except Exception:
                dead_connections.add(connection)

        for dead in dead_connections:
            self.active_connections.discard(dead)

    async def publish_event(self, event_type: str, data: Dict[str, Any]):
        """
        Publishes an event to Redis (if available) or directly broadcasts to active sockets.
        event_type: 'vibe_updated' | 'checkin_created' | 'speedtest_logged'
        """
        message = {
            "type": event_type,
            "data": data,
        }
        message_str = json.dumps(message)

        if self.redis_client is not None:
            try:
                await self.redis_client.publish(self.channel_name, message_str)
            except Exception as e:
                logger.warning(f"Failed to publish to Redis ({e}), falling back to direct broadcast.")
                await self._broadcast_to_local_sockets(message_str)
        else:
            await self._broadcast_to_local_sockets(message_str)

    async def shutdown(self):
        """Cleans up Redis tasks and closes client connections."""
        if self.pubsub_task:
            self.pubsub_task.cancel()
        if self.redis_client:
            try:
                await self.redis_client.close()
            except Exception:
                pass


broker = RealtimeEventBroker()

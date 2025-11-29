import redis.asyncio as redis
from core.config import settings
import json

class RedisClient:
    """Redis client for agent communication and caching"""
    
    def __init__(self):
        self.redis = None
    
    async def connect(self):
        """Establish Redis connection"""
        self.redis = await redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
    
    async def publish_agent_message(self, channel: str, message: dict):
        """Publish message to agent communication channel"""
        await self.redis.publish(channel, json.dumps(message))
    
    async def subscribe_agent_channel(self, channel: str):
        """Subscribe to agent communication channel"""
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(channel)
        return pubsub
    
    async def cache_external_data(self, key: str, data: dict, ttl: int = 300):
        """Cache external API data with TTL (default 5 minutes)"""
        await self.redis.setex(key, ttl, json.dumps(data))
    
    async def get_cached_data(self, key: str) -> dict:
        """Retrieve cached data"""
        data = await self.redis.get(key)
        return json.loads(data) if data else None
    
    async def set_agent_state(self, agent_name: str, state: dict):
        """Store agent state"""
        await self.redis.hset("agent_states", agent_name, json.dumps(state))
    
    async def get_agent_state(self, agent_name: str) -> dict:
        """Retrieve agent state"""
        state = await self.redis.hget("agent_states", agent_name)
        return json.loads(state) if state else None

# Global Redis client instance
redis_client = RedisClient()

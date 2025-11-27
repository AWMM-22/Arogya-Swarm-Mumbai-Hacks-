import httpx
from typing import Dict, Optional
from datetime import datetime

class WeatherService:
    """Integration with OpenWeatherMap API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openweathermap.org/data/2.5"
    
    async def get_current_weather(self, city: str) -> Dict:
        """Get current weather data for a city"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/weather",
                    params={
                        "q": city,
                        "appid": self.api_key,
                        "units": "metric"
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "temperature": data["main"]["temp"],
                    "feels_like": data["main"]["feels_like"],
                    "humidity": data["main"]["humidity"],
                    "description": data["weather"][0]["description"],
                    "wind_speed": data["wind"]["speed"],
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                print(f"Weather API error: {e}")
                return self._get_fallback_weather()
    
    def _get_fallback_weather(self) -> Dict:
        """Fallback weather data for demo"""
        return {
            "temperature": 28.5,
            "feels_like": 32.0,
            "humidity": 65,
            "description": "partly cloudy",
            "wind_speed": 3.5,
            "timestamp": datetime.now().isoformat()
        }

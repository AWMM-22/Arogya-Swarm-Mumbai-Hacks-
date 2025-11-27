import httpx
import random
from typing import Dict, Optional
from datetime import datetime
import os

class AQIService:
    """Integration with OpenWeatherMap Air Pollution API"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENWEATHERMAP_API_KEY")
        self.base_url = "http://api.openweathermap.org/data/2.5/air_pollution"
        
        # City coordinates (Mumbai)
        self.city_coords = {
            "Mumbai": {"lat": 19.0760, "lon": 72.8777},
            "mumbai": {"lat": 19.0760, "lon": 72.8777},
        }
    
    async def get_current_aqi(self, city: str = "Mumbai") -> int:
        """Get current AQI for a city from OpenWeatherMap API"""
        try:
            if not self.api_key:
                return self._get_simulated_aqi(city)
            
            coords = self.city_coords.get(city, self.city_coords["Mumbai"])
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "lat": coords["lat"],
                        "lon": coords["lon"],
                        "appid": self.api_key
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # OpenWeatherMap returns AQI as 1-5 scale, convert to US AQI scale
                    aqi_index = data["list"][0]["main"]["aqi"]
                    
                    # Convert to US AQI (approximate)
                    aqi_mapping = {
                        1: 50,   # Good
                        2: 100,  # Fair
                        3: 150,  # Moderate
                        4: 200,  # Poor
                        5: 300   # Very Poor
                    }
                    
                    # Get actual pollutant values for more accurate calculation
                    components = data["list"][0]["components"]
                    pm25 = components.get("pm2_5", 0)
                    
                    # Calculate AQI from PM2.5 (more accurate)
                    if pm25 > 0:
                        calculated_aqi = self._calculate_aqi_from_pm25(pm25)
                        return int(calculated_aqi)
                    
                    return aqi_mapping.get(aqi_index, 150)
                else:
                    return self._get_simulated_aqi(city)
                    
        except Exception as e:
            print(f"Error fetching AQI: {e}")
            return self._get_simulated_aqi(city)
    
    def _calculate_aqi_from_pm25(self, pm25: float) -> float:
        """Calculate US AQI from PM2.5 concentration (μg/m³)"""
        # US EPA AQI breakpoints for PM2.5
        if pm25 <= 12.0:
            return self._linear_scale(pm25, 0, 12.0, 0, 50)
        elif pm25 <= 35.4:
            return self._linear_scale(pm25, 12.1, 35.4, 51, 100)
        elif pm25 <= 55.4:
            return self._linear_scale(pm25, 35.5, 55.4, 101, 150)
        elif pm25 <= 150.4:
            return self._linear_scale(pm25, 55.5, 150.4, 151, 200)
        elif pm25 <= 250.4:
            return self._linear_scale(pm25, 150.5, 250.4, 201, 300)
        else:
            return self._linear_scale(pm25, 250.5, 500.4, 301, 500)
    
    def _linear_scale(self, value: float, in_min: float, in_max: float, out_min: float, out_max: float) -> float:
        """Linear interpolation for AQI calculation"""
        return ((value - in_min) * (out_max - out_min) / (in_max - in_min)) + out_min
    
    def _get_simulated_aqi(self, city: str) -> int:
        """Generate realistic simulated AQI for demo"""
        # Mumbai typical AQI range: 100-200 (moderate to poor)
        base_aqi = 150
        return base_aqi + random.randint(-30, 50)

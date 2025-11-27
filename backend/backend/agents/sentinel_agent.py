from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from prophet import Prophet
import pandas as pd
from datetime import datetime, timedelta

class SentinelAgent:
    """
    Monitors external data sources and predicts potential surges.
    Acts as the early warning system.
    """
    
    def __init__(self, gemini_api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-lite",
            google_api_key=gemini_api_key,
            temperature=0.3  # Lower temperature for factual analysis
        )
        
        self.prediction_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a Sentinel Agent monitoring external threats to hospital operations.
            
Your task: Analyze external data and predict patient surge likelihood in the next 24-48 hours.

Consider these factors:
1. Air Quality Index (AQI): High AQI (>200) typically increases respiratory cases by 30-50%
2. Weather: Extreme heat/cold correlates with 20-40% ER increase
3. Local Events: Festivals, large gatherings increase accident/injury cases
4. Social Media: Trending health complaints indicate outbreak potential

Output Format (JSON):
{{
    "surge_likelihood": "low|medium|high|critical",
    "confidence_score": 0-100,
    "predicted_patient_increase": "percentage",
    "departments_affected": ["ER", "ICU"],
    "time_horizon": "24h|48h",
    "reasoning": "step-by-step explanation",
    "recommended_actions": ["action1", "action2"]
}}"""),
            ("human", """Current Data:
- AQI: {aqi}
- Weather: {weather}
- Upcoming Events: {events}
- Social Media Sentiment: {sentiment}

Historical Pattern: During similar conditions, we saw {historical_pattern}

Analyze and predict:""")
        ])
        
    async def monitor_and_predict(self, state: dict) -> dict:
        """Main sentinel monitoring function"""
        
        # Step 1: Gather external data
        external_data = {
            "aqi": state.get("current_aqi", 0),
            "weather": state.get("current_weather", {}),
            "events": state.get("upcoming_events", []),
            "sentiment": state.get("social_media_sentiment", {}),
            "historical_pattern": self._get_historical_pattern(state)
        }
        
        # Step 2: Use LLM to analyze threat level
        chain = self.prediction_prompt | self.llm
        prediction = await chain.ainvoke(external_data)
        
        # Step 3: Run time-series forecast (Prophet)
        ts_forecast = self._run_time_series_forecast(state)
        
        # Step 4: Combine LLM reasoning + statistical forecast
        combined_prediction = self._combine_predictions(prediction, ts_forecast)
        
        # Step 5: Update state
        return {
            "surge_prediction": combined_prediction,
            "confidence_score": combined_prediction["confidence_score"],
            "messages": [f"[Sentinel] Surge prediction: {combined_prediction['surge_likelihood']}"],
            "reasoning_chain": [combined_prediction["reasoning"]],
            "current_agent": "sentinel",
            "next_action": "escalate_to_orchestrator" if combined_prediction["surge_likelihood"] in ["high", "critical"] else "monitor"
        }
    
    def _run_time_series_forecast(self, state: dict) -> dict:
        """Use Prophet for statistical forecasting"""
        # Create synthetic historical data (in production, use real data)
        dates = pd.date_range(end=datetime.now(), periods=30, freq='D')
        patient_counts = [120 + (i % 7) * 15 + (20 if i > 20 else 0) for i in range(30)]
        
        df = pd.DataFrame({'ds': dates, 'y': patient_counts})
        
        model = Prophet(daily_seasonality=True)
        model.fit(df)
        
        future = model.make_future_dataframe(periods=2)  # 2 days ahead
        forecast = model.predict(future)
        
        predicted_increase = (forecast['yhat'].iloc[-1] - patient_counts[-1]) / patient_counts[-1] * 100
        
        return {
            "predicted_increase_pct": round(predicted_increase, 1),
            "forecast_data": forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(2).to_dict()
        }
    
    def _get_historical_pattern(self, state: dict) -> str:
        """Retrieve similar historical events"""
        # In production, query historical_surges table
        return "35% increase in ER visits within 24 hours"
    
    def _combine_predictions(self, llm_pred: str, ts_forecast: dict) -> dict:
        """Merge LLM reasoning with statistical forecast"""
        # Parse LLM JSON response (simplified)
        import json
        try:
            llm_data = json.loads(llm_pred.content)
        except:
            llm_data = {
                "surge_likelihood": "medium",
                "confidence_score": 60,
                "reasoning": "Analysis in progress"
            }
        
        # Adjust confidence based on statistical forecast agreement
        if abs(float(llm_data.get("predicted_patient_increase", "20").rstrip('%')) - ts_forecast["predicted_increase_pct"]) < 10:
            llm_data["confidence_score"] = min(llm_data["confidence_score"] + 15, 95)
        
        llm_data["statistical_forecast"] = ts_forecast
        return llm_data

const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:8000';

export async function fetchBeds(department?: string) {
  const url = department 
    ? `${API_BASE_URL}/api/v1/beds?department=${department}` 
    : `${API_BASE_URL}/api/v1/beds`;
  const response = await fetch(url);
  return response.json();
}

export async function fetchStaff(shift?: string) {
  const url = shift
    ? `${API_BASE_URL}/api/v1/staff?shift=${shift}` 
    : `${API_BASE_URL}/api/v1/staff`;
  const response = await fetch(url);
  return response.json();
}

export async function fetchInventory(criticalOnly: boolean = false) {
  const url = `${API_BASE_URL}/api/v1/inventory?critical_only=${criticalOnly}`;
  const response = await fetch(url);
  return response.json();
}

export async function fetchLatestPrediction() {
  const response = await fetch(`${API_BASE_URL}/api/v1/predictions/latest`);
  return response.json();
}

export async function fetchRecommendations(status?: string) {
  const url = status
    ? `${API_BASE_URL}/api/v1/recommendations?status=${status}` 
    : `${API_BASE_URL}/api/v1/recommendations`;
  const response = await fetch(url);
  return response.json();
}

export async function approveRecommendation(recId: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/recommendations/${recId}/approve`, {
    method: 'POST'
  });
  return response.json();
}

export async function rejectRecommendation(recId: string, reason: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/recommendations/${recId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  return response.json();
}

export async function getCostSavings() {
  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/cost-savings`);
  return response.json();
}

export async function triggerCrisisSimulation(crisisType: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulation/trigger-crisis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ crisis_type: crisisType })
  });
  return response.json();
}

// Get user's current location
async function getCurrentLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.warn('Could not get location:', error.message);
        resolve(null);
      },
      { timeout: 5000, maximumAge: 300000 } // 5s timeout, cache for 5 mins
    );
  });
}

export async function fetchCurrentAQI() {
  // Try to get current location
  const location = await getCurrentLocation();
  
  let url = `${API_BASE_URL}/api/v1/environment/aqi`;
  if (location) {
    url += `?lat=${location.lat}&lon=${location.lon}`;
  }
  
  const response = await fetch(url);
  return response.json();
}

const API_BASE = '/api';

export async function detectFood(base64Image) {
  const response = await fetch(`${API_BASE}/detect-food`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Detection failed');
  }
  return data;
}

export async function analyzeFood(foodName, goal, detectedLabel = null) {
  const response = await fetch(`${API_BASE}/analyze-food`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foodName, goal, detectedLabel })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || err.error || 'Analysis failed');
  }

  return response.json();
}

export async function getAlternatives(food) {
  const response = await fetch(`${API_BASE}/alternatives?food=${encodeURIComponent(food)}`);
  if (!response.ok) throw new Error('Failed to fetch alternatives');
  return response.json();
}

export async function getNutrition(food) {
  const response = await fetch(`${API_BASE}/nutrition?food=${encodeURIComponent(food)}`);
  if (!response.ok) throw new Error('Failed to fetch nutrition');
  return response.json();
}

export async function getSupportedFoods() {
  const response = await fetch(`${API_BASE}/supported-foods`);
  if (!response.ok) throw new Error('Failed to fetch supported foods');
  return response.json();
}

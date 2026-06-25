const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/dishes';

// Fetch all dishes from API
export const getDishes = async () => {
  const res = await fetch(API_BASE);
  if (!res.ok) {
    throw new Error('Failed to retrieve dishes list.');
  }
  return res.json();
};

// Send toggle request to backend
export const toggleDish = async (id) => {
  const res = await fetch(`${API_BASE}/${id}/toggle`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    throw new Error('Failed to update dish published status.');
  }
  return res.json();
};

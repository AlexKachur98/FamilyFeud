const SERVER_URL = import.meta.env.PROD
  ? import.meta.env.VITE_SERVER_URL || ''
  : import.meta.env.VITE_LOCAL_URL || '';
const API_BASE = '/api/v1';

export const getLeaderboard = async () => {
  try {
    const response = await fetch(`${SERVER_URL}${API_BASE}/leaderboard`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    credentials: 'include',
  });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

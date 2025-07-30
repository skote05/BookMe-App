import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.3:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

// Vehicle API calls
export const vehicleAPI = {
  getVehicle: () => api.get('/vehicle'),
  createVehicle: (vehicleData) => api.post('/vehicle', vehicleData),
  updateVehicle: (vehicleData) => api.put('/vehicle', vehicleData),
  deleteVehicle: () => api.delete('/vehicle'),
};

// Fare API calls
export const fareAPI = {
  calculateFares: (fareData) => api.post('/fare/calculate', fareData),
  getFareRates: () => api.get('/fare/rates'),
};

// Location and routing API calls
export const locationAPI = {
  searchLocation: async (query, currentLocation = null) => {
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      
      // Add current location context if available
      if (currentLocation) {
        url += `&viewbox=${currentLocation.longitude - 0.1},${currentLocation.latitude - 0.1},${currentLocation.longitude + 0.1},${currentLocation.latitude + 0.1}&bounded=1`;
      }
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BookMeApp/1.0',
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('Nominatim API error:', response.status, response.statusText);
        // Return mock data for testing with nearby locations
        return [
          {
            display_name: `${query} (Nearby Location 1)`,
            lat: currentLocation ? (currentLocation.latitude + 0.01).toFixed(6) : '12.9716',
            lon: currentLocation ? (currentLocation.longitude + 0.01).toFixed(6) : '77.5946',
          },
          {
            display_name: `${query} (Nearby Location 2)`,
            lat: currentLocation ? (currentLocation.latitude - 0.01).toFixed(6) : '13.0827',
            lon: currentLocation ? (currentLocation.longitude - 0.01).toFixed(6) : '77.5877',
          },
          {
            display_name: `${query} (Nearby Location 3)`,
            lat: currentLocation ? (currentLocation.latitude + 0.02).toFixed(6) : '12.9789',
            lon: currentLocation ? (currentLocation.longitude + 0.02).toFixed(6) : '77.5917',
          }
        ];
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Nominatim API returned non-JSON response');
        return [];
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error searching location:', error);
      // Return mock data for testing with nearby locations
      return [
        {
          display_name: `${query} (Nearby Location 1)`,
          lat: currentLocation ? (currentLocation.latitude + 0.01).toFixed(6) : '12.9716',
          lon: currentLocation ? (currentLocation.longitude + 0.01).toFixed(6) : '77.5946',
        },
        {
          display_name: `${query} (Nearby Location 2)`,
          lat: currentLocation ? (currentLocation.latitude - 0.01).toFixed(6) : '13.0827',
          lon: currentLocation ? (currentLocation.longitude - 0.01).toFixed(6) : '77.5877',
        },
        {
          display_name: `${query} (Nearby Location 3)`,
          lat: currentLocation ? (currentLocation.latitude + 0.02).toFixed(6) : '12.9789',
          lon: currentLocation ? (currentLocation.longitude + 0.02).toFixed(6) : '77.5917',
        }
      ];
    }
  },

  getRoute: async (startCoords, endCoords) => {
    try {
      const [startLon, startLat] = startCoords;
      const [endLon, endLat] = endCoords;
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) {
        console.error('OSRM API error:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting route:', error);
      return null;
    }
  },

  getDistance: async (startCoords, endCoords) => {
    try {
      const [startLon, startLat] = startCoords;
      const [endLon, endLat] = endCoords;
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}`
      );
      
      if (!response.ok) {
        console.error('OSRM Distance API error:', response.status, response.statusText);
        return 0;
      }
      
      const data = await response.json();
      return data.routes?.[0]?.distance || 0; // Distance in meters
    } catch (error) {
      console.error('Error getting distance:', error);
      return 0;
    }
  },
};

export default api; 
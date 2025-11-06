import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://geolocalizacion-backend-wtnq.onrender.com',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;

// src/services/nearby.ts
import axios from 'axios';

export type NearbyItem = {
  _id: string;
  name: string;
  last_name?: string;
  description?: string;
  photo_url?: string;
  rating?: number;
  activo?: boolean;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat] ⚠️ IMPORTANTE
  };
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

const BASE = 'https://geolocalizacion-backend-wtnq.onrender.com';

export async function fetchNearby(
  lat: number,
  lng: number,
  radioKm: number
): Promise<NearbyItem[]> {
  // El backend espera lat, lng, radio (km)
  const url = `${BASE}/ubicaciones/cercanos?lat=${lat}&lng=${lng}&radio=${radioKm}`;
  const { data } = await axios.get<NearbyItem[]>(url, { timeout: 15000 });
  // Aseguramos array
  return Array.isArray(data) ? data : [];
}

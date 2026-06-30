import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom red icon for the user's location
const UserLocationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const fetchRealCenters = async (lat, lng) => {
  try {
    const radius = 5000;
    const query = `
      [out:json];
      (
        node["amenity"="recycling"](around:${radius},${lat},${lng});
      );
      out body;
    `;
    const response = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    
    if (response.data && response.data.elements) {
      return response.data.elements.map(el => {
        const tags = el.tags || {};
        const name = tags.name || tags.operator || 'Local Recycling Center';
        
        // Extract recycling types from tags (e.g., recycling:glass=yes)
        const types = Object.keys(tags)
          .filter(k => k.startsWith('recycling:') && tags[k] === 'yes')
          .map(k => k.replace('recycling:', '').charAt(0).toUpperCase() + k.replace('recycling:', '').slice(1));
          
        if (types.length === 0) {
            types.push('General Recycling');
        }

        const hours = tags.opening_hours || 'Varies';
        
        return {
          id: el.id,
          name: name,
          lat: el.lat,
          lng: el.lon,
          types: types,
          hours: hours
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetching centers from Overpass API:", error);
    return [];
  }
};

const MapView = () => {
  const [location, setLocation] = useState(null);
  const [centers, setCenters] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMapData = async (lat, lng) => {
      setLocation([lat, lng]);
      const realCenters = await fetchRealCenters(lat, lng);
      setCenters(realCenters);
      setLoading(false);
    };

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      loadMapData(40.7128, -74.0060);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadMapData(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setError('Unable to retrieve your location');
        loadMapData(40.7128, -74.0060);
      }
    );
  }, []);

  if (loading || !location) {
    return (
      <div>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: 'var(--text-main)' }}>Collection Centers Near You</h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <p>Finding local recycling centers...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: 'var(--text-main)' }}>Collection Centers Near You</h2>
      {error && <p style={{ color: 'var(--accent-danger)', marginBottom: '1rem' }}>{error}. Using default location.</p>}
      {centers.length === 0 && !error && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No recycling centers found within 5km.</p>
      )}
      <div className="map-container">
        <MapContainer center={location} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={location} icon={UserLocationIcon}>
            <Popup>
              <strong>You are here</strong>
            </Popup>
          </Marker>
          {centers.map(center => (
            <Marker key={center.id} position={[center.lat, center.lng]}>
              <Popup>
                <div style={{ padding: '0.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{center.name}</h3>
                  <p style={{ margin: '0 0 0.25rem 0' }}><strong>Types:</strong> {center.types.join(', ')}</p>
                  <p style={{ margin: 0 }}><strong>Hours:</strong> {center.hours}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;

import { useState } from 'react';
import { MapWithMarkers } from './MapWithMarkers';
import { MapActions } from './MapActions';
import type { LatLngExpression } from 'leaflet';
import { latLngsToWktPolygon } from '../wkt';

const germanyCenter: LatLngExpression = [51.255583, 10.352611];

function GermanyMap() {
  const [clearSignal, setClearSignal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [markerPositions, setMarkerPositions] = useState<LatLngExpression[]>([]);

  const handleClear = () => {
    setClearSignal(true);
    setTimeout(() => setClearSignal(false), 0);
    setMarkerPositions([]);
  };

  const handleRequest = async () => {
    if (markerPositions.length < 3) {
      alert('Please set at least 3 markers to form a polygon.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const polygon = latLngsToWktPolygon(markerPositions);
      const body = {
        grid_id: 8,
        polygon_srid: 4326,
        polygon,
      };
      const response = await fetch('http://localhost:8000/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Request failed');
      const data = await response.json();
      setResult(data.population);
    } catch (error) {
      setResult(-1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', fontFamily: 'sans-serif' }}>
      <div style={{
        position: 'absolute',
        zIndex: 1000,
        top: 20,
        right: 20,
      }}>
        <MapActions
          onClear={handleClear}
          result={result}
          loading={loading}
          onRequest={handleRequest}
          endpoint="http://localhost:8000/"
        />
      </div>
      <MapWithMarkers
        center={germanyCenter}
        clearSignal={clearSignal}
        onMarkersChange={setMarkerPositions}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 1100,
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          textAlign: 'center',
          padding: '14px 0',
          fontWeight: 600,
          fontSize: 18,
          letterSpacing: 1,
          boxShadow: '0 -2px 8px rgba(118,75,162,0.10)',
        }}
      >
        Unfortunately, only population data for Germany of year 2022 is currently available. The data is accurate to within 1 km.
      </div>
    </div>
  );
}

export default GermanyMap;
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvent } from 'react-leaflet';
import { divIcon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '../history';
import { markerSvg } from '../icons';

// 16x16 pixel pin drawn at 1.5x (24 px); anchor = needle tip (bottom centre)
// thin black outline, slightly grey fill: the map stays readable inside.
// Not interactive, so a click inside the polygon still sets a marker.
const outline = { color: '#000000', weight: 1, fillColor: '#808080', fillOpacity: 0.3, interactive: false };

const pinIcon = divIcon({ html: markerSvg(24), className: 'w95-pin', iconSize: [24, 24], iconAnchor: [12, 23] });

type MapWithMarkersProps = {
  center: LatLngExpression;
  zoom?: number;
  markers: LatLng[];
  onMarkersChange: (markers: LatLng[]) => void;
  fitKey: string | null; // changes when a saved entry is clicked -> zoom to its markers
};

function ClickToAdd({ onAdd }: { onAdd: (marker: LatLng) => void }) {
  useMapEvent('click', (e) => onAdd([e.latlng.lat, e.latlng.lng]));
  return null;
}

function FitToMarkers({ markers, fitKey }: { markers: LatLng[]; fitKey: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (fitKey && markers.length > 0) map.fitBounds(markers, { padding: [40, 40], maxZoom: 12 });
  }, [fitKey]); // only on a new fitKey, not on every marker change
  return null;
}

export function MapWithMarkers({ center, zoom = 6, markers, onMarkersChange, fitKey }: MapWithMarkersProps) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToAdd onAdd={(m) => onMarkersChange([...markers, m])} />
      <FitToMarkers markers={markers} fitKey={fitKey} />
      {markers.length >= 2 && <Polygon positions={markers} pathOptions={outline} />}
      {markers.map((pos, idx) => (
        <Marker
          key={`${idx}-${pos[0]}-${pos[1]}`}
          position={pos}
          icon={pinIcon}
          eventHandlers={{ click: () => onMarkersChange(markers.filter((_, i) => i !== idx)) }}
        />
      ))}
    </MapContainer>
  );
}

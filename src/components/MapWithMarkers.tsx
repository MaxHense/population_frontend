import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvent } from 'react-leaflet';
import { divIcon, type LatLngExpression, type LeafletEvent, type LeafletMouseEvent, type Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '../history';
import { gripSvg, markerSvg } from '../icons';
import { midpoints } from '../polygon';

const pinIcon = divIcon({ html: markerSvg(24), className: 'w95-pin', iconSize: [24, 24], iconAnchor: [12, 23] });
const gripIcon = divIcon({ html: gripSvg(10), className: 'w95-pin', iconSize: [10, 10], iconAnchor: [5, 5] });

// not interactive: a click inside the polygon still sets a marker
const outline = { color: '#000000', weight: 1, fillColor: '#808080', fillOpacity: 0.3, interactive: false };
const crossingOutline = { ...outline, color: '#ff0000', weight: 2 };

type MapWithMarkersProps = {
  center: LatLngExpression;
  zoom?: number;
  markers: LatLng[];
  crossing: boolean;
  onMarkersChange: (markers: LatLng[]) => void;
  onMarkerMenu: (index: number, x: number, y: number) => void;
  fitKey: string | null;
};

const positionOf = (e: LeafletEvent): LatLng => {
  const { lat, lng } = (e.target as LeafletMarker).getLatLng();
  return [lat, lng];
};

const replaceAt = (list: LatLng[], index: number, point: LatLng) => list.map((p, i) => (i === index ? point : p));
const insertAt = (list: LatLng[], index: number, point: LatLng) => [...list.slice(0, index), point, ...list.slice(index)];

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

export function MapWithMarkers({
  center, zoom = 6, markers, crossing, onMarkersChange, onMarkerMenu, fitKey,
}: MapWithMarkersProps) {
  const openMenu = (index: number) => (e: LeafletMouseEvent) => {
    e.originalEvent.preventDefault();
    onMarkerMenu(index, e.originalEvent.clientX, e.originalEvent.clientY);
  };

  return (
    <MapContainer center={center} zoom={zoom} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToAdd onAdd={(m) => onMarkersChange([...markers, m])} />
      <FitToMarkers markers={markers} fitKey={fitKey} />
      {markers.length >= 2 && <Polygon positions={markers} pathOptions={crossing ? crossingOutline : outline} />}

      {midpoints(markers).map(({ insertAt: index, point }) => (
        <Marker
          key={`mid-${index}-${point[0]}-${point[1]}`}
          position={point}
          icon={gripIcon}
          draggable
          title="Drag or click to add a point"
          eventHandlers={{
            click: () => onMarkersChange(insertAt(markers, index, point)),
            dragend: (e) => onMarkersChange(insertAt(markers, index, positionOf(e))),
          }}
        />
      ))}

      {markers.map((pos, index) => (
        <Marker
          key={`${index}-${pos[0]}-${pos[1]}`}
          position={pos}
          icon={pinIcon}
          draggable
          title="Drag to move, right-click for more"
          eventHandlers={{
            dragend: (e) => onMarkersChange(replaceAt(markers, index, positionOf(e))),
            contextmenu: openMenu(index),
          }}
        />
      ))}
    </MapContainer>
  );
}

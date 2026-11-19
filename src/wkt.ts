import type { LatLngExpression, LatLngLiteral } from 'leaflet';

// Type guards
function isArrayLatLng(p: LatLngExpression): p is [number, number] {
  return Array.isArray(p) && p.length === 2;
}
function isLatLngLiteral(p: any): p is LatLngLiteral {
  return typeof p.lat === 'number' && typeof p.lng === 'number';
}

export function latLngsToWktPolygon(latlngs: LatLngExpression[]): string {
  if (latlngs.length < 3) return '';
  // Ensure the polygon is closed
  const points = [...latlngs];
  const first = points[0];
  const last = points[points.length - 1];

  let isClosed = false;
  if (isArrayLatLng(first) && isArrayLatLng(last)) {
    isClosed = first[0] === last[0] && first[1] === last[1];
  } else if (isLatLngLiteral(first) && isLatLngLiteral(last)) {
    isClosed = first.lat === last.lat && first.lng === last.lng;
  }
  if (!isClosed) points.push(first);

  const coordStr = points
    .map((p) =>
      isArrayLatLng(p)
        ? `${p[1]} ${p[0]}`
        : isLatLngLiteral(p)
        ? `${p.lng} ${p.lat}`
        : ''
    )
    .join(', ');
  return `POLYGON ((${coordStr}))`;
}

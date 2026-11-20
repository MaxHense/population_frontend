import type { LatLng } from './history';

const edges = (points: LatLng[]): [LatLng, LatLng][] =>
  points.map((p, i) => [p, points[(i + 1) % points.length]]);

const orientation = ([ay, ax]: LatLng, [by, bx]: LatLng, [cy, cx]: LatLng) =>
  Math.sign((bx - ax) * (cy - ay) - (by - ay) * (cx - ax));

const intersect = ([a, b]: [LatLng, LatLng], [c, d]: [LatLng, LatLng]) =>
  orientation(a, b, c) * orientation(a, b, d) < 0 && orientation(c, d, a) * orientation(c, d, b) < 0;

// ponytail: flat lat/lng math, fine for city-sized polygons
export function edgesCross(points: LatLng[]): boolean {
  if (points.length < 4) return false;
  const all = edges(points);
  return all.some((e, i) => all.some((f, j) => j > i + 1 && !(i === 0 && j === all.length - 1) && intersect(e, f)));
}

export function midpoints(points: LatLng[]): { insertAt: number; point: LatLng }[] {
  if (points.length < 2) return [];
  const sides = points.length === 2 ? edges(points).slice(0, 1) : edges(points);
  return sides.map(([[ay, ax], [by, bx]], i) => ({ insertAt: i + 1, point: [(ay + by) / 2, (ax + bx) / 2] }));
}

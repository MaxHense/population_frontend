export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const join = (apiUrl: string, path: string) => `${apiUrl.replace(/\/+$/, '')}${path}`;

export type Cell = { population: number; polygon: [number, number][] };
export type Count = { population: number | null; cells: Cell[] | null };

/** Population inside the polygon, summed by the backend over all its grids. */
export async function countPopulation(apiUrl: string, wktPolygon: string): Promise<Count> {
  const response = await fetch(join(apiUrl, '/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ polygon_srid: 4326, polygon: wktPolygon }),
  });
  if (!response.ok) throw new Error(`Counting failed: ${response.status}`);
  const { population, cells } = await response.json();
  return { population, cells: cells ?? null };
}

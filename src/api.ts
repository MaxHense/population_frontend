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

/**
 * API address from /config.json next to index.html. The deployment writes it, so one build
 * runs on any host. Local dev: public/config.json.
 */
export async function loadApiUrl(): Promise<string> {
  const response = await fetch('/config.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Loading config.json failed: ${response.status}`);
  const { apiUrl } = await response.json();
  if (typeof apiUrl !== 'string' || !/^https?:\/\/\S+$/.test(apiUrl)) {
    throw new Error('config.json: apiUrl must be an http(s) URL');
  }
  return apiUrl;
}

let apiUrl: Promise<string> | undefined;

/** loadApiUrl once per page, retried after a failure */
export const getApiUrl = () => (apiUrl ??= loadApiUrl().catch((error) => {
  apiUrl = undefined;
  throw error;
}));

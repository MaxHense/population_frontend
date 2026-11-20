export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export type GridInput = { name: string; size: string; srid: number };
export type DataDefinition = {
  population_key: string;
  x_column: string;
  y_column: string;
  delimiter: string;
  decode: string;
};
export type StoredGrid = GridInput & { id: number };
export type Grid = StoredGrid & { number_of_location: number };

const join = (apiUrl: string, path: string) => `${apiUrl.replace(/\/+$/, '')}${path}`;

export type UploadReason = 'unauthorized' | 'disabled' | 'invalid' | 'failed';

export class UploadError extends Error {
  readonly reason: UploadReason;

  constructor(reason: UploadReason) {
    super(`Upload failed: ${reason}`);
    this.reason = reason;
  }
}

const REASONS: Record<number, UploadReason> = { 401: 'unauthorized', 404: 'disabled', 400: 'invalid' };

export async function uploadGrid(input: {
  apiUrl: string;
  token: string;
  grid: GridInput;
  dataDefinition: DataDefinition;
  file: File;
}): Promise<Grid> {
  const form = new FormData();
  form.append('grid', JSON.stringify(input.grid));
  form.append('data_definition', JSON.stringify(input.dataDefinition));
  form.append('file', input.file);

  const response = await fetch(join(input.apiUrl, '/admin/grids'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: form,
  });
  if (!response.ok) throw new UploadError(REASONS[response.status] ?? 'failed');
  return response.json();
}

export async function fetchGrids(apiUrl: string): Promise<StoredGrid[]> {
  const response = await fetch(join(apiUrl, '/grid'));
  if (!response.ok) throw new Error(`Loading grids failed: ${response.status}`);
  return response.json();
}

export type Cell = { population: number; polygon: [number, number][] };
export type Count = { population: number | null; cells: Cell[] | null };

export async function countPopulation(apiUrl: string, gridId: number, wktPolygon: string): Promise<Count> {
  const response = await fetch(join(apiUrl, '/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grid_id: gridId, polygon_srid: 4326, polygon: wktPolygon }),
  });
  if (!response.ok) throw new Error(`Counting failed: ${response.status}`);
  const { population, cells } = await response.json();
  return { population, cells: cells ?? null };
}

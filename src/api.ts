export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export type GridInput = { name: string; size: string; srid: number };
export type DataDefinition = {
  population_key: string;
  x_column: string;
  y_column: string;
  delimiter: string;
  decode: string;
};
export type Grid = GridInput & { id: number; number_of_location: number };

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

  const response = await fetch(`${input.apiUrl.replace(/\/+$/, '')}/admin/grids`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: form,
  });
  if (!response.ok) throw new UploadError(REASONS[response.status] ?? 'failed');
  return response.json();
}

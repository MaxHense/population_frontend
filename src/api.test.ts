import { afterEach, describe, expect, test, vi } from 'vitest';
import { uploadGrid, UploadError } from './api';

const input = {
  apiUrl: 'https://api.example.org',
  token: 'secret-token',
  grid: { name: 'Zensus', size: '1km', srid: 3035 },
  dataDefinition: { population_key: 'Einwohner', x_column: 'x', y_column: 'y', delimiter: ';', decode: 'utf-8' },
  file: new File(['x;y;Einwohner\n'], 'zensus.csv', { type: 'text/csv' }),
};

function mockFetch(status: number, body: unknown = {}) {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => vi.unstubAllGlobals());

describe('uploadGrid', () => {
  test('posts multipart form to /admin/grids with bearer token', async () => {
    const fetch = mockFetch(200, { id: 1 });

    await uploadGrid(input);

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.example.org/admin/grids');
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer secret-token');
    const form = init.body as FormData;
    expect(JSON.parse(form.get('grid') as string)).toEqual(input.grid);
    expect(JSON.parse(form.get('data_definition') as string)).toEqual(input.dataDefinition);
    expect((form.get('file') as File).name).toBe('zensus.csv');
  });

  test('handles api url with trailing slash', async () => {
    const fetch = mockFetch(200);
    await uploadGrid({ ...input, apiUrl: 'https://api.example.org/' });
    expect(fetch.mock.calls[0][0]).toBe('https://api.example.org/admin/grids');
  });

  test('returns the created grid', async () => {
    mockFetch(200, { id: 7, name: 'Zensus', size: '1km', srid: 3035, number_of_location: 42 });
    await expect(uploadGrid(input)).resolves.toMatchObject({ id: 7, number_of_location: 42 });
  });

  test.each([
    [401, 'unauthorized'],
    [404, 'disabled'],
    [400, 'invalid'],
    [500, 'failed'],
  ])('status %i rejects with reason "%s"', async (status, reason) => {
    mockFetch(status);
    const error = await uploadGrid(input).catch((e) => e);
    expect(error).toBeInstanceOf(UploadError);
    expect(error.reason).toBe(reason);
  });
});

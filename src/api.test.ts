import { afterEach, describe, expect, test, vi } from 'vitest';
import { countPopulation } from './api';

function mockFetch(status: number, body: unknown = {}) {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => vi.unstubAllGlobals());

describe('countPopulation', () => {
  test('posts the polygon as WGS84 WKT, no grid, and returns the population', async () => {
    const cells = [{ population: 4, polygon: [[47.1, 12.1], [47.2, 12.1], [47.2, 12.2], [47.1, 12.2]] }];
    const fetch = mockFetch(200, { population: 4349717, cells });
    await expect(countPopulation('https://api.example.org/', 'POLYGON ((10 50, 10 51, 11 51, 10 50))'))
      .resolves.toEqual({ population: 4349717, cells });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.example.org/');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ polygon_srid: 4326, polygon: 'POLYGON ((10 50, 10 51, 11 51, 10 50))' });
  });

  test('polygon without inhabited cells: population null, no cells', async () => {
    mockFetch(200, { population: null, cells: [] });
    await expect(countPopulation('https://api.example.org', 'POLYGON ((0 0, 0 1, 1 1, 0 0))'))
      .resolves.toEqual({ population: null, cells: [] });
  });

  test('too many cells: cells null, population still there', async () => {
    mockFetch(200, { population: 83000000, cells: null });
    await expect(countPopulation('https://api.example.org', 'POLYGON ((0 0, 0 1, 1 1, 0 0))'))
      .resolves.toEqual({ population: 83000000, cells: null });
  });

  test('older backend without cells: cells null', async () => {
    mockFetch(200, { population: 7 });
    await expect(countPopulation('https://api.example.org', 'POLYGON ((0 0, 0 1, 1 1, 0 0))'))
      .resolves.toEqual({ population: 7, cells: null });
  });

  test('rejects when the api fails', async () => {
    mockFetch(500);
    await expect(countPopulation('https://api.example.org', 'POLYGON ((0 0, 0 1, 1 1, 0 0))')).rejects.toThrow();
  });
});

import { describe, expect, test } from 'vitest';
import { latLngsToWktPolygon } from './wkt';

describe('latLngsToWktPolygon', () => {
  test('closes the ring and writes lng before lat', () => {
    expect(latLngsToWktPolygon([[50, 10], [51, 10], [51, 11]]))
      .toBe('POLYGON ((10 50, 10 51, 11 51, 10 50))');
  });

  test('keeps an already closed ring', () => {
    expect(latLngsToWktPolygon([{ lat: 50, lng: 10 }, { lat: 51, lng: 10 }, { lat: 51, lng: 11 }, { lat: 50, lng: 10 }]))
      .toBe('POLYGON ((10 50, 10 51, 11 51, 10 50))');
  });

  test('returns empty string for fewer than 3 points', () => {
    expect(latLngsToWktPolygon([[50, 10], [51, 10]])).toBe('');
  });
});

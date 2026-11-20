import { describe, expect, test } from 'vitest';
import {
  addEntry, formatCoordinates, formatPopulation, loadHistory, parseCoordinates, saveHistory, type Entry,
} from './history';

const entry = (id: string, population: number | null = 1): Entry => ({
  id,
  markers: [[52.52, 13.405], [52.4, 13.5], [52.45, 13.3]],
  population,
});

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => { data[k] = v; },
    data,
  };
}

describe('formatPopulation', () => {
  test.each([
    [0, '0'],
    [999, '999'],
    [1000, '1.000'],
    [4349717, '4.349.717'],
    [83155031, '83.155.031'],
  ])('%i -> %s', (n, text) => {
    expect(formatPopulation(n)).toBe(text);
  });

  test('no cells inside the polygon (null) counts as 0', () => {
    expect(formatPopulation(null)).toBe('0');
  });
});

describe('formatCoordinates', () => {
  test('lat, lng with 4 decimals, points separated by semicolon', () => {
    expect(formatCoordinates([[52.52, 13.405], [52.4, 13.51234]])).toBe('52.5200, 13.4050; 52.4000, 13.5123');
  });
});

describe('addEntry', () => {
  test('newest entry is on top, old entries unchanged', () => {
    const history = [entry('b'), entry('a')];
    const next = addEntry(history, entry('c'));
    expect(next.map((e) => e.id)).toEqual(['c', 'b', 'a']);
    expect(history.map((e) => e.id)).toEqual(['b', 'a']);
  });
});

describe('history storage', () => {
  test('saved history is loaded again', () => {
    const storage = memoryStorage();
    saveHistory([entry('b', 5), entry('a', null)], storage);
    expect(loadHistory(storage)).toEqual([entry('b', 5), entry('a', null)]);
  });

  test('empty storage gives empty history', () => {
    expect(loadHistory(memoryStorage())).toEqual([]);
  });

  test('corrupt or foreign data gives empty history instead of crashing', () => {
    expect(loadHistory(memoryStorage({ 'population-history': 'not json' }))).toEqual([]);
    expect(loadHistory(memoryStorage({ 'population-history': '{"a":1}' }))).toEqual([]);
  });

  test('blocked storage (private mode) does not crash', () => {
    const blocked = {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
    };
    expect(loadHistory(blocked)).toEqual([]);
    expect(() => saveHistory([entry('a')], blocked)).not.toThrow();
  });
});

describe('parseCoordinates', () => {
  test('reads the format the list shows', () => {
    expect(parseCoordinates('52.5200, 13.4050; 52.4000, 13.5123')).toEqual([[52.52, 13.405], [52.4, 13.5123]]);
  });

  test('round trip: displayed coordinates can be pasted back', () => {
    const markers: [number, number][] = [[48.06, 11.36], [48.3, 11.54], [-33.8688, 151.2093]];
    expect(parseCoordinates(formatCoordinates(markers))).toEqual(markers);
  });

  test('tolerates extra spaces, line breaks and a trailing semicolon', () => {
    expect(parseCoordinates('  52.52 ,13.4 ;\n 52.4,  13.5 ; ')).toEqual([[52.52, 13.4], [52.4, 13.5]]);
  });

  test('empty input gives no markers', () => {
    expect(parseCoordinates('   ')).toEqual([]);
  });

  test.each([
    ['52.52 13.40', /point 1/i],
    ['52.52, 13.40; 52.4', /point 2/i],
    ['52.52, 13.40; abc, 13.5', /point 2/i],
    ['52,52, 13,40', /point 1/i],
    ['91, 13.4', /latitude/i],
    ['52.5, 181', /longitude/i],
  ])('"%s" is rejected with a helpful message', (input, message) => {
    expect(() => parseCoordinates(input)).toThrow(message);
  });
});

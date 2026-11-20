import { describe, expect, test } from 'vitest';
import { edgesCross, midpoints } from './polygon';

describe('edgesCross', () => {
  test.each([
    ['triangle', [[0, 0], [0, 2], [2, 1]]],
    ['square', [[0, 0], [0, 2], [2, 2], [2, 0]]],
    ['concave shape', [[0, 0], [0, 4], [2, 2], [4, 4], [4, 0]]],
    ['fewer than 3 points', [[0, 0], [1, 1]]],
  ])('%s does not cross', (_, points) => {
    expect(edgesCross(points as [number, number][])).toBe(false);
  });

  test('bow tie crosses', () => {
    expect(edgesCross([[0, 0], [2, 2], [0, 2], [2, 0]])).toBe(true);
  });

  test('closing edge (last back to first) is checked too', () => {
    expect(edgesCross([[0, 0], [0, 2], [2, 0], [2, 2]])).toBe(true);
  });
});

describe('midpoints', () => {
  test('one per edge, including the closing edge, with the index to insert at', () => {
    expect(midpoints([[0, 0], [0, 2], [2, 2]])).toEqual([
      { insertAt: 1, point: [0, 1] },
      { insertAt: 2, point: [1, 2] },
      { insertAt: 3, point: [1, 1] },
    ]);
  });

  test('two points: only the line between them', () => {
    expect(midpoints([[0, 0], [2, 0]])).toEqual([{ insertAt: 1, point: [1, 0] }]);
  });

  test('fewer than two points: none', () => {
    expect(midpoints([[0, 0]])).toEqual([]);
  });
});

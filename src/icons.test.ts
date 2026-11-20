import { describe, expect, test } from 'vitest';
import { CLOSE_ART, GRIP_ART, MARKER_ART, PERSON_ART, pixelSvg } from './icons';

describe('pixelSvg', () => {
  test('one rect per horizontal run of the same colour, dots are transparent', () => {
    const svg = pixelSvg(['AA.B', '....'], { A: 'red', B: 'blue' });
    expect(svg).toContain('viewBox="0 0 4 2"');
    expect(svg).toContain('<rect x="0" y="0" width="2" height="1" fill="red"/>');
    expect(svg).toContain('<rect x="3" y="0" width="1" height="1" fill="blue"/>');
    expect(svg.match(/<rect/g)).toHaveLength(2);
  });

  test('pixel edges stay sharp when scaled', () => {
    expect(pixelSvg(['A'], { A: 'red' })).toContain('shape-rendering="crispEdges"');
  });

  test('unknown colour letter is an error, not a silent gap', () => {
    expect(() => pixelSvg(['X'], {})).toThrow(/X/);
  });
});

describe.each([['marker', MARKER_ART], ['person', PERSON_ART]])('%s art', (_, art) => {
  test('is a 16x16 grid', () => {
    expect(art).toHaveLength(16);
    art.forEach((row) => expect(row).toHaveLength(16));
  });
});

test('close cross is a regular 8x7 grid', () => {
  expect(CLOSE_ART).toHaveLength(7);
  CLOSE_ART.forEach((row) => expect(row).toHaveLength(8));
});

test('grip is a regular 10x10 grid', () => {
  expect(GRIP_ART).toHaveLength(10);
  GRIP_ART.forEach((row) => expect(row).toHaveLength(10));
});

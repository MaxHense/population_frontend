// Win95-style pixel icons, drawn as ASCII grids: one letter = one pixel, "." = transparent.

export function pixelSvg(rows: string[], palette: Record<string, string>, size?: number): string {
  const rects: string[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      const c = row[x];
      let end = x + 1;
      while (row[end] === c) end++;
      if (c !== '.') {
        const fill = palette[c];
        if (!fill) throw new Error(`No colour for pixel "${c}"`);
        rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${fill}"/>`);
      }
      x = end;
    }
  });
  const w = rows[0].length;
  const h = rows.length;
  const dims = size ? ` width="${size}" height="${size * h / w}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${dims} shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
}

// Push pin: red head with highlight, steel needle. Tip = bottom centre.
export const MARKER_ART = [
  '.....KKKKKK.....',
  '...KKRRRRRRKK...',
  '..KRRWWRRRRRDK..',
  '..KRWWRRRRRRDK..',
  '.KRRWRRRRRRRDDK.',
  '.KRRRRRRRRRRDDK.',
  '.KRRRRRRRRRDDDK.',
  '..KRRRRRRRDDDK..',
  '..KDRRRRDDDDDK..',
  '...KKDDDDDDKK...',
  '.....KKKKKK.....',
  '.......KS.......',
  '.......KS.......',
  '.......KG.......',
  '.......KG.......',
  '.......K........',
];

// Bust pictogram in the text colour (black, white when the row is selected).
export const PERSON_ART = [
  '................',
  '......####......',
  '.....######.....',
  '....########....',
  '....########....',
  '....########....',
  '.....######.....',
  '......####......',
  '................',
  '...##########...',
  '..############..',
  '.##############.',
  '.##############.',
  '.##############.',
  '.##############.',
  '................',
];

const MARKER_COLOURS = { K: '#000000', R: '#ff0000', D: '#800000', W: '#ffffff', S: '#c0c0c0', G: '#808080' };

export const markerSvg = (size: number) => pixelSvg(MARKER_ART, MARKER_COLOURS, size);
export const personSvg = (size: number) => pixelSvg(PERSON_ART, { '#': 'currentColor' }, size);

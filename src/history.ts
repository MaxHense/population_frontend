export type LatLng = [number, number];

export type Entry = {
  id: string;
  markers: LatLng[];
  population: number | null; // null: no inhabited cell inside the polygon
};

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

const KEY = 'population-history';
const thousands = new Intl.NumberFormat('de-DE', { useGrouping: true, maximumFractionDigits: 0 });

export const formatPopulation = (population: number | null) => thousands.format(population ?? 0);

export const formatCoordinates = (markers: LatLng[]) =>
  markers.map(([lat, lng]) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`).join('; ');

const NUMBER = /^-?\d+(\.\d+)?$/;

/** Reverse of formatCoordinates: "lat, lng; lat, lng". Throws with a message for the status bar. */
export function parseCoordinates(text: string): LatLng[] {
  return text.split(';').map((p) => p.trim()).filter(Boolean).map((point, i) => {
    const parts = point.split(',').map((x) => x.trim());
    if (parts.length !== 2 || !parts.every((x) => NUMBER.test(x))) {
      throw new Error(`Point ${i + 1}: expected "lat, lng" with a dot as decimal separator.`);
    }
    const [lat, lng] = parts.map(Number);
    if (lat < -90 || lat > 90) throw new Error(`Point ${i + 1}: latitude must be between -90 and 90.`);
    if (lng < -180 || lng > 180) throw new Error(`Point ${i + 1}: longitude must be between -180 and 180.`);
    return [lat, lng];
  });
}

export const addEntry = (history: Entry[], entry: Entry) => [entry, ...history];

const isEntry = (e: unknown): e is Entry => {
  const x = e as Entry;
  return typeof x?.id === 'string'
    && Array.isArray(x.markers)
    && x.markers.every((m) => Array.isArray(m) && m.length === 2 && m.every(Number.isFinite))
    && (x.population === null || typeof x.population === 'number');
};

export function loadHistory(storage: Storage): Entry[] {
  try {
    const data: unknown = JSON.parse(storage.getItem(KEY) ?? '[]');
    return Array.isArray(data) ? data.filter(isEntry) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: Entry[], storage: Storage) {
  try {
    storage.setItem(KEY, JSON.stringify(history));
  } catch {
    // storage full or blocked (private mode): history just lives until reload
  }
}

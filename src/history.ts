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

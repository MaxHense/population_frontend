import { useEffect, useState, type KeyboardEvent } from 'react';
import type { LatLngExpression } from 'leaflet';
import { MapWithMarkers } from './MapWithMarkers';
import { latLngsToWktPolygon } from '../wkt';
import { API_URL, countPopulation, fetchGrids } from '../api';
import {
  addEntry, formatCoordinates, formatPopulation, loadHistory, parseCoordinates, saveHistory, type Entry, type LatLng,
} from '../history';
import { markerSvg, personSvg } from '../icons';
import '../win95.css';

const germanyCenter: LatLngExpression = [51.255583, 10.352611];
const MARKER_ICON = { __html: markerSvg(16) }; // static, generated from our own pixel art
const PERSON_ICON = { __html: personSvg(16) };
const EXAMPLE = '52.5200, 13.4050; 52.4000, 13.5123; 52.4500, 13.3000';

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {} }; // storage blocked: history until reload
  }
}

function GermanyMap() {
  const [history, setHistory] = useState<Entry[]>(() => loadHistory(browserStorage()));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitKey, setFitKey] = useState<string | null>(null); // new value = zoom to markers
  const [markers, setMarkers] = useState<LatLng[]>([]);
  const [busy, setBusy] = useState(false);
  const [coordInput, setCoordInput] = useState('');
  const [status, setStatus] = useState('Click the map to set at least 3 markers.');
  // ponytail: first grid only, add a grid picker when there is more than one dataset
  const [gridId, setGridId] = useState<number | null>(null);

  useEffect(() => {
    fetchGrids(API_URL)
      .then((grids) => setGridId(grids[0]?.id ?? null))
      .catch(() => setStatus('Server not reachable.'));
  }, []);

  useEffect(() => saveHistory(history, browserStorage()), [history]);

  const changeMarkers = (next: LatLng[]) => {
    setMarkers(next);
    setSelectedId(null); // edited markers no longer match the selected entry
  };

  const select = (entry: Entry) => {
    setSelectedId(entry.id);
    setMarkers(entry.markers);
    setFitKey(`${entry.id}-${Date.now()}`);
  };

  const startNew = () => {
    setSelectedId(null);
    setMarkers([]);
    setCoordInput('');
    setStatus('Click the map to set at least 3 markers.');
  };

  const applyCoordinates = () => {
    try {
      const parsed = parseCoordinates(coordInput);
      if (parsed.length === 0) {
        setStatus(`Paste coordinates like: ${EXAMPLE}`);
        return;
      }
      changeMarkers(parsed);
      setFitKey(`input-${Date.now()}`);
      setStatus(parsed.length < 3
        ? `${parsed.length} marker(s) set. At least 3 are needed.`
        : `${parsed.length} markers set. Click Enumerate.`);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const enumerate = async () => {
    if (gridId === null) {
      setStatus('No population data yet. Upload a grid on /admin.');
      return;
    }
    if (markers.length < 3) {
      setStatus('Set at least 3 markers to form a polygon.');
      return;
    }
    setBusy(true);
    setStatus('Enumerating…');
    try {
      const population = await countPopulation(API_URL, gridId, latLngsToWktPolygon(markers));
      const entry: Entry = { id: crypto.randomUUID(), markers, population };
      setHistory((h) => addEntry(h, entry));
      setSelectedId(entry.id);
      setStatus('Ready.');
    } catch {
      setStatus('Enumeration failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const onRowKey = (event: KeyboardEvent, entry: Entry) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(entry);
    }
  };

  return (
    <div className="w95-app">
      <aside className="w95-sidebar">
        <div className="w95-toolbar">
          <button type="button" className="w95-button" onClick={enumerate} disabled={busy}>Enumerate</button>
          <button type="button" className="w95-button" onClick={startNew}>New</button>
        </div>

        <input
          className="w95-input"
          type="text"
          aria-label="Coordinates (lat, lng; lat, lng; …), Enter sets the markers"
          placeholder={EXAMPLE}
          spellCheck={false}
          value={coordInput}
          onChange={(e) => setCoordInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyCoordinates()}
        />

        <ul className="w95-list" role="listbox" aria-label="Enumerations">
          {history.length === 0 && <li className="w95-empty">No enumerations yet.</li>}
          {history.map((entry) => {
            const coordinates = formatCoordinates(entry.markers);
            return (
              <li
                key={entry.id}
                role="option"
                aria-selected={entry.id === selectedId}
                tabIndex={0}
                className="w95-row"
                onClick={() => select(entry)}
                onKeyDown={(e) => onRowKey(e, entry)}
              >
                <div className="w95-line">
                  <span className="w95-icon" dangerouslySetInnerHTML={MARKER_ICON} />
                  <span className="w95-coords" title={coordinates}>{coordinates}</span>
                </div>
                <div className="w95-line w95-result">
                  <span className="w95-icon" dangerouslySetInnerHTML={PERSON_ICON} />
                  <span>{formatPopulation(entry.population)}</span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="w95-status" role="status">{status}</div>
        <p className="w95-note">
          Only population data for Germany (Zensus 2022) is available. Accurate to 1 km.
        </p>
      </aside>

      <main className="w95-map">
        <MapWithMarkers
          center={germanyCenter}
          markers={markers}
          onMarkersChange={changeMarkers}
          fitKey={fitKey}
        />
      </main>
    </div>
  );
}

export default GermanyMap;

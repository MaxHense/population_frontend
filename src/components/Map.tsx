import { useEffect, useState, type KeyboardEvent } from 'react';
import type { LatLngExpression } from 'leaflet';
import { ContextMenu } from './ContextMenu';
import { MapWithMarkers } from './MapWithMarkers';
import { Win95Dialog } from './Win95Dialog';
import { latLngsToWktPolygon } from '../wkt';
import { API_URL, countPopulation, fetchGrids, type Cell } from '../api';
import {
  addEntry, copyText, formatCoordinates, formatPopulation, loadHistory, parseCoordinates, saveHistory,
  type CopyKind, type Entry, type LatLng,
} from '../history';
import { markerSvg, personSvg } from '../icons';
import { edgesCross } from '../polygon';
import { canRedo, canUndo, push, redo, start, undo } from '../undo';
import '../win95.css';

const germanyCenter: LatLngExpression = [51.255583, 10.352611];
const MARKER_ICON = { __html: markerSvg(16) }; // static, generated from our own pixel art
const PERSON_ICON = { __html: personSvg(16) };
const EXAMPLE = '52.5200, 13.4050; 52.4000, 13.5123; 52.4500, 13.3000';
const HINT = 'Click the map to set at least 3 markers or enter 3 coordinates in the input field.';
const CROSSING = 'Edges cross. Drag a point so the outline does not cross itself.';
const NO_CELLS = 'No cell centre is inside the polygon. A cell counts only if its centre is inside.';
const TOO_MANY_CELLS = 'Too many cells to show on the map (more than 2.000).';
const MESSAGE_MS = 5000; // messages replace the hint for a moment
const COPIED: Record<CopyKind, string> = { all: 'Entry copied.', coordinates: 'Coordinates copied.', population: 'Population copied.' };

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {} }; // storage blocked: history until reload
  }
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

function GermanyMap() {
  const [history, setHistory] = useState<Entry[]>(() => loadHistory(browserStorage()));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitKey, setFitKey] = useState<string | null>(null); // new value = zoom to markers
  const [edits, setEdits] = useState(() => start<LatLng[]>([]));
  const [menu, setMenu] = useState<{ index: number; x: number; y: number } | null>(null);
  const [cellsById, setCellsById] = useState<Record<string, Cell[] | null>>({});
  const [busy, setBusy] = useState(false);
  const [coordInput, setCoordInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [copyEntry, setCopyEntry] = useState<Entry | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  // ponytail: first grid only, add a grid picker when there is more than one dataset
  const [gridId, setGridId] = useState<number | null>(null);

  useEffect(() => {
    fetchGrids(API_URL)
      .then((grids) => setGridId(grids[0]?.id ?? null))
      .catch(() => setMessage('Server not reachable.'));
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => saveHistory(history, browserStorage()), [history]);

  const markers = edits.present;
  const crossing = edgesCross(markers);
  const cells = (selectedId && cellsById[selectedId]) || null;

  const changeMarkers = (next: LatLng[]) => {
    setEdits((h) => push(h, next));
    setSelectedId(null); // edited markers no longer match the selected entry
  };

  const undoMarkers = () => {
    setEdits(undo);
    setSelectedId(null);
  };

  const redoMarkers = () => {
    setEdits(redo);
    setSelectedId(null);
  };

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || isTyping(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) undoMarkers();
      else if (key === 'y' || (key === 'z' && e.shiftKey)) redoMarkers();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const select = (entry: Entry) => {
    setEdits((h) => push(h, entry.markers));
    setSelectedId(entry.id);
    setFitKey(`${entry.id}-${Date.now()}`);
  };

  const startNew = () => {
    if (markers.length > 0) setEdits((h) => push(h, []));
    setSelectedId(null);
    setCoordInput('');
    setMessage(null);
  };

  const applyCoordinates = () => {
    try {
      const parsed = parseCoordinates(coordInput);
      if (parsed.length === 0) {
        setMessage(`Enter coordinates like: ${EXAMPLE}`);
        return;
      }
      changeMarkers(parsed);
      setFitKey(`input-${Date.now()}`);
      setMessage(parsed.length < 3
        ? `${parsed.length} marker(s) set. At least 3 are needed.`
        : `${parsed.length} markers set. Click Enumerate.`);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const enumerate = async () => {
    if (gridId === null) {
      setMessage('No population data available. Server not reachable or no grid uploaded (/admin).');
      return;
    }
    if (markers.length < 3) {
      setMessage('Set at least 3 markers to form a polygon.');
      return;
    }
    if (crossing) return;
    setBusy(true);
    try {
      const count = await countPopulation(API_URL, gridId, latLngsToWktPolygon(markers));
      const entry: Entry = { id: crypto.randomUUID(), markers, population: count.population };
      setHistory((h) => addEntry(h, entry));
      setCellsById((c) => ({ ...c, [entry.id]: count.cells }));
      setSelectedId(entry.id);
      if (count.cells === null) setMessage(TOO_MANY_CELLS);
      else if (count.cells.length === 0) setMessage(NO_CELLS);
    } catch {
      setMessage('Enumeration failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (entry: Entry, kind: CopyKind) => {
    setCopyEntry(null);
    try {
      await navigator.clipboard.writeText(copyText(entry, kind));
      setMessage(COPIED[kind]);
    } catch {
      setMessage('Copy failed: clipboard not available.');
    }
  };

  const clearHistory = () => {
    setConfirmClear(false);
    setHistory([]);
    setCellsById({});
    setSelectedId(null);
    setMessage('History cleared.');
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
        <div className="w95-status" role="status">{busy ? 'Enumerating…' : (crossing && CROSSING) || message || HINT}</div>

        <div className="w95-toolbar">
          <button type="button" className="w95-button" onClick={enumerate} disabled={busy || crossing}>Enumerate</button>
          <button type="button" className="w95-button" onClick={startNew}>New</button>
          <button type="button" className="w95-button" onClick={() => changeMarkers([])} disabled={markers.length === 0}>
            Clear
          </button>
        </div>

        <div className="w95-toolbar">
          <button type="button" className="w95-button" onClick={undoMarkers} disabled={!canUndo(edits)} title="Undo (Ctrl+Z)">Undo</button>
          <button type="button" className="w95-button" onClick={redoMarkers} disabled={!canRedo(edits)} title="Redo (Ctrl+Y)">Redo</button>
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
                  <button
                    type="button"
                    className="w95-button w95-small"
                    aria-label="Copy…"
                    title="Copy…"
                    onClick={(e) => { e.stopPropagation(); setCopyEntry(entry); }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    …
                  </button>
                </div>
                <div className="w95-line w95-result">
                  <span className="w95-icon" dangerouslySetInnerHTML={PERSON_ICON} />
                  <span>{formatPopulation(entry.population)}</span>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="w95-button w95-wide"
          onClick={() => setConfirmClear(true)}
          disabled={history.length === 0}
        >
          Clear History
        </button>

        <p className="w95-note">
          Only population data for Germany (Zensus 2022) is available. Accurate to 1 km.
        </p>
      </aside>

      <main className="w95-map">
        <MapWithMarkers
          center={germanyCenter}
          markers={markers}
          cells={cells}
          crossing={crossing}
          onMarkersChange={changeMarkers}
          onMarkerMenu={(index, x, y) => setMenu({ index, x, y })}
          fitKey={fitKey}
        />
      </main>

      <ContextMenu
        at={menu}
        items={[{ label: 'Delete point', onSelect: () => menu && changeMarkers(markers.filter((_, i) => i !== menu.index)) }]}
        onClose={() => setMenu(null)}
      />

      <Win95Dialog title="Copy" open={copyEntry !== null} onClose={() => setCopyEntry(null)}>
        <div className="w95-dialog-actions w95-dialog-stack">
          {copyEntry && (
            <>
              <button type="button" className="w95-button" onClick={() => copy(copyEntry, 'all')}>Copy all</button>
              <button type="button" className="w95-button" onClick={() => copy(copyEntry, 'coordinates')}>Copy coordinates</button>
              <button type="button" className="w95-button" onClick={() => copy(copyEntry, 'population')}>Copy population</button>
            </>
          )}
          <button type="button" className="w95-button" onClick={() => setCopyEntry(null)}>Cancel</button>
        </div>
      </Win95Dialog>

      <Win95Dialog title="Clear history" open={confirmClear} onClose={() => setConfirmClear(false)}>
        <p className="w95-dialog-text">Delete all enumerations? This cannot be undone.</p>
        <div className="w95-dialog-actions">
          <button type="button" className="w95-button" onClick={clearHistory}>Yes</button>
          <button type="button" className="w95-button" onClick={() => setConfirmClear(false)}>No</button>
        </div>
      </Win95Dialog>
    </div>
  );
}

export default GermanyMap;

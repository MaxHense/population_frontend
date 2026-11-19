import { useState, type FormEvent } from 'react';
import { API_URL, uploadGrid, UploadError, type UploadReason } from '../api';

const TOKEN_KEY = 'admin-token';

const MESSAGES: Record<UploadReason, string> = {
  unauthorized: 'Wrong admin token.',
  disabled: 'Admin API is disabled on this server (ADMIN_TOKEN not set).',
  invalid: 'Server rejected the data. Check grid and CSV columns.',
  failed: 'Upload failed. Try again later.',
};

function readToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function Field({ label, name, defaultValue, type = 'text' }: {
  label: string; name: string; defaultValue?: string; type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input className="rounded border px-2 py-1" name={name} type={type} defaultValue={defaultValue} required />
    </label>
  );
}

function Admin() {
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const token = String(data.get('token'));
    try {
      sessionStorage.setItem(TOKEN_KEY, token); // per tab, gone when closed
    } catch { /* storage blocked: token is only kept in the form */ }

    setBusy(true);
    setStatus('Uploading…');
    try {
      const grid = await uploadGrid({
        apiUrl: API_URL,
        token,
        grid: { name: String(data.get('name')), size: String(data.get('size')), srid: Number(data.get('srid')) },
        dataDefinition: {
          population_key: String(data.get('population_key')),
          x_column: String(data.get('x_column')),
          y_column: String(data.get('y_column')),
          delimiter: String(data.get('delimiter')),
          decode: String(data.get('decode')),
        },
        file: data.get('file') as File,
      });
      setStatus(`Imported grid #${grid.id} "${grid.name}" with ${grid.number_of_location} locations.`);
    } catch (error) {
      setStatus(error instanceof UploadError ? MESSAGES[error.reason] : MESSAGES.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-2xl font-semibold">Admin: upload grid</h1>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <Field label="Admin token" name="token" type="password" defaultValue={readToken()} />
        <Field label="Grid name" name="name" defaultValue="Zensus 2022 1km" />
        <Field label="Cell size" name="size" defaultValue="1km" />
        <Field label="SRID" name="srid" type="number" defaultValue="3035" />
        <Field label="Population column" name="population_key" defaultValue="Einwohner" />
        <Field label="X column" name="x_column" defaultValue="x_mp_1km" />
        <Field label="Y column" name="y_column" defaultValue="y_mp_1km" />
        <Field label="Delimiter" name="delimiter" defaultValue=";" />
        <Field label="Encoding" name="decode" defaultValue="utf-8" />
        <label className="flex flex-col gap-1 text-sm">
          CSV file
          <input name="file" type="file" accept=".csv,text/csv" required />
        </label>
        <button className="rounded bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={busy}>
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </form>
      <p className="mt-4 text-sm" role="status">{status}</p>
    </main>
  );
}

export default Admin;

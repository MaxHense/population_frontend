# Population frontend

Map to draw a polygon and get the population inside it. Talks to the [population backend](https://github.com/MaxHense/population_backend).

## Run

```bash
npm ci
npm run dev
```

- Map: http://localhost:5173

The backend must allow this origin in `CORS_ORIGINS`.

## Configuration

Runtime, not build time: the page reads `/config.json` next to `index.html`.

```json
{ "apiUrl": "https://api.example.org" }
```

`public/config.json` points to `http://localhost:8000` for development.
A deployment replaces it, so the same build runs on any static host.

## Test and build

```bash
npm test
npm run build   # static files in dist/
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

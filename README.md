# Population frontend

Map to draw a polygon and get the population inside it. Talks to the [population backend](https://github.com/MaxHense/population_backend).

## Run

```bash
npm ci
cp .env.example .env    # VITE_API_URL = backend URL as seen from the browser
npm run dev
```

- Map: http://localhost:5173
- Admin (upload grids): http://localhost:5173/admin, needs the backend's `ADMIN_TOKEN`

The backend must allow this origin in `CORS_ORIGINS`.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL. Build time: baked into the static build. |

## Test and build

```bash
npm test
npm run build   # static files in dist/
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

# Video Comparison Study

A 22-comparison study with synchronized video playback, layout and timing references, and three preference questions. The interface adapts to desktop and mobile screens and saves progress locally while retrying uploads.

## Development

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
```

Set `VITE_APPS_SCRIPT_URL` to the deployed receiver endpoint. With no endpoint, responses stay on the current device.

## Collection

Study identifier: `act-evolution-polished-v1`. The receiver supports the existing study separately; this study uses `Evolution_Sessions`, `Evolution_Responses`, and `Evolution_MethodMap`. Candidate codes and media names are neutral. The method map and source receipts are held outside the public repository.

The GitHub Pages workflow uses the repository variable `VITE_APPS_SCRIPT_URL` when building the site.

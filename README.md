# hubdeploy-vite-test

A small Vite + React project used to test HubDeploy's npm build pipeline
(backlog issue 4.3-8). Throwaway; nothing here is meant for real use.

| Branch | What it tests |
|---|---|
| `main` | A normal build. The page shows `VITE_GREETING`, which ends up in the public JavaScript. |
| `slow` | A silent 150 s `prebuild` (the build log stream must stay open through Cloudflare) plus a network check from inside the build container. |
| `fail-build` | `npm run build` fails, so HubDeploy must show `npm_build_failed`. |

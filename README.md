# hubdeploy-vite-test

Throwaway projects used to test HubDeploy's build pipelines: a Vite + React
project for npm builds (backlog issue 4.3-8) and a small Express app with a
Dockerfile (4.4-1). Nothing here is meant for real use.

| Branch | What it tests |
|---|---|
| `main` | A normal build. The page shows `VITE_GREETING`, which ends up in the public JavaScript. |
| `slow` | A silent 150 s `prebuild` (the build log stream must stay open through Cloudflare) plus a network check from inside the build container. |
| `fail-build` | `npm run build` fails, so HubDeploy must show `npm_build_failed`. |
| `docker-express` | A Dockerfile app (Express, `npm ci` in a `RUN` step, `USER node`, `EXPOSE 3000`). `GET /` shows the port, the user and the cgroup limits it runs under. `GET /probe` (header `X-Probe-Token` = the `PROBE_TOKEN` env var) checks from inside the app that Traefik, other apps, the socket proxy, HubDeploy, the host, the LAN, Tailscale and link-local are unreachable and the internet is reachable. |
| `docker-not-listening` | Same app, but it listens on `127.0.0.1`, so HubDeploy's health check must fail with `app_not_listening` and leave nothing behind. |

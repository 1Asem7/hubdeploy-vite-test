// A small Express app for testing HubDeploy's Dockerfile pipeline (backlog 4.4-1).
//
//   GET /        what the container sees: port, user, its cgroup limits, and
//                whether PROBE_TOKEN reached it at runtime (never its value)
//   GET /probe   tries to reach what a user app must NOT reach, plus one site it
//                must reach; needs the header X-Probe-Token equal to PROBE_TOKEN
//
// Throwaway; nothing here is meant for real use.

import { timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import net from 'node:net';
import express from 'express';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = '0.0.0.0';
const TIMEOUT_MS = 3000;

// Each target must be blocked, except the last one.
const TARGETS = [
  { host: 'traefik', port: 8080, what: 'Traefik API and dashboard' },
  { host: 'traefik', port: 80, what: 'Traefik routers (any Host header, skips Cloudflare Access)' },
  { host: 'hd-maqueta', port: 8080, what: 'another app (hd-maqueta) by name' },
  { host: 'docker-proxy', port: 2375, what: 'Docker socket proxy by name' },
  { host: 'hubdeploy', port: 3000, what: 'HubDeploy by name' },
  { host: '172.30.0.1', port: 22, what: 'host SSH through the apps gateway' },
  { host: '172.30.0.1', port: 80, what: 'host port 80 through the apps gateway' },
  { host: '172.30.0.1', port: 1880, what: 'host Node-RED through the apps gateway' },
  { host: '172.30.0.1', port: 8080, what: 'host stats server through the apps gateway' },
  { host: '172.31.0.1', port: 22, what: 'host SSH through the build gateway' },
  { host: '192.168.100.1', port: 80, what: 'home router' },
  { host: '192.168.100.150', port: 22, what: 'host SSH on its LAN address' },
  { host: '192.168.100.150', port: 1880, what: 'Node-RED on the LAN address' },
  { host: '192.168.100.150', port: 8080, what: 'stats server on the LAN address' },
  { host: '100.100.100.100', port: 53, what: 'Tailscale DNS' },
  { host: '169.254.169.254', port: 80, what: 'link-local metadata address' },
];
const MUST_REACH = 'https://example.com/';

// Extra targets from the query, e.g. the proxy's or another app's IP.
// Only private IPv4 addresses with a port, at most 5.
const PRIVATE_IP = /^(10\.\d{1,3}|172\.(1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}$/;
const MAX_EXTRA = 5;

function readFirstLine(file) {
  try {
    return readFileSync(file, 'utf8').trim();
  } catch {
    return null;
  }
}

/** Resolve with "reachable" or a "blocked (...)" reason; never rejects. */
function tryTcp(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: TIMEOUT_MS });
    socket.once('connect', () => {
      socket.destroy();
      resolve('reachable');
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(`blocked (no answer in ${TIMEOUT_MS / 1000} s)`);
    });
    socket.once('error', (err) => resolve(`blocked (${err.code ?? err.message})`));
  });
}

async function tryHttps(url) {
  try {
    const answer = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    return `reachable (HTTP ${answer.status})`;
  } catch (err) {
    return `blocked (${err.cause?.code ?? err.name})`;
  }
}

function parseExtra(text) {
  if (typeof text !== 'string' || text === '') {
    return [];
  }
  const items = text.split(',').slice(0, MAX_EXTRA);
  const targets = [];
  for (const item of items) {
    const [host, portText] = item.split(':');
    const port = Number(portText);
    if (PRIVATE_IP.test(host ?? '') && Number.isInteger(port) && port >= 1 && port <= 65535) {
      targets.push({ host, port, what: 'extra target from the query' });
    }
  }
  return targets;
}

function tokenMatches(given) {
  const expected = process.env.PROBE_TOKEN;
  if (typeof given !== 'string' || !expected) {
    return false;
  }
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const app = express();

app.get('/', (req, res) => {
  res.json({
    app: 'hubdeploy-docker-test',
    listening: `${HOST}:${PORT}`,
    uid: process.getuid(),
    probeTokenSet: Boolean(process.env.PROBE_TOKEN),
    cgroup: {
      'memory.max': readFirstLine('/sys/fs/cgroup/memory.max'),
      'memory.swap.max': readFirstLine('/sys/fs/cgroup/memory.swap.max'),
      'cpu.max': readFirstLine('/sys/fs/cgroup/cpu.max'),
      'pids.max': readFirstLine('/sys/fs/cgroup/pids.max'),
    },
  });
});

app.get('/probe', async (req, res) => {
  if (!process.env.PROBE_TOKEN) {
    res.status(503).json({ error: 'PROBE_TOKEN is not set in this container' });
    return;
  }
  if (!tokenMatches(req.get('X-Probe-Token'))) {
    res.status(401).json({ error: 'missing or wrong X-Probe-Token' });
    return;
  }

  const targets = [...TARGETS, ...parseExtra(req.query.extra)];
  const results = await Promise.all(
    targets.map(async (target) => {
      const result = await tryTcp(target.host, target.port);
      return {
        target: `${target.host}:${target.port}`,
        what: target.what,
        expected: 'blocked',
        result,
        pass: result.startsWith('blocked'),
      };
    }),
  );
  const internet = await tryHttps(MUST_REACH);
  results.push({
    target: MUST_REACH,
    what: 'the internet',
    expected: 'reachable',
    result: internet,
    pass: internet.startsWith('reachable'),
  });

  res.json({ allPass: results.every((item) => item.pass), results });
});

app.listen(PORT, HOST, () => {
  console.log(`hubdeploy-docker-test listening on ${HOST}:${PORT}`);
});

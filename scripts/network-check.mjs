// Network check from inside HubDeploy's build container (ARCHITECTURE §7).
// The home router and Node-RED on the host must NOT answer (the host
// firewall drops them); the internet must. Each line goes into the build log.
import net from 'node:net'

const TIMEOUT_MS = 5000

/** Try a TCP connection; resolve with a short text instead of throwing. */
function tryTcp(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port })
    const done = (text) => {
      socket.destroy()
      resolve(text)
    }
    socket.setTimeout(TIMEOUT_MS, () => done('blocked (no answer in 5 s)'))
    socket.once('connect', () => done('REACHABLE'))
    socket.once('error', (err) => done(`blocked (${err.code})`))
  })
}

async function tryHttps(url) {
  try {
    const answer = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    return `reachable (HTTP ${answer.status})`
  } catch (err) {
    return `NOT reachable (${err.cause?.code ?? err.name})`
  }
}

console.log('network-check: home router 192.168.100.1:80 →', await tryTcp('192.168.100.1', 80))
console.log('network-check: Node-RED 192.168.100.150:1880 →', await tryTcp('192.168.100.150', 1880))
console.log('network-check: https://example.com →', await tryHttps('https://example.com'))

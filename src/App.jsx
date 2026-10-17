import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'

// VITE_GREETING is set in HubDeploy's env vars. Vite copies its value into
// the built JavaScript, so anyone can read it: never put a secret in a VITE_* variable.
const greeting = import.meta.env.VITE_GREETING ?? '(VITE_GREETING is not set)'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main>
      <div className="logos">
        <img src={viteLogo} alt="Vite logo" />
        <img src={reactLogo} alt="React logo" />
      </div>
      <h1>HubDeploy Vite test</h1>
      <p>
        VITE_GREETING: <strong data-testid="greeting">{greeting}</strong>
      </p>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Count is {count}
      </button>
    </main>
  )
}

export default App

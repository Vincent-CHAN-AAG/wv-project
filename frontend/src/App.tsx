import { useEffect, useState } from 'react'
import './App.css'
import api from './api'

function App() {
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    api.get('/health')
      .then((res) => setMessage(res.data.status))
      .catch(() => setMessage('Backend unavailable'))
  }, [])

  return (
    <main className="workflow-status" aria-label="py-workflow service status">
      <section className="workflow-status__card" aria-labelledby="workflow-status-title">
        <div className="workflow-status__icon" aria-hidden="true">&gt;_</div>
        <h1 id="workflow-status-title">py-workflow</h1>
        <p className="workflow-status__badge" aria-live="polite">
          <span className={`workflow-status__dot${message === 'ok' ? '' : ' workflow-status__dot--unavailable'}`} aria-hidden="true" />
          Backend service · {message || 'checking'}
        </p>
      </section>
    </main>
  )
}

export default App
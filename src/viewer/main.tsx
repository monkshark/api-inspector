import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import InspectorShell from '../panel/components/InspectorShell'
import '../panel/index.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root not found')

createRoot(rootEl).render(
  <StrictMode>
    <InspectorShell />
  </StrictMode>,
)

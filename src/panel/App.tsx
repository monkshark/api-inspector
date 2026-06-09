import { useNetworkCapture } from './hooks/useNetworkCapture'
import InspectorShell from './components/InspectorShell'

function CaptureBridge() {
  useNetworkCapture()
  return null
}

export default function App() {
  return (
    <>
      <CaptureBridge />
      <InspectorShell />
    </>
  )
}

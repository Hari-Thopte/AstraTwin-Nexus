import { useEffect } from 'react'
import { useNexusStore } from '../../store/nexusStore'

export function NexusRuntime() {
  const initializeBackend = useNexusStore(state => state.initializeBackend)

  useEffect(() => {
    void initializeBackend()
  }, [initializeBackend])

  return null
}

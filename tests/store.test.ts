import { describe, it, expect, beforeEach } from 'vitest'
import { useInspectorStore } from '../src/panel/store/useInspectorStore'
import { makeRequest } from './fixtures'

beforeEach(() => {
  useInspectorStore.setState({
    requests: [],
    resBodies: {},
    selectedId: null,
    diffBaseId: null,
    diffCompareId: null,
  })
})

describe('importEntries', () => {
  it('replaces existing requests instead of appending', () => {
    useInspectorStore.getState().addRequest(makeRequest({ id: 'old' }))
    useInspectorStore
      .getState()
      .importEntries([makeRequest({ id: 'new' })], {
        new: { state: 'loaded', body: 'x' },
      })
    const st = useInspectorStore.getState()
    expect(st.requests.map((r) => r.id)).toEqual(['new'])
    expect(st.resBodies['new'].body).toBe('x')
  })

  it('clears selection and diff state on import', () => {
    useInspectorStore.setState({ selectedId: 'old', diffBaseId: 'old' })
    useInspectorStore.getState().importEntries([makeRequest({ id: 'a' })], {})
    const st = useInspectorStore.getState()
    expect(st.selectedId).toBeNull()
    expect(st.diffBaseId).toBeNull()
  })
})

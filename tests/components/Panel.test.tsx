import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from '@testing-library/react'
import App from '../../src/panel/App'
import { useInspectorStore } from '../../src/panel/store/useInspectorStore'
import { EMPTY_FILTER } from '../../src/core/filter'
import { clearRaw } from '../../src/panel/rawEntries'
import { emitRequest, entry } from '../helpers/chromeMock'

beforeEach(() => {
  clearRaw()
  useInspectorStore.setState({
    requests: [],
    selectedId: null,
    paused: false,
    maskEnabled: true,
    filter: EMPTY_FILTER,
    resBodies: {},
    diffBaseId: null,
    diffCompareId: null,
    hydrated: true,
  })
})

afterEach(() => cleanup())

describe('panel capture', () => {
  it('shows the empty state before any request', () => {
    render(<App />)
    expect(screen.getByText('아직 수집된 요청이 없습니다.')).toBeInTheDocument()
  })

  it('renders a row when a request is captured', () => {
    render(<App />)
    act(() => emitRequest(entry({ url: 'https://api.example.com/v1/users?page=2' })))
    expect(screen.getByText('/v1/users?page=2')).toBeInTheDocument()
  })

  it('hides static assets by default', () => {
    render(<App />)
    act(() => {
      emitRequest(entry({ url: 'https://api.example.com/v1/users' }))
      emitRequest(entry({ url: 'https://api.example.com/a.png', type: 'image' }))
    })
    expect(screen.getByText('/v1/users')).toBeInTheDocument()
    expect(screen.queryByText('/a.png')).not.toBeInTheDocument()
  })
})

describe('panel masking', () => {
  it('masks sensitive headers and reveals them when toggled off', () => {
    render(<App />)
    act(() =>
      emitRequest(
        entry({
          method: 'POST',
          url: 'https://api.example.com/v1/login',
          reqHeaders: { Authorization: 'Bearer supersecrettoken123' },
        }),
      ),
    )
    fireEvent.click(screen.getByText('/v1/login'))
    expect(screen.getByText('Bearer ***MASKED***')).toBeInTheDocument()

    fireEvent.click(screen.getByText('● mask'))
    expect(screen.getByText('Bearer supersecrettoken123')).toBeInTheDocument()
  })
})

describe('panel filtering', () => {
  it('filters the list by url regex', () => {
    render(<App />)
    act(() => {
      emitRequest(entry({ url: 'https://api.example.com/v1/users' }))
      emitRequest(entry({ method: 'POST', url: 'https://api.example.com/v1/login' }))
    })
    expect(screen.getByText('/v1/users')).toBeInTheDocument()
    expect(screen.getByText('/v1/login')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('filter (regex)'), {
      target: { value: 'login' },
    })
    expect(screen.queryByText('/v1/users')).not.toBeInTheDocument()
    expect(screen.getByText('/v1/login')).toBeInTheDocument()
  })
})

describe('panel convert', () => {
  it('renders cURL and copies it to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    render(<App />)
    act(() =>
      emitRequest(
        entry({
          method: 'POST',
          url: 'https://api.example.com/v1/login',
          postJson: '{"u":"a"}',
        }),
      ),
    )
    fireEvent.click(screen.getByText('/v1/login'))
    fireEvent.click(screen.getByText('Convert'))

    expect(screen.getByText(/curl '/)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Copy'))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(writeText.mock.calls[0][0]).toContain('curl')
  })
})

describe('panel response body', () => {
  it('lazy loads and pretty-prints the response body', async () => {
    render(<App />)
    act(() =>
      emitRequest(
        entry({ url: 'https://api.example.com/v1/users', resText: '{"id":99}' }),
      ),
    )
    fireEvent.click(screen.getByText('/v1/users'))
    fireEvent.click(screen.getByText('Body'))

    await waitFor(() =>
      expect(screen.getByText(/"id": 99/)).toBeInTheDocument(),
    )
  })
})

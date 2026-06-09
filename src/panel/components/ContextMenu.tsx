import { useEffect } from 'react'

export interface MenuItem {
  label: string
  onClick: () => void
}

export default function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}) {
  useEffect(() => {
    const close = () => onClose()
    window.addEventListener('click', close)
    window.addEventListener('contextmenu', close)
    window.addEventListener('blur', close)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('contextmenu', close)
      window.removeEventListener('blur', close)
    }
  }, [onClose])

  return (
    <div
      style={{ top: y, left: x }}
      className="fixed z-50 min-w-40 overflow-hidden rounded-md border border-zinc-200 bg-white py-1 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            item.onClick()
            onClose()
          }}
          className="block w-full px-3 py-1.5 text-left text-zinc-700 hover:bg-indigo-600 hover:text-white dark:text-zinc-200"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

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
      className="fixed z-50 flex min-w-[184px] flex-col rounded-lg border border-bd bg-panel p-1 text-[12px] shadow-[0_16px_40px_rgba(0,0,0,0.3)]"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            item.onClick()
            onClose()
          }}
          className="whitespace-nowrap rounded-md px-2.5 py-[7px] text-left text-tx hover:bg-acc hover:text-white"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

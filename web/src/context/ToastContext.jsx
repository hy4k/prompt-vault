import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (message, type = 'success') => {
      const id = ++toastId
      setToasts((prev) => [...prev.slice(-3), { id, message, type }])
      setTimeout(() => dismiss(id), 3200)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-4 right-4 z-[100] flex flex-col items-center gap-2 sm:left-auto sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-2xl ${
              t.type === 'error'
                ? 'border-red-400/30 bg-red-950/70 text-red-200'
                : 'border-gold/30 bg-panel/90 text-gold-soft'
            }`}
          >
            {t.type === 'error' ? (
              <AlertCircle size={16} className="shrink-0 text-red-400" />
            ) : (
              <CheckCircle2 size={16} className="shrink-0 text-gold" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

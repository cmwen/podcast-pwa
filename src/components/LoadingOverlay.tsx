interface LoadingOverlayProps {
  show: boolean
  message?: string
}

/**
 * Loading Overlay Component
 * [Design → Execution] Accessible loading state with spinner
 */
export function LoadingOverlay({ show, message = 'Loading...' }: LoadingOverlayProps) {
  if (!show) return null

  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-label={message}>
      <div className="loading-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}

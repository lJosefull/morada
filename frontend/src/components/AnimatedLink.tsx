import { useCallback, type ReactNode, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'

interface AnimatedLinkProps {
  to: string
  children: ReactNode
  className?: string
  style?: Record<string, string>
  state?: unknown
  onClick?: (e: MouseEvent) => void
}

function startViewTransition(navigate: () => void) {
  if (!(document as any).startViewTransition) {
    navigate()
    return
  }
  ;(document as any).startViewTransition(() => navigate())
}

export default function AnimatedLink({ to, children, className, style, state, onClick }: AnimatedLinkProps) {
  const navigate = useNavigate()

  const handleClick = useCallback((e: MouseEvent) => {
    if (onClick) onClick(e)
    if (e.defaultPrevented) return
    e.preventDefault()
    startViewTransition(() => navigate(to, { state }))
  }, [to, navigate, state, onClick])

  return (
    <a href={to} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  )
}

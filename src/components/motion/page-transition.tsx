import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { DUR, EASE } from './motion.config'

/** Enter animation replayed on each route change (keyed by pathname). Wraps the routed content. */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.base, ease: EASE }}
      className='h-full'
    >
      {children}
    </motion.div>
  )
}

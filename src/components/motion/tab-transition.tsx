import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DUR } from './motion.config'

/** Crossfade between mutually-exclusive views (tabs, view states), keyed by `activeKey`. */
export function TabTransition({ activeKey, children, className }: { activeKey: string; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence mode='wait' initial={false}>
      <motion.div key={activeKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.fast }} className={className}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

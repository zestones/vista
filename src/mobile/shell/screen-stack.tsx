import { useState } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { levelOf } from './route-level'

// `dir`: 1 = deeper (enter from right), -1 = shallower (enter from left), 0 = same level (crossfade).
const VARIANTS = {
  enter: (dir: number) => (dir === 0 ? { opacity: 0 } : { x: dir < 0 ? '-100%' : '100%' }),
  center: { x: '0%', opacity: 1 },
  exit: (dir: number) => (dir === 0 ? { opacity: 0 } : { x: dir < 0 ? '100%' : '-100%' }),
}

/**
 * Native-feeling mobile screen transition (#222): hierarchical navigation slides horizontally on two
 * independent tracks; peer navigation crossfades. `useOutlet` snapshots each route so the exiting
 * screen keeps its own content while it animates out. Direction is derived from the level delta,
 * tracked across renders via state (the previous path/level), so it's correct for both push and back.
 */
export function ScreenStack() {
  const location = useLocation()
  const outlet = useOutlet()
  const [tracked, setTracked] = useState(() => ({ path: location.pathname, level: levelOf(location.pathname), dir: 0 }))
  if (tracked.path !== location.pathname) {
    const level = levelOf(location.pathname)
    setTracked({ path: location.pathname, level, dir: level > tracked.level ? 1 : level < tracked.level ? -1 : 0 })
  }
  const dir = tracked.dir

  return (
    <AnimatePresence initial={false} custom={dir}>
      <motion.div
        key={location.pathname}
        custom={dir}
        variants={VARIANTS}
        initial='enter'
        animate='center'
        exit='exit'
        transition={dir === 0 ? { duration: 0.18 } : { duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className='absolute inset-0 overflow-hidden'
      >
        {/* Scroll on a NON-transformed inner element: a `transform` on the scroll container itself
            breaks `position: sticky` for the screen header (it would scroll away instead of pinning). */}
        <div className='h-full overflow-y-auto'>{outlet}</div>
      </motion.div>
    </AnimatePresence>
  )
}

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
// Deep import (not the ui barrel) to avoid a shell <-> ui barrel cycle (ui composers import from shell).
import { MobileNotifications } from '../ui/mobile-notifications'

/** The screen's own scroll container (ScreenStack gives each screen an `overflow-y-auto` viewport). The
 * first scrollable ancestor is it — don't gate on scrollHeight, which may not exceed the viewport yet
 * while content is still loading at mount. */
function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  let el = node?.parentElement ?? null
  while (el) {
    const oy = getComputedStyle(el).overflowY
    if (oy === 'auto' || oy === 'scroll') return el
    el = el.parentElement
  }
  return null
}

/**
 * Unified mobile screen header (the large-title style introduced on Home): a slim control bar (optional
 * back + the persistent notification bell + an optional action) over a large title with an optional
 * eyebrow. The bar auto-hides on scroll-down and slides back on scroll-up (the native mobile feel), and
 * once the large title has scrolled away it carries the compact title. Used by every screen.
 */
export function ScreenHeader({
  title,
  eyebrow,
  back = false,
  action,
  className,
}: {
  title: string
  eyebrow?: string
  back?: boolean
  action?: ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const barRef = useRef<HTMLElement>(null)
  const [hidden, setHidden] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Track the screen's scroll: hide the bar when scrolling down, reveal on scroll up (always shown near
  // the top), and swap in the compact title once the large title has scrolled under the bar. rAF-throttled.
  useEffect(() => {
    const scroller = getScrollParent(barRef.current)
    if (scroller === null) return
    let lastY = scroller.scrollTop
    let ticking = false
    const update = () => {
      ticking = false
      const y = scroller.scrollTop
      setCollapsed(y > 48)
      if (y < 64) setHidden(false)
      else if (y > lastY + 6) setHidden(true)
      else if (y < lastY - 6) setHidden(false)
      lastY = y
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    // A fragment, NOT a wrapper: the sticky bar must be a direct child of the scroll container, or it
    // would only stick within a short wrapper's box and scroll away after ~one header height.
    <>
      {/* Slim control bar: auto-hides on scroll-down, reveals on scroll-up; carries the compact title. */}
      <motion.header
        ref={barRef}
        animate={{ y: hidden ? '-110%' : '0%' }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={cn('bg-background/90 sticky top-0 z-10 flex items-center gap-2 px-3 py-2 backdrop-blur', className)}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
      >
        {back ? (
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('m.back')}
            className='text-muted-ink -ml-1 shrink-0'
            onClick={() => {
              void navigate(-1)
            }}
          >
            <ArrowLeft />
          </Button>
        ) : (
          <span className='w-7 shrink-0' aria-hidden='true' />
        )}
        <div className='min-w-0 flex-1'>
          <AnimatePresence>
            {collapsed && (
              <motion.span
                key='bar-title'
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className='font-display text-ink block truncate text-[15px] font-semibold'
              >
                {title}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <MobileNotifications />
          {action}
        </div>
      </motion.header>

      {/* Large title (the home look): a quiet eyebrow over the title; scrolls under the sticky bar. */}
      <div className='px-5 pt-1 pb-3'>
        {eyebrow !== undefined && eyebrow !== '' && <p className='text-muted-ink text-[13px]'>{eyebrow}</p>}
        <h1 className='font-display text-ink line-clamp-2 text-[26px] leading-tight font-semibold tracking-[-0.02em]'>{title}</h1>
      </div>
    </>
  )
}

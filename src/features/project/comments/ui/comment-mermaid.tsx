import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Maximize2, RotateCcw, Workflow, X, ZoomIn, ZoomOut } from 'lucide-react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { cn } from '@/lib/utils'

// Lazy-load mermaid (heavy) only when a diagram is actually present -> its own chunk. securityLevel
// 'strict' makes mermaid sanitize the rendered SVG, so the dangerouslySetInnerHTML below is safe.
let mermaidLoader: Promise<(typeof import('mermaid'))['default']> | null = null
function getMermaid() {
  mermaidLoader ??= import('mermaid').then((m) => {
    m.default.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', fontFamily: 'inherit' })
    return m.default
  })
  return mermaidLoader
}

let seq = 0
const PAN_STEP = 70

function PadButton({ onClick, label, sizeCls, children }: { onClick: () => void; label: string; sizeCls: string; children: ReactNode }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'bg-background/95 border-hairline text-muted-ink hover:text-ink hover:bg-secondary grid place-items-center rounded-md border shadow-sm backdrop-blur transition-colors',
        sizeCls,
      )}
    >
      {children}
    </button>
  )
}

/** Control cluster (bottom-right): separate elevated buttons in a pan d-pad + zoom column (GitHub-style). */
function DiagramControls({
  pan,
  zoomIn,
  zoomOut,
  reset,
  showZoom,
  prominent,
}: {
  pan: (dx: number, dy: number) => void
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  showZoom: boolean
  prominent: boolean
}) {
  const { t } = useTranslation()
  const sizeCls = prominent ? 'size-9' : 'size-7'
  const ic = prominent ? 18 : 15
  return (
    <div className={cn('absolute z-10 grid grid-cols-3', prominent ? 'right-5 bottom-5 gap-1.5' : 'right-3 bottom-3 gap-1')}>
      <span className={sizeCls} />
      <PadButton sizeCls={sizeCls} onClick={() => pan(0, PAN_STEP)} label={t('cmt.panUp')}>
        <ChevronUp size={ic} />
      </PadButton>
      {showZoom ? (
        <PadButton sizeCls={sizeCls} onClick={zoomIn} label={t('cmt.zoomIn')}>
          <ZoomIn size={ic} />
        </PadButton>
      ) : (
        <span className={sizeCls} />
      )}
      <PadButton sizeCls={sizeCls} onClick={() => pan(PAN_STEP, 0)} label={t('cmt.panLeft')}>
        <ChevronLeft size={ic} />
      </PadButton>
      <PadButton sizeCls={sizeCls} onClick={reset} label={t('cmt.reset')}>
        <RotateCcw size={ic - 2} />
      </PadButton>
      <PadButton sizeCls={sizeCls} onClick={() => pan(-PAN_STEP, 0)} label={t('cmt.panRight')}>
        <ChevronRight size={ic} />
      </PadButton>
      <span className={sizeCls} />
      <PadButton sizeCls={sizeCls} onClick={() => pan(0, -PAN_STEP)} label={t('cmt.panDown')}>
        <ChevronDown size={ic} />
      </PadButton>
      {showZoom ? (
        <PadButton sizeCls={sizeCls} onClick={zoomOut} label={t('cmt.zoomOut')}>
          <ZoomOut size={ic} />
        </PadButton>
      ) : (
        <span className={sizeCls} />
      )}
    </div>
  )
}

/** The diagram canvas. Wheel-zoom is OFF everywhere (predictable); pan via drag + the d-pad, zoom via buttons. */
function DiagramView({ svg, fullscreen, onToggleFullscreen }: { svg: string; fullscreen: boolean; onToggleFullscreen: () => void }) {
  const { t } = useTranslation()
  return (
    <TransformWrapper
      minScale={0.4}
      maxScale={6}
      wheel={{ disabled: true }}
      panning={{ velocityDisabled: true }}
      doubleClick={{ mode: 'reset' }}
      centerOnInit
    >
      {({ zoomIn, zoomOut, resetTransform, setTransform, instance }) => {
        const pan = (dx: number, dy: number) => {
          const { positionX, positionY, scale } = instance.state
          setTransform(positionX + dx, positionY + dy, scale, 150)
        }
        return (
          <div className='flex h-full flex-col'>
            {fullscreen ? (
              <div className='border-hairline flex shrink-0 items-center justify-between border-b px-3 py-2'>
                <span className='text-ink flex items-center gap-2 text-sm font-medium'>
                  <Workflow size={15} className='text-muted-ink' /> {t('cmt.diagram')}
                </span>
                <button
                  type='button'
                  onClick={onToggleFullscreen}
                  aria-label={t('form.close')}
                  title={t('form.close')}
                  className='text-muted-ink hover:bg-secondary hover:text-ink grid size-8 place-items-center rounded-md transition-colors'
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className='absolute top-2 right-2 z-10'>
                <button
                  type='button'
                  onClick={onToggleFullscreen}
                  aria-label={t('cmt.fullscreen')}
                  title={t('cmt.fullscreen')}
                  className='bg-background/90 border-hairline text-muted-ink hover:text-ink grid size-7 place-items-center rounded-md border shadow-sm backdrop-blur'
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            )}
            <div className={fullscreen ? 'cmt-canvas relative min-h-0 flex-1' : 'relative'}>
              <TransformComponent
                wrapperStyle={{ width: '100%', height: fullscreen ? '100%' : undefined, maxHeight: fullscreen ? undefined : 440 }}
                contentStyle={{ width: '100%', height: fullscreen ? '100%' : undefined }}
              >
                <div className='grid h-full w-full place-items-center p-6 [&_svg]:max-w-none' dangerouslySetInnerHTML={{ __html: svg }} />
              </TransformComponent>
              {/* Inline = subtle pan-only cluster; fullscreen = prominent panel with pan + zoom. */}
              <DiagramControls
                pan={pan}
                zoomIn={() => zoomIn(0.3)}
                zoomOut={() => zoomOut(0.3)}
                reset={() => resetTransform()}
                showZoom={fullscreen}
                prominent={fullscreen}
              />
            </div>
          </div>
        )
      }}
    </TransformWrapper>
  )
}

/** Render a ```mermaid block as a static preview with a clean fullscreen overlay for zoom/pan. */
export function CommentMermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const idRef = useRef(`cmt-mmd-${String(++seq)}`)

  useEffect(() => {
    let cancelled = false
    getMermaid()
      .then((mermaid) => mermaid.render(idRef.current, chart))
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [chart])

  // Escape exits fullscreen.
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  // Invalid diagram -> show the raw source rather than crashing the panel.
  if (failed) {
    return (
      <pre className='hljs'>
        <code>{chart}</code>
      </pre>
    )
  }
  if (!svg) return <div className='text-muted-ink py-6 text-center text-xs'>…</div>

  // Render inline OR fullscreen (never both) so the SVG's internal ids aren't duplicated in the DOM.
  if (fullscreen) {
    return (
      <div className='fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm lg:p-8'>
        <div className='bg-background border-hairline flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-2xl'>
          <DiagramView svg={svg} fullscreen onToggleFullscreen={() => setFullscreen(false)} />
        </div>
      </div>
    )
  }
  return (
    <div className='cmt-mermaid border-hairline bg-card relative overflow-hidden rounded-lg border'>
      <DiagramView svg={svg} fullscreen={false} onToggleFullscreen={() => setFullscreen(true)} />
    </div>
  )
}

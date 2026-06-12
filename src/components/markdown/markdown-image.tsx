import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { ImageOff, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

/**
 * Image rendering for markdown bodies/comments (#261). Constrained inline (the `.md img` / `.cmt-md img`
 * CSS caps width); click opens a zoom/pan lightbox (reusing react-zoom-pan-pinch, like mermaid). An
 * unreachable image degrades to a compact placeholder instead of the browser's broken-icon — note that
 * private-repo GitHub attachments are auth-gated for clients and will 404 until re-hosting lands (#262).
 */
export function MarkdownImage({ src, alt, title }: { src?: string; alt?: string; title?: string }) {
  const { t } = useTranslation()
  const [broken, setBroken] = useState(false)
  const [open, setOpen] = useState(false)

  if (!src || broken) {
    return (
      <span className='border-hairline text-muted-ink my-1 inline-flex items-center gap-1.5 rounded-md border border-dashed px-2 py-1 text-xs'>
        <ImageOff size={13} aria-hidden='true' />
        <span>{alt?.trim() ? alt : t('md.imageUnavailable')}</span>
      </span>
    )
  }

  return (
    <>
      <button type='button' onClick={() => setOpen(true)} aria-label={t('md.viewImage')} className='block max-w-full cursor-zoom-in border-0 bg-transparent p-0'>
        <img src={src} alt={alt ?? ''} title={title} loading='lazy' onError={() => setBroken(true)} />
      </button>
      {open && createPortal(<Lightbox src={src} alt={alt ?? ''} onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const { t } = useTranslation()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Closes via ESC (above) and the explicit X button; no backdrop-click handler since the zoom/pan
  // surface fills the overlay (a backdrop click would conflict with panning anyway).
  return (
    <div role='dialog' aria-modal='true' aria-label={alt || t('md.viewImage')} className='fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4'>
      <TransformWrapper centerOnInit doubleClick={{ mode: 'toggle' }}>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className='absolute top-3 right-3 z-10 flex gap-1.5'>
              <LightboxBtn label={t('cmt.zoomIn')} onClick={() => zoomIn()}>
                <ZoomIn size={16} />
              </LightboxBtn>
              <LightboxBtn label={t('cmt.zoomOut')} onClick={() => zoomOut()}>
                <ZoomOut size={16} />
              </LightboxBtn>
              <LightboxBtn label={t('cmt.reset')} onClick={() => resetTransform()}>
                <RotateCcw size={16} />
              </LightboxBtn>
              <LightboxBtn label={t('form.close')} onClick={onClose}>
                <X size={16} />
              </LightboxBtn>
            </div>
            <TransformComponent wrapperClass='!h-full !w-full' contentClass='!h-full !w-full grid place-items-center'>
              <img src={src} alt={alt} className='max-h-[90vh] max-w-[90vw] object-contain' />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  )
}

function LightboxBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={label}
      title={label}
      className='bg-background/95 border-hairline text-muted-ink hover:text-ink grid size-9 place-items-center rounded-md border shadow-sm backdrop-blur transition-colors'
    >
      {children}
    </button>
  )
}

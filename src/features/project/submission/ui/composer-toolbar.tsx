import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Info,
  Italic,
  Lightbulb,
  Link as LinkIcon,
  List,
  ListOrdered,
  Megaphone,
  OctagonAlert,
  ShieldAlert,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui'

export type ComposerAction =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bold'
  | 'italic'
  | 'bullets'
  | 'numbered'
  | 'code'
  | 'link'
  | 'diagram'
  | `callout:${CalloutKind}`
export type CalloutKind = 'note' | 'tip' | 'important' | 'warning' | 'caution'

const FORMATS: { action: ComposerAction; Icon: LucideIcon; label: string }[] = [
  { action: 'h1', Icon: Heading1, label: 'form.toolH1' },
  { action: 'h2', Icon: Heading2, label: 'form.toolH2' },
  { action: 'h3', Icon: Heading3, label: 'form.toolH3' },
  { action: 'bold', Icon: Bold, label: 'form.toolBold' },
  { action: 'italic', Icon: Italic, label: 'form.toolItalic' },
  { action: 'bullets', Icon: List, label: 'form.toolBullets' },
  { action: 'numbered', Icon: ListOrdered, label: 'form.toolNumbered' },
  { action: 'code', Icon: Code, label: 'form.toolCode' },
  { action: 'link', Icon: LinkIcon, label: 'form.toolLink' },
]

const CALLOUTS: { kind: CalloutKind; Icon: LucideIcon; tone: string }[] = [
  { kind: 'note', Icon: Info, tone: 'text-[#0969da]' },
  { kind: 'tip', Icon: Lightbulb, tone: 'text-[#1a7f37]' },
  { kind: 'important', Icon: Megaphone, tone: 'text-[#8250df]' },
  { kind: 'warning', Icon: AlertTriangle, tone: 'text-[#9a6700]' },
  { kind: 'caution', Icon: OctagonAlert, tone: 'text-[#cf222e]' },
]

/**
 * Composer toolbar (#149): plain-words buttons that write the markdown/callout/mermaid syntax for
 * the client. `mousedown.preventDefault` keeps the textarea selection alive while clicking.
 */
export function ComposerToolbar({ onAction, disabled }: { onAction: (a: ComposerAction) => void; disabled: boolean }) {
  const { t } = useTranslation()
  const keepSelection = (e: React.MouseEvent) => e.preventDefault()
  return (
    <div className='flex flex-wrap items-center gap-0.5'>
      {FORMATS.map(({ action, Icon, label }) => (
        <button
          key={action}
          type='button'
          disabled={disabled}
          title={t(label)}
          aria-label={t(label)}
          onMouseDown={keepSelection}
          onClick={() => onAction(action)}
          className='text-muted-ink hover:bg-secondary hover:text-ink grid size-8 cursor-pointer place-items-center rounded-md transition-colors disabled:opacity-50'
        >
          <Icon size={15} />
        </button>
      ))}

      <span aria-hidden className='bg-hairline mx-1.5 h-5 w-px' />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type='button' variant='ghost' size='sm' disabled={disabled} onMouseDown={keepSelection} className='text-muted-ink gap-1.5'>
            <ShieldAlert size={15} /> {t('form.toolCallout')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-64'>
          {CALLOUTS.map(({ kind, Icon, tone }) => (
            <DropdownMenuItem key={kind} onSelect={() => onAction(`callout:${kind}`)}>
              <Icon size={15} className={tone} />
              <div className='flex flex-col'>
                <span className='font-medium'>{t(`form.callout.${kind}`)}</span>
                <span className='text-muted-ink text-xs'>{t(`form.callout.${kind}Desc`)}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button type='button' variant='ghost' size='sm' disabled={disabled} onMouseDown={keepSelection} onClick={() => onAction('diagram')} className='text-muted-ink gap-1.5'>
        <Workflow size={15} /> {t('form.toolDiagram')}
      </Button>
    </div>
  )
}

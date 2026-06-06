import * as React from 'react'

/** Vista wordmark glyph - three stacked editorial bars on an ink tile. Not a lucide icon. */
function VistaMark({ size = 22, ...props }: React.ComponentProps<'svg'> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' aria-hidden='true' {...props}>
      <rect x='3' y='3' width='18' height='18' rx='5' fill='var(--color-ink, #181d26)' />
      <rect x='6.5' y='8' width='11' height='2.2' rx='1.1' fill='var(--color-sig-peach, #f3c4a0)' />
      <rect x='6.5' y='11.6' width='8' height='2.2' rx='1.1' fill='var(--color-sig-mint, #bfe3c0)' />
      <rect x='6.5' y='15.2' width='5' height='2.2' rx='1.1' fill='var(--color-sig-yellow, #e8c14a)' />
    </svg>
  )
}

export { VistaMark }

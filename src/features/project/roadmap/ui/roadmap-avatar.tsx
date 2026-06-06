const COLORS = ['#1b61c9', '#aa2d00', '#0a2e0e', '#d9a441', '#254fad', '#006400']

function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

interface Props {
  name: string | null
  url?: string | null
  size?: number
}

export function RoadmapAvatar({ name, url, size = 20 }: Props) {
  const label = name ?? '?'
  if (url) {
    return <img src={url} alt={label} className='rounded-full object-cover' style={{ width: size, height: size }} />
  }
  return (
    <span
      aria-label={label}
      className='inline-grid shrink-0 place-items-center rounded-full font-semibold text-white'
      style={{ width: size, height: size, fontSize: size * 0.45, background: hashColor(label) }}
    >
      {label.charAt(0).toUpperCase()}
    </span>
  )
}

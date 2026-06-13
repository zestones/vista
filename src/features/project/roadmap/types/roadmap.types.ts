/** A single issue rendered as a bar on the timeline. */
export interface Bar {
  id: string
  number: number
  title: string
  state: string | null
  start: Date
  end: Date
  url: string | null
  author: string | null
  avatarUrl: string | null
  labels: string[]
}

/** A milestone group (one per milestone row — multi-repo safe). */
export interface Group {
  id: string
  number: number
  title: string
  description: string | null
  /** Owner-authored client-facing sentence (#192); overrides description for clients when set. */
  clientSummary: string | null
  due: Date | null
  color: string
  total: number
  closed: number
  pct: number
  bars: Bar[]
}

/** Output of the mapper: timeline groups (issues with no GitHub milestone become a synthetic group). */
export interface RoadmapView {
  groups: Group[]
}

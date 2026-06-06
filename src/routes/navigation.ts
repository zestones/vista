export interface NavItem {
  /** i18n key */
  label: string
  to: string
}

/** Data-driven sidebar groups (feeds components/layout). */
export const NAVIGATION_GROUPS: NavItem[] = [
  { label: 'nav.workspace', to: '/app' },
  { label: 'nav.admin', to: '/app/admin' },
]

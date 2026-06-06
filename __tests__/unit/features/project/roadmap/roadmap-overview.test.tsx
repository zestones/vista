import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { RoadmapOverview, buildGanttData } from '@/features/project/roadmap'
import type { IssueRow, MilestoneRow, RoadmapData } from '@/services/roadmap'

function ms(id: string, number: number, due: string | null): MilestoneRow {
  return { id, project_repo_id: 'r', number, title: `MS ${String(number)}`, description: 'A stage', due_on: due, state: 'open', open_issues: 0, closed_issues: 0, shared: false, updated_at: '2026-01-01T00:00:00.000Z' }
}
function iss(id: string, milestoneId: string | null, number: number, state: 'open' | 'closed'): IssueRow {
  return { id, project_repo_id: 'r', milestone_id: milestoneId, number, title: `Issue ${String(number)}`, state, labels: [], author_login: 'x', author_avatar_url: null, html_url: null, created_at: '2026-01-01T00:00:00.000Z', closed_at: state === 'closed' ? '2026-01-05T00:00:00.000Z' : null, shared: false, updated_at: '2026-01-01T00:00:00.000Z' }
}

const data: RoadmapData = {
  milestones: [ms('m-a', 1, '2026-03-01T00:00:00.000Z')],
  issues: [iss('i1', 'm-a', 1, 'closed'), iss('i2', 'm-a', 2, 'open'), iss('i3', null, 3, 'open')],
}
const { groups, unscheduled } = buildGanttData(data)

describe('RoadmapOverview (#56)', () => {
  it('renders stats, the milestones table and the unscheduled count', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <RoadmapOverview groups={groups} unscheduled={unscheduled} />
      </I18nextProvider>,
    )
    expect(screen.getByText('MS 1')).toBeTruthy()
    expect(screen.getByText('A stage')).toBeTruthy()
    expect(screen.getByText(/1 issues non planifiées|1 unscheduled issues/)).toBeTruthy()
  })
})

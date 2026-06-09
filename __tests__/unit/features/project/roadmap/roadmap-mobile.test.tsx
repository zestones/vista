import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { RoadmapMobile, buildGanttData, sortRoadmap } from '@/features/project/roadmap'
import type { IssueRow, MilestoneRow, RoadmapData } from '@/services/roadmap'

function ms(id: string, repo: string, number: number, due: string): MilestoneRow {
  return {
    id,
    project_repo_id: repo,
    number,
    title: `MS ${String(number)}`,
    client_summary: null,
    description: null,
    due_on: due,
    state: 'open',
    open_issues: 0,
    closed_issues: 0,
    shared: false,
    updated_at: '2026-01-01T00:00:00.000Z',
  }
}

function iss(id: string, repo: string, milestoneId: string, number: number, state: 'open' | 'closed'): IssueRow {
  return {
    id,
    project_repo_id: repo,
    milestone_id: milestoneId,
    number,
    title: `Issue ${String(number)}`,
    body: null,
    state,
    labels: [],
    author_login: 'tom',
    author_avatar_url: null,
    html_url: null,
    created_at: '2026-01-01T00:00:00.000Z',
    closed_at: state === 'closed' ? '2026-01-05T00:00:00.000Z' : null,
    shared: false,
    updated_at: '2026-01-01T00:00:00.000Z',
  }
}

const data: RoadmapData = {
  milestones: [ms('m-a', 'repoA', 1, '2026-03-01T00:00:00.000Z')],
  issues: [iss('i1', 'repoA', 'm-a', 1, 'open')],
}
const groups = sortRoadmap(buildGanttData(data).groups)

describe('RoadmapMobile (#55)', () => {
  it('renders the milestone list and controls', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <RoadmapMobile groups={groups} />
      </I18nextProvider>,
    )
    expect(screen.getByText('MS 1')).toBeTruthy()
    expect(screen.getByText('Tout')).toBeTruthy()
  })
})

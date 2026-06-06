import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { RoadmapGantt, buildGanttData, sortRoadmap } from '@/features/project/roadmap'
import type { IssueRow, MilestoneRow, RoadmapData } from '@/services/roadmap'

function ms(id: string, repo: string, number: number, due: string): MilestoneRow {
  return {
    id,
    project_repo_id: repo,
    number,
    title: `MS ${String(number)}`,
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
    state,
    labels: [],
    author_login: 'marie',
    author_avatar_url: null,
    html_url: null,
    created_at: '2026-01-01T00:00:00.000Z',
    closed_at: state === 'closed' ? '2026-01-05T00:00:00.000Z' : null,
    shared: false,
    updated_at: '2026-01-01T00:00:00.000Z',
  }
}

const data: RoadmapData = {
  milestones: [ms('m-a', 'repoA', 1, '2026-03-01T00:00:00.000Z'), ms('m-b', 'repoB', 2, '2026-04-01T00:00:00.000Z')],
  issues: [iss('i1', 'repoA', 'm-a', 1, 'open'), iss('i2', 'repoB', 'm-b', 2, 'closed')],
}
const groups = sortRoadmap(buildGanttData(data).groups)

describe('RoadmapGantt (#9)', () => {
  it('renders milestone titles and the toolbar', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <RoadmapGantt groups={groups} />
      </I18nextProvider>,
    )
    expect(screen.getAllByText('MS 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('MS 2').length).toBeGreaterThan(0)
    expect(screen.getByText('Jalon')).toBeTruthy()
  })
})

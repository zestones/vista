import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui'
import { GitHubMark, VistaMark } from '@/components/brand'
import { LangToggle } from '@/components/layout'

describe('shadcn UI kit (#47)', () => {
  it('renders the core primitives without crashing', () => {
    render(
      <div>
        <Button>Save</Button>
        <Badge>New</Badge>
        <Input placeholder='email' />
        <Label htmlFor='x'>Name</Label>
        <Textarea placeholder='desc' />
        <Switch aria-label='share' />
        <Separator />
        <Avatar>
          <AvatarFallback>ZB</AvatarFallback>
        </Avatar>
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>card-body</CardContent>
        </Card>
        <Tabs defaultValue='a'>
          <TabsList>
            <TabsTrigger value='a'>A</TabsTrigger>
          </TabsList>
          <TabsContent value='a'>tab-a-body</TabsContent>
        </Tabs>
        <VistaMark />
        <GitHubMark />
      </div>,
    )

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('email')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('ZB')).toBeInTheDocument()
    expect(screen.getByText('card-body')).toBeInTheDocument()
    expect(screen.getByText('tab-a-body')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('LangToggle persists the chosen language to vista-lang', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LangToggle />
      </I18nextProvider>,
    )
    expect(screen.getByRole('button', { name: 'FR' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(localStorage.getItem('vista-lang')).toBe('en')
  })
})

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Input } from './input'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
}

/** Searchable single-select: a Popover with a filter Input over a scrollable list (#78). */
export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  invalid,
}: {
  options: ComboboxOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  invalid?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = options.find((o) => o.value === value)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
  }, [options, query])

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        <button
          type='button'
          aria-haspopup='listbox'
          aria-expanded={open}
          className={cn(
            'border-input flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            invalid && 'border-destructive',
            !selected && 'text-muted-foreground',
          )}
        >
          <span className='min-w-0 truncate'>{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-[var(--radix-popover-trigger-width)] overflow-hidden p-0'>
        <div className='border-hairline border-b p-2'>
          <Input
            ref={(el) => {
              el?.focus()
            }}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
            }}
            placeholder={searchPlaceholder}
            className='h-8'
          />
        </div>
        <div className='max-h-60 overflow-y-auto'>
          {filtered.length > 0 ? (
            <ul className='p-1'>
              {filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type='button'
                    onClick={() => {
                      onChange(o.value)
                      setOpen(false)
                      setQuery('')
                    }}
                    className='text-ink hover:bg-accent flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm'
                  >
                    <span className='truncate'>{o.label}</span>
                    {o.value === value && <Check className='size-4 shrink-0' />}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-muted-ink px-3 py-6 text-center text-sm'>{emptyText}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

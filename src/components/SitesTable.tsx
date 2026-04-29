'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { ScoreBadge } from './ScoreBadge'

export type SiteRow = {
  id: string
  name: string
  url: string
  performance: number | null
  accessibility: number | null
  best_practices: number | null
  seo: number | null
  lcp: number | null
  cls: number | null
  inp: number | null
  status: number
  error: string | null
  checked_at: string
  // Deltas vs previous run (null if no previous run exists)
  delta_performance: number | null
  delta_accessibility: number | null
  delta_best_practices: number | null
  delta_seo: number | null
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return null
  if (value === 0) return <span className="text-xs text-gray-400 ml-1">±0</span>
  const positive = value > 0
  return (
    <span className={`inline-flex items-center text-xs ml-1 font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
      {positive ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {Math.abs(value)}
    </span>
  )
}

function ScoreCell({ score, delta }: { score: number | null; delta: number | null }) {
  return (
    <div className="flex items-center gap-1">
      <ScoreBadge score={score} />
      <Delta value={delta} />
    </div>
  )
}

const col = createColumnHelper<SiteRow>()

const columns = [
  col.accessor('name', {
    header: 'Site',
    cell: (info) => {
      const { id, url, status } = info.row.original
      const psiUrl = `https://pagespeed.web.dev/report?url=${encodeURIComponent(url)}`
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <a
              href={psiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-900 hover:underline"
            >
              {info.getValue()}
            </a>
            {status === 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-normal">
                Inactive
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 truncate max-w-[240px]">{url}</span>
        </div>
      )
    },
  }),
  col.accessor('performance', {
    header: 'Performance',
    cell: (info) => (
      <ScoreCell score={info.getValue()} delta={info.row.original.delta_performance} />
    ),
  }),
  col.accessor('accessibility', {
    header: 'Accessibility',
    cell: (info) => (
      <ScoreCell score={info.getValue()} delta={info.row.original.delta_accessibility} />
    ),
  }),
  col.accessor('best_practices', {
    header: 'Best Practices',
    cell: (info) => (
      <ScoreCell score={info.getValue()} delta={info.row.original.delta_best_practices} />
    ),
  }),
  col.accessor('seo', {
    header: 'SEO',
    cell: (info) => (
      <ScoreCell score={info.getValue()} delta={info.row.original.delta_seo} />
    ),
  }),
  col.accessor('lcp', {
    header: 'LCP (s)',
    cell: (info) => {
      const v = info.getValue()
      return <span className="tabular-nums text-sm">{v !== null ? v.toFixed(2) : '—'}</span>
    },
  }),
  col.accessor('cls', {
    header: 'CLS',
    cell: (info) => {
      const v = info.getValue()
      return <span className="tabular-nums text-sm">{v !== null ? v.toFixed(3) : '—'}</span>
    },
  }),
  col.accessor('inp', {
    header: 'INP (ms)',
    cell: (info) => {
      const v = info.getValue()
      return <span className="tabular-nums text-sm">{v !== null ? v : '—'}</span>
    },
  }),
  col.accessor('checked_at', {
    header: 'Checked',
    cell: (info) => {
      const value = info.getValue()
      if (!value) return <span className="text-sm text-gray-400 italic">Not checked</span>
      const date = new Date(value)
      if (isNaN(date.getTime())) return <span className="text-sm text-gray-400 italic">Not checked</span>
      const p = (n: number) => String(n).padStart(2, '0')
      const formatted = `${p(date.getUTCDate())}/${p(date.getUTCMonth() + 1)}/${String(date.getUTCFullYear()).slice(-2)} ${p(date.getUTCHours())}:${p(date.getUTCMinutes())}`
      return (
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {formatted}
        </span>
      )
    },
  }),
]

export function SitesTable({ data }: { data: SiteRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider select-none cursor-pointer hover:text-gray-700 whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' ? (
                        <ArrowUp size={12} />
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-30" />
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {row.original.error && cell.column.id === 'name' ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-gray-700">{row.original.name}</span>
                      <span className="text-xs text-red-500">Error: {row.original.error}</span>
                    </div>
                  ) : (
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  )}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-gray-400">
                No data yet. Run the cron job to collect scores.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

type Props = {
  score: number | null
  label?: string
}

function getColour(score: number | null) {
  if (score === null) return 'bg-gray-100 text-gray-400'
  if (score >= 90) return 'bg-green-100 text-green-800'
  if (score >= 50) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
}

export function ScoreBadge({ score, label }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums min-w-[2.5rem] ${getColour(score)}`}
      title={label}
    >
      {score ?? '—'}
    </span>
  )
}

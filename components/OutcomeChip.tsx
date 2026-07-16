import { Outcome, OUTCOME_CONFIG } from '@/lib/outcomes';

interface OutcomeChipProps {
  outcome: Outcome;
}

export default function OutcomeChip({ outcome }: OutcomeChipProps) {
  const config = OUTCOME_CONFIG[outcome.type] ?? OUTCOME_CONFIG['other'];
  if (!OUTCOME_CONFIG[outcome.type]) return null;
  const dateStr = new Date(outcome.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${config.colorClasses}`}
      title={outcome.notes}
    >
      <span>{config.icon}</span>
      <span>{config.shortLabel}</span>
      <span className="opacity-50">· {dateStr}</span>
    </span>
  );
}

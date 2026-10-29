interface Props {
    category: 'LOW' | 'MEDIUM' | 'HIGH' | string | undefined | null
}

const map: Record<string, { cls: string; label: string }> = {
    LOW: { cls: 'badge-green', label: '▲ LOW RISK' },
    MEDIUM: { cls: 'badge-yellow', label: '◆ MEDIUM RISK' },
    HIGH: { cls: 'badge-red', label: '▼ HIGH RISK' },
}

export default function RiskBadge({ category }: Props) {
    const key = (category ?? '').toUpperCase()
    const { cls, label } = map[key] ?? { cls: 'badge-blue', label: key || 'UNKNOWN' }
    return <span className={`badge ${cls}`}>{label}</span>
}

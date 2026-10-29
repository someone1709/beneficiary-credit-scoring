import type { Props } from './ScoreGauge'

interface Props { score: number | null | undefined }

export default function ScoreGauge({ score }: Props) {
    const s = score ?? 0
    const clamped = Math.max(0, Math.min(100, s))
    // SVG semi-circle gauge
    const R = 60
    const cx = 80, cy = 80
    const circumference = Math.PI * R
    const offset = circumference * (1 - clamped / 100)

    const color = clamped >= 65 ? '#10b981' : clamped >= 45 ? '#f59e0b' : '#ef4444'
    const label = clamped >= 65 ? 'Healthy' : clamped >= 45 ? 'Moderate' : 'High Risk'

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="160" height="96" viewBox="0 0 160 96">
                {/* Track */}
                <path
                    d={`M${cx - R},${cy} A${R},${R} 0 0,1 ${cx + R},${cy}`}
                    fill="none" stroke="#1f2d45" strokeWidth="14" strokeLinecap="round"
                />
                {/* Progress */}
                <path
                    d={`M${cx - R},${cy} A${R},${R} 0 0,1 ${cx + R},${cy}`}
                    fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s' }}
                />
                {/* Value */}
                <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>
                    {clamped.toFixed(1)}
                </text>
                <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#64748b">
                    / 100
                </text>
            </svg>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color, letterSpacing: '0.05em' }}>
                {label}
            </span>
        </div>
    )
}

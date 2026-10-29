import React from 'react'

interface Props {
    label: string
    value: string | number
    sub?: string
    color?: string
    icon?: React.ReactNode
}

export default function StatCard({ label, value, sub, color = '#3b82f6', icon }: Props) {
    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
            {icon && (
                <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: `${color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', flexShrink: 0, color
                }}>
                    {icon}
                </div>
            )}
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1.2, marginTop: 2 }}>
                    {value}
                </div>
                {sub && <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: 2 }}>{sub}</div>}
            </div>
        </div>
    )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AssessmentResponse, listAssessments } from '../api/client'
import StatCard from '../components/StatCard'
import RiskBadge from '../components/RiskBadge'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
    const [data, setData] = useState<AssessmentResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        listAssessments()
            .then(setData)
            .catch(() => setError('Could not reach backend. Is Spring Boot running on port 8080?'))
            .finally(() => setLoading(false))
    }, [])

    const avg = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—'
    const avgComposite = avg(data.map(d => d.compositeScore))
    const avgRisk = avg(data.map(d => d.riskScore))

    // Segment distribution for pie chart
    const segmentCounts: Record<string, number> = {}
    data.forEach(d => { segmentCounts[d.segment] = (segmentCounts[d.segment] ?? 0) + 1 })
    const pieData = Object.entries(segmentCounts).map(([name, value]) => ({ name, value }))
    const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444', '#64748b']

    const recent = data.slice(0, 8)

    return (
        <div className="animate-fadein" style={{ padding: '1.5rem 2rem', maxWidth: 1100 }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Dashboard</h1>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.82rem', marginTop: 2 }}>
                    Beneficiary credit scoring overview
                </p>
            </div>

            {error && (
                <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '0.75rem 1rem', color: '#ef4444', marginBottom: '1rem', fontSize: '0.83rem' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <StatCard label="Total Assessments" value={loading ? '…' : data.length} icon="📋" />
                <StatCard label="Avg Composite Score" value={loading ? '…' : avgComposite} icon="⭐" color="#10b981" />
                <StatCard label="Avg Risk Score" value={loading ? '…' : avgRisk} icon="⚠" color="#f59e0b" />
                <StatCard
                    label="High Risk"
                    value={loading ? '…' : data.filter(d => d.riskCategory === 'HIGH').length}
                    sub="of total"
                    icon="🔴"
                    color="#ef4444"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1rem', marginBottom: '1.5rem', alignItems: 'start' }}>
                {/* Segment pie */}
                <div className="card">
                    <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.85rem' }}>Segment Distribution</div>
                    {pieData.length === 0 ? (
                        <div style={{ color: 'var(--color-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>No data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name }) => name} labelLine={false}>
                                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Recent assessments */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1rem 1.25rem 0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>Recent Assessments</div>
                    {loading ? (
                        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
                    ) : recent.length === 0 ? (
                        <div style={{ padding: '1.5rem', color: 'var(--color-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                            No assessments yet. <button className="btn-primary" style={{ marginLeft: 8 }} onClick={() => navigate('/assessments/new')}>Create one →</button>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    {['ID', 'Beneficiary', 'Composite', 'Risk', 'Segment'].map(h => (
                                        <th key={h} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map(a => (
                                    <tr key={a.id} className="table-row" onClick={() => navigate(`/assessments/${a.id}`)} style={{ cursor: 'pointer' }}>
                                        <td style={{ padding: '0.6rem 1rem', fontWeight: 600, color: 'var(--color-muted)', fontSize: '0.8rem' }}>#{a.id}</td>
                                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.82rem' }}>{a.beneficiaryId}</td>
                                        <td style={{ padding: '0.6rem 1rem', fontWeight: 700, color: a.compositeScore >= 65 ? '#10b981' : a.compositeScore >= 45 ? '#f59e0b' : '#ef4444' }}>
                                            {a.compositeScore?.toFixed(1)}
                                        </td>
                                        <td style={{ padding: '0.6rem 1rem' }}><RiskBadge category={a.riskCategory} /></td>
                                        <td style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', color: 'var(--color-muted)' }}>{a.segment}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {data.length > 8 && (
                        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--color-border)', textAlign: 'right' }}>
                            <button className="btn-ghost" onClick={() => navigate('/history')}>View all {data.length} →</button>
                        </div>
                    )}
                </div>
            </div>

            <button className="btn-primary" onClick={() => navigate('/assessments/new')}>
                + New Assessment
            </button>
        </div>
    )
}

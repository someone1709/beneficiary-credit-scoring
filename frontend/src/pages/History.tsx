import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AssessmentResponse, listAssessments } from '../api/client'
import RiskBadge from '../components/RiskBadge'

export default function History() {
    const [data, setData] = useState<AssessmentResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [riskFilter, setRiskFilter] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        listAssessments()
            .then(setData)
            .catch(() => setError('Could not load assessments. Is the backend running?'))
            .finally(() => setLoading(false))
    }, [])

    const filtered = useMemo(() => data.filter(a => {
        const matchSearch = !search || a.beneficiaryId.toLowerCase().includes(search.toLowerCase()) || String(a.id).includes(search)
        const matchRisk = !riskFilter || a.riskCategory === riskFilter
        return matchSearch && matchRisk
    }), [data, search, riskFilter])

    return (
        <div className="animate-fadein" style={{ padding: '1.5rem 2rem', maxWidth: 1100 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Assessment History</h1>
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', marginTop: 2 }}>
                        {data.length} total records
                    </p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/assessments/new')}>+ New Assessment</button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <input
                    className="input-field"
                    placeholder="Search by ID or Beneficiary ID…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 320 }}
                />
                <select
                    className="input-field"
                    value={riskFilter}
                    onChange={e => setRiskFilter(e.target.value)}
                    style={{ maxWidth: 180 }}
                >
                    <option value="">All Risk Levels</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                </select>
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '0.6rem 0.9rem', color: '#ef4444', marginBottom: '1rem', fontSize: '0.82rem' }}>⚠️ {error}</div>}

            <div className="card" style={{ padding: 0 }}>
                {loading ? (
                    <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                        {data.length === 0 ? (
                            <div>No assessments yet. <button className="btn-primary" style={{ marginLeft: 8 }} onClick={() => navigate('/assessments/new')}>Create one →</button></div>
                        ) : 'No results match the current filters.'}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                                    {['#', 'Beneficiary', 'Composite', 'Risk Score', 'Risk', 'Segment', 'Income Bracket', 'Created', 'Ver.', ''].map(h => (
                                        <th key={h} style={{ padding: '0.65rem 0.9rem', textAlign: 'left', fontSize: '0.68rem', color: 'var(--color-muted)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(a => (
                                    <tr key={a.id} className="table-row" onClick={() => navigate(`/assessments/${a.id}`)} style={{ cursor: 'pointer' }}>
                                        <td style={{ padding: '0.55rem 0.9rem', fontWeight: 600, color: 'var(--color-muted)', fontSize: '0.78rem' }}>#{a.id}</td>
                                        <td style={{ padding: '0.55rem 0.9rem', fontWeight: 600, fontSize: '0.82rem' }}>{a.beneficiaryId}</td>
                                        <td style={{ padding: '0.55rem 0.9rem', fontWeight: 700, fontSize: '0.85rem', color: a.compositeScore >= 65 ? '#10b981' : a.compositeScore >= 45 ? '#f59e0b' : '#ef4444' }}>
                                            {a.compositeScore?.toFixed(1)}
                                        </td>
                                        <td style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem' }}>{a.riskScore?.toFixed(1)}</td>
                                        <td style={{ padding: '0.55rem 0.9rem' }}><RiskBadge category={a.riskCategory} /></td>
                                        <td style={{ padding: '0.55rem 0.9rem', fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>{a.segment}</td>
                                        <td style={{ padding: '0.55rem 0.9rem', fontSize: '0.75rem', color: 'var(--color-muted)' }}>{a.incomeBracket}</td>
                                        <td style={{ padding: '0.55rem 0.9rem', fontSize: '0.72rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.55rem 0.9rem', fontSize: '0.75rem', color: 'var(--color-muted)' }}>v{a.version}</td>
                                        <td style={{ padding: '0.55rem 0.9rem' }}>
                                            <button className="btn-ghost" style={{ fontSize: '0.72rem', padding: '0.25rem 0.75rem' }} onClick={e => { e.stopPropagation(); navigate(`/assessments/${a.id}`) }}>View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

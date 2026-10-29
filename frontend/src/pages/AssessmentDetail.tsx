import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AssessmentResponse, getAssessment, rescoreAssessment } from '../api/client'
import ScoreGauge from '../components/ScoreGauge'
import RiskBadge from '../components/RiskBadge'

function fmtINR(n?: number | null) {
    if (n == null) return '—'
    return `₹${Number(n).toLocaleString('en-IN')}`
}

export default function AssessmentDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [data, setData] = useState<AssessmentResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [rescoring, setRescoring] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) return
        getAssessment(Number(id))
            .then(setData)
            .catch(() => setError('Assessment not found or backend offline.'))
            .finally(() => setLoading(false))
    }, [id])

    const handleRescore = async () => {
        if (!data) return
        setRescoring(true); setError('')
        try {
            const updated = await rescoreAssessment(data.id)
            setData(updated)
        } catch {
            setError('Re-score failed. Is the ML service running?')
        } finally {
            setRescoring(false)
        }
    }

    if (loading) return <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
    if (error) return <div style={{ padding: '2rem', color: '#ef4444' }}>{error}</div>
    if (!data) return null

    const segColor = (s: string) => {
        if (s.includes('PRIME')) return '#10b981'
        if (s.includes('STANDARD')) return '#3b82f6'
        if (s.includes('SUB')) return '#f59e0b'
        return '#ef4444'
    }

    return (
        <div className="animate-fadein" style={{ padding: '1.5rem 2rem', maxWidth: 900 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Assessment #{data.id}</h1>
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>{data.beneficiaryId} · v{data.version} · {new Date(data.createdAt).toLocaleString()}</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <button className="btn-primary" onClick={handleRescore} disabled={rescoring}>
                        {rescoring ? 'Re-scoring…' : '↺ Re-score'}
                    </button>
                </div>
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '0.6rem 0.9rem', color: '#ef4444', marginBottom: '1rem', fontSize: '0.82rem' }}>⚠️ {error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem', alignItems: 'start' }}>
                {/* Left: Score */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.85rem' }}>Composite Score</div>
                        <ScoreGauge score={data.compositeScore} />
                        <div style={{ marginTop: '0.75rem' }}><RiskBadge category={data.riskCategory} /></div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: segColor(data.segment), fontWeight: 700 }}>{data.segment}</div>
                    </div>

                    {/* Quick stats */}
                    <div className="card">
                        <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.82rem' }}>ML Scores</div>
                        {[
                            ['Risk Score', `${data.riskScore?.toFixed(2)} / 100`],
                            ['Composite Score', `${data.compositeScore?.toFixed(2)} / 100`],
                            ['Income Bracket', data.incomeBracket],
                            ['Risk Category', data.riskCategory],
                        ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--color-muted)' }}>{k}</span>
                                <span style={{ fontWeight: 700 }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Input data + explanations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Input fields */}
                    <div className="card">
                        <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.82rem' }}>Input Data</div>
                        {[
                            ['Monthly Income', fmtINR(data.monthlyIncome)],
                            ['Monthly Expenses', fmtINR(data.monthlyExpenses)],
                            ['Existing EMI', fmtINR(data.existingEmi)],
                            ['Loan Amount', fmtINR(data.loanAmount)],
                            ['Repayment History', data.repaymentHistory?.toUpperCase()],
                            ['Electricity Usage', data.electricityUsage ? `${data.electricityUsage} kWh` : 'N/A'],
                        ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--color-muted)' }}>{k}</span>
                                <span style={{ fontWeight: 600 }}>{v}</span>
                            </div>
                        ))}
                    </div>

                    {/* Segment reason */}
                    <div className="card">
                        <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.82rem' }}>Segment Reason</div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>{data.segmentReason}</p>
                    </div>

                    {/* Explanations */}
                    {data.explanations?.length > 0 && (
                        <div className="card">
                            <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.82rem' }}>Key Factors</div>
                            <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {data.explanations.map((e, i) => (
                                    <li key={i} style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Document */}
                    {data.docOriginalName && (
                        <div className="card">
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.82rem' }}>Document</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                                📄 {data.docOriginalName} · {data.docMimeType} · {data.docSizeBytes ? `${(data.docSizeBytes / 1024).toFixed(1)} KB` : ''}
                            </div>
                            <div style={{ marginTop: '0.4rem' }}>
                                <span className={`badge ${data.verificationStatus === 'DEMO_UPLOADED' ? 'badge-blue' : 'badge-yellow'}`}>{data.verificationStatus}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Disclaimer */}
            <div style={{ marginTop: '1.25rem', padding: '0.6rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.7rem', color: 'var(--color-muted)' }}>
                ⚠️ {data.disclaimer}
            </div>
        </div>
    )
}

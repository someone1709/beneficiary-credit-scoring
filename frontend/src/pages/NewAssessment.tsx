import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AssessmentRequest, createAssessmentWithDoc, AssessmentResponse } from '../api/client'
import ScoreGauge from '../components/ScoreGauge'
import RiskBadge from '../components/RiskBadge'

type FormValues = AssessmentRequest & { document?: FileList }

const FIELD_GROUPS = [
    {
        title: 'Beneficiary',
        fields: [
            { name: 'beneficiaryId' as const, label: 'Beneficiary ID', type: 'text', placeholder: 'e.g. BEN001', required: true },
        ],
    },
    {
        title: 'Financial Details (INR)',
        fields: [
            { name: 'monthlyIncome' as const, label: 'Monthly Income', type: 'number', placeholder: '18000', required: true },
            { name: 'monthlyExpenses' as const, label: 'Monthly Expenses', type: 'number', placeholder: '9000', required: true },
            { name: 'existingEmi' as const, label: 'Existing EMI', type: 'number', placeholder: '2000', required: true },
            { name: 'loanAmount' as const, label: 'Loan Amount Requested', type: 'number', placeholder: '25000', required: true },
        ],
    },
    {
        title: 'Repayment & Utilities',
        fields: [
            { name: 'electricityUsage' as const, label: 'Electricity Usage (kWh/month, optional)', type: 'number', placeholder: '120', required: false },
        ],
    },
]

export default function NewAssessment() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>()
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<AssessmentResponse | null>(null)
    const [apiError, setApiError] = useState('')
    const navigate = useNavigate()

    const onSubmit = async (data: FormValues) => {
        setSubmitting(true); setApiError(''); setResult(null)
        const { document: docFiles, ...req } = data
        const doc = docFiles && docFiles.length > 0 ? docFiles[0] : undefined
        // coerce numbers
        const payload: AssessmentRequest = {
            ...req,
            monthlyIncome: Number(req.monthlyIncome),
            monthlyExpenses: Number(req.monthlyExpenses),
            existingEmi: Number(req.existingEmi),
            loanAmount: Number(req.loanAmount),
            electricityUsage: req.electricityUsage ? Number(req.electricityUsage) : undefined,
        }
        try {
            const res = await createAssessmentWithDoc(payload, doc)
            setResult(res)
        } catch (err: unknown) {
            const e = err as { response?: { data?: { error?: string; detail?: string; fieldErrors?: Record<string, string> } }; message?: string }
            const d = e?.response?.data
            if (d?.fieldErrors) {
                setApiError(Object.entries(d.fieldErrors).map(([k, v]) => `${k}: ${v}`).join(' | '))
            } else {
                setApiError(d?.error ?? d?.detail ?? e?.message ?? 'Unknown error')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const segmentColor = (seg: string) => {
        if (seg === 'PRIME' || seg === 'LOW_INCOME_PRIME') return '#10b981'
        if (seg === 'STANDARD_PLUS' || seg === 'STANDARD') return '#3b82f6'
        if (seg === 'SUBPRIME') return '#f59e0b'
        return '#ef4444'
    }

    return (
        <div className="animate-fadein" style={{ padding: '1.5rem 2rem', maxWidth: 900 }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>New Assessment</h1>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.82rem', marginTop: 2 }}>
                    Submit beneficiary data for ML-powered credit scoring
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Form */}
                <div className="card">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {FIELD_GROUPS.map(group => (
                            <div key={group.title} style={{ marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem' }}>
                                    {group.title}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: group.fields.length > 1 ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
                                    {group.fields.map(f => (
                                        <div key={f.name}>
                                            <label className="label">{f.label}</label>
                                            <input
                                                className="input-field"
                                                type={f.type}
                                                placeholder={f.placeholder}
                                                step={f.type === 'number' ? 'any' : undefined}
                                                {...register(f.name, { required: f.required ? `${f.label} is required` : false })}
                                            />
                                            {errors[f.name] && <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)' }}>{errors[f.name]?.message}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Repayment history */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="label">Repayment History</label>
                            <select
                                className="input-field"
                                {...register('repaymentHistory', { required: 'Repayment history is required' })}
                            >
                                <option value="">— Select —</option>
                                <option value="good">Good</option>
                                <option value="average">Average</option>
                                <option value="poor">Poor</option>
                            </select>
                            {errors.repaymentHistory && <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)' }}>{errors.repaymentHistory.message}</span>}
                        </div>

                        {/* Document upload */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="label">Supporting Document (optional, PDF/image)</label>
                            <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-muted)', cursor: 'pointer' }}
                                {...register('document')}
                            />
                        </div>

                        {apiError && (
                            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '0.6rem 0.9rem', color: '#ef4444', marginBottom: '1rem', fontSize: '0.82rem' }}>
                                ⚠️ {apiError}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn-primary" type="submit" disabled={submitting}>
                                {submitting ? <><span className="spinner" style={{ display: 'inline-block', width: 14, height: 14, marginRight: 6 }} />Scoring…</> : 'Run Assessment'}
                            </button>
                            <button type="button" className="btn-ghost" onClick={() => navigate('/')}>Cancel</button>
                        </div>
                    </form>
                </div>

                {/* Result panel */}
                {result && (
                    <div className="card card-glow animate-fadein" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>Assessment Result</div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <ScoreGauge score={result.compositeScore} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <RiskBadge category={result.riskCategory} />
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                            <tbody>
                                {[
                                    ['ID', `#${result.id}`],
                                    ['Beneficiary', result.beneficiaryId],
                                    ['Composite Score', result.compositeScore?.toFixed(2)],
                                    ['Risk Score', result.riskScore?.toFixed(2)],
                                    ['Income Bracket', result.incomeBracket],
                                    ['Segment', result.segment],
                                ].map(([label, value]) => (
                                    <tr key={label} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.45rem 0', color: 'var(--color-muted)', fontWeight: 600 }}>{label}</td>
                                        <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700, color: label === 'Segment' ? segmentColor(String(value)) : 'inherit' }}>{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ background: 'var(--color-surface-2)', borderRadius: 8, padding: '0.75rem', fontSize: '0.78rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                            <strong style={{ color: 'var(--color-text)', display: 'block', marginBottom: 4 }}>Reason</strong>
                            {result.segmentReason}
                        </div>
                        {result.explanations?.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Key Factors</div>
                                <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {result.explanations.map((e, i) => (
                                        <li key={i} style={{ fontSize: '0.78rem', color: 'var(--color-text)' }}>{e}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <button className="btn-primary" onClick={() => navigate(`/assessments/${result.id}`)}>
                            View Full Detail →
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

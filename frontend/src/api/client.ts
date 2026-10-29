import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 35000,
})

export interface AssessmentRequest {
    beneficiaryId: string
    monthlyIncome: number
    monthlyExpenses: number
    existingEmi: number
    loanAmount: number
    repaymentHistory: 'good' | 'average' | 'poor'
    electricityUsage?: number
}

export interface AssessmentResponse {
    id: number
    beneficiaryId: string
    monthlyIncome: number
    monthlyExpenses: number
    existingEmi: number
    loanAmount: number
    repaymentHistory: string
    electricityUsage?: number
    riskScore: number
    riskCategory: 'LOW' | 'MEDIUM' | 'HIGH'
    incomeBracket: string
    compositeScore: number
    segment: string
    segmentReason: string
    explanations: string[]
    verificationStatus: string
    docOriginalName?: string
    docMimeType?: string
    docSizeBytes?: number
    docTextExtracted?: boolean
    createdAt: string
    updatedAt: string
    version: number
    disclaimer: string
}

// ── Assessment endpoints ──────────────────────────────────────────────────────

export const createAssessment = (req: AssessmentRequest): Promise<AssessmentResponse> =>
    api.post<AssessmentResponse>('/assessments/json', req).then(r => r.data)

export const createAssessmentWithDoc = (req: AssessmentRequest, doc?: File): Promise<AssessmentResponse> => {
    const form = new FormData()
    Object.entries(req).forEach(([k, v]) => {
        if (v !== undefined && v !== null) form.append(k, String(v))
    })
    if (doc) form.append('document', doc)
    return axios.post<AssessmentResponse>('/api/assessments', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 35000,
    }).then(r => r.data)
}

export const listAssessments = (): Promise<AssessmentResponse[]> =>
    api.get<AssessmentResponse[]>('/assessments').then(r => r.data)

export const getAssessment = (id: number): Promise<AssessmentResponse> =>
    api.get<AssessmentResponse>(`/assessments/${id}`).then(r => r.data)

export const rescoreAssessment = (id: number): Promise<AssessmentResponse> =>
    api.post<AssessmentResponse>(`/assessments/${id}/rescore`).then(r => r.data)

export const getByBeneficiary = (beneficiaryId: string): Promise<AssessmentResponse[]> =>
    api.get<AssessmentResponse[]>(`/assessments/beneficiary/${beneficiaryId}`).then(r => r.data)

export const checkHealth = (): Promise<unknown> =>
    api.get('/health').then(r => r.data)

export default api

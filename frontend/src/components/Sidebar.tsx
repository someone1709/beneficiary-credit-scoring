import { NavLink } from 'react-router-dom'

const links = [
    { to: '/', icon: '⬛', label: 'Dashboard' },
    { to: '/assessments/new', icon: '✚', label: 'New Assessment' },
    { to: '/history', icon: '☰', label: 'History' },
]

export default function Sidebar() {
    return (
        <aside style={{
            width: 220,
            background: 'var(--color-surface)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.25rem 0.75rem',
            flexShrink: 0,
        }}>
            {/* Brand */}
            <div style={{ padding: '0 0.5rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '-0.02em' }}>
                    CreditScore<span style={{ color: 'var(--color-text)' }}>AI</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-muted)', marginTop: 2 }}>
                    Synthetic Data Prototype
                </div>
            </div>

            {/* Nav */}
            <nav style={{ marginTop: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {links.map(l => (
                    <NavLink
                        key={l.to}
                        to={l.to}
                        end={l.to === '/'}
                        className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
                    >
                        <span style={{ fontSize: '0.8rem' }}>{l.icon}</span>
                        {l.label}
                    </NavLink>
                ))}
            </nav>

            {/* Disclaimer */}
            <div style={{ padding: '0.75rem 0.5rem 0', borderTop: '1px solid var(--color-border)', fontSize: '0.65rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                ⚠️ Experimental prototype — outputs based on synthetic training data. Not for real lending decisions.
            </div>
        </aside>
    )
}

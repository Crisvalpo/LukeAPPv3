'use client'

interface JointCompactCardProps {
    joint: {
        id: string
        flanged_joint_number: string
        bolt_size: string | null
        rating: string | null
        material: string | null
        nps: string | null
    }
}

export default function JointCompactCard({ joint }: JointCompactCardProps) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                backgroundColor: '#1a1d2e',
                borderRadius: '6px',
                border: '1px solid #334155',
                fontSize: '0.85rem',
                marginBottom: '4px'
            }}
        >
            {/* Bolt Icon */}
            <span style={{ fontSize: '1.1rem' }}>🔩</span>

            {/* Joint Number */}
            <span style={{
                fontWeight: 'bold',
                color: '#e2e8f0',
                fontSize: '0.9rem'
            }}>
                {joint.flanged_joint_number}
            </span>

            {/* Bolt Size */}
            {joint.bolt_size && (
                <span style={{
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace'
                }}>
                    {joint.bolt_size}
                </span>
            )}

            {/* Rating */}
            {joint.rating && (
                <span style={{
                    color: '#64748b',
                    fontSize: '0.75rem',
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                }}>
                    {joint.rating}
                </span>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Material (Optional, right aligned) */}
            {joint.material && (
                <span style={{
                    color: '#64748b',
                    fontSize: '0.75rem',
                    fontStyle: 'italic'
                }}>
                    {joint.material}
                </span>
            )}

        </div>
    )
}

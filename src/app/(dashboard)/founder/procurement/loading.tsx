export default function ProcurementLoading() {
    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ width: '300px', height: '20px' }}></div>
                </div>
            </div>

            <div className="tabs-nav">
                <div className="skeleton" style={{ width: '120px', height: '40px' }}></div>
                <div className="skeleton" style={{ width: '120px', height: '40px' }}></div>
                <div className="skeleton" style={{ width: '120px', height: '40px' }}></div>
            </div>

            <div style={{ padding: '2rem', display: 'grid', gap: '1rem' }}>
                <div className="skeleton" style={{ width: '100%', height: '200px' }}></div>
            </div>
        </div>
    )
}

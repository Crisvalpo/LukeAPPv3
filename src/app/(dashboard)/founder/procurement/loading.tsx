export default function ProcurementLoading() {
    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
            <div className="space-y-4">
                <div className="skeleton" style={{ width: '200px', height: '32px' }}></div>
                <div className="skeleton ml-4.5" style={{ width: '300px', height: '20px' }}></div>
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

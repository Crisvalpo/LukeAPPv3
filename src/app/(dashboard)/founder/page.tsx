export default function FounderDashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header / Context */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Project Headquarters</h1>
                <p className="text-slate-400">Minera Centinela / Etapa 4</p>
            </div>

            {/* Setup Progress (DashboardView Block) */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>

                <h2 className="text-lg font-bold text-white mb-2">Project Setup Status</h2>
                <div className="w-full bg-white/10 h-2 rounded-full mb-4 overflow-hidden">
                    <div className="bg-blue-500 h-full w-[35%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    <span>35% Ready</span>
                    <span>Target: Field Operations</span>
                </div>
            </div>

            {/* Quick Actions (DashboardView Block) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-white/10 bg-[#1e293b]/50 hover:bg-[#1e293b]/80 transition-colors cursor-pointer group">
                    <h3 className="text-white font-bold group-hover:text-blue-400 transition-colors">Manage Shifts</h3>
                    <p className="text-slate-400 text-sm mt-1">Define work schedules (5x2, 14x14) for the crew.</p>
                </div>

                <div className="p-6 rounded-xl border border-white/10 bg-[#1e293b]/50 hover:bg-[#1e293b]/80 transition-colors cursor-pointer group">
                    <h3 className="text-white font-bold group-hover:text-purple-400 transition-colors">Locations</h3>
                    <p className="text-slate-400 text-sm mt-1">Configure Bodegas, Patios, and Maestranzas.</p>
                </div>
            </div>
        </div>
    )
}

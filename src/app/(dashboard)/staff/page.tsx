import { Building2, Users, Activity, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import '../../../styles/dashboard.css'

export default function StaffDashboardPage() {
    return (
        <div className="dashboard-page">
            {/* Header with Gradient */}
            <div className="dashboard-header">
                <div className="dashboard-header-glow" />
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Global Oversight</h1>
                </div>
                <p className="dashboard-subtitle">Monitor system health and project activity across all tenants</p>
            </div>

            {/* KPI Cards Grid */}
            <div className="kpi-grid">
                {/* Card 1: Projects */}
                <div className="kpi-card">
                    <div className="kpi-card-header">
                        <div className="kpi-icon-box">
                            <Building2 className="kpi-icon" />
                        </div>
                        <div className="kpi-trend">
                            <TrendingUp className="kpi-trend-icon" />
                            <span>+12%</span>
                        </div>
                    </div>
                    <p className="kpi-label">Total Projects</p>
                    <div className="kpi-value-row">
                        <p className="kpi-value">12</p>
                        <p className="kpi-value-note">active deployments</p>
                    </div>
                    <div className="kpi-footer">
                        <CheckCircle2 className="kpi-footer-icon emerald" />
                        <span>8 Active · 4 Planning</span>
                    </div>
                </div>

                {/* Card 2: Users */}
                <div className="kpi-card">
                    <div className="kpi-card-header">
                        <div className="kpi-icon-box purple">
                            <Users className="kpi-icon purple" />
                        </div>
                        <div className="kpi-trend">
                            <TrendingUp className="kpi-trend-icon" />
                            <span>+8%</span>
                        </div>
                    </div>
                    <p className="kpi-label">Total Users</p>
                    <div className="kpi-value-row">
                        <p className="kpi-value">1,248</p>
                        <p className="kpi-value-note">registered accounts</p>
                    </div>
                    <div className="kpi-footer">
                        <Calendar className="kpi-footer-icon purple" />
                        <span>Across 3 companies</span>
                    </div>
                </div>

                {/* Card 3: System Health */}
                <div className="kpi-card">
                    <div className="kpi-card-header">
                        <div className="kpi-icon-box emerald">
                            <Activity className="kpi-icon emerald" />
                        </div>
                        <div className="kpi-trend">
                            <div className="status-dot" />
                            <span>Live</span>
                        </div>
                    </div>
                    <p className="kpi-label">System Status</p>
                    <div className="kpi-value-row">
                        <p className="kpi-value gradient">99.9%</p>
                        <p className="kpi-value-note">uptime</p>
                    </div>
                    <div className="kpi-progress">
                        <div className="kpi-progress-header">
                            <span>Performance</span>
                            <span>Excellent</span>
                        </div>
                        <div className="kpi-progress-bar">
                            <div className="kpi-progress-fill" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects Section */}
            <div className="projects-section">
                <div className="projects-header">
                    <div className="projects-title-group">
                        <h2>
                            Recent Projects
                            <span className="projects-badge">Last 7 days</span>
                        </h2>
                        <p className="projects-description">Active deployments and recent updates</p>
                    </div>
                    <Link href="/staff/projects" className="projects-link">
                        View Full Registry
                        <svg className="projects-link-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Table */}
                <div className="projects-table-container">
                    <div className="projects-table-glow" />
                    <div className="projects-table-wrapper">
                        <table className="projects-table">
                            <thead>
                                <tr>
                                    <th>Project Name</th>
                                    <th>Code</th>
                                    <th>Company</th>
                                    <th>Status</th>
                                    <th>Activity</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div className="project-cell">
                                            <div className="project-icon-box blue">
                                                <Building2 className="project-icon blue" />
                                            </div>
                                            <span className="project-name">Expansión Norte</span>
                                        </div>
                                    </td>
                                    <td><span className="project-code">PRJ-001</span></td>
                                    <td><span className="project-company">Minera Candelaria</span></td>
                                    <td>
                                        <span className="status-badge active">
                                            <span className="status-badge-dot active" />
                                            Active
                                        </span>
                                    </td>
                                    <td><span className="project-activity">2 hours ago</span></td>
                                </tr>
                                <tr>
                                    <td>
                                        <div className="project-cell">
                                            <div className="project-icon-box purple">
                                                <Building2 className="project-icon purple" />
                                            </div>
                                            <span className="project-name">Mantenimiento Planta Sulfuros</span>
                                        </div>
                                    </td>
                                    <td><span className="project-code">PRJ-004</span></td>
                                    <td><span className="project-company">Codelco División Andina</span></td>
                                    <td>
                                        <span className="status-badge pending">
                                            <span className="status-badge-dot pending" />
                                            Pending
                                        </span>
                                    </td>
                                    <td><span className="project-activity">1 day ago</span></td>
                                </tr>
                                <tr>
                                    <td>
                                        <div className="project-cell">
                                            <div className="project-icon-box teal">
                                                <Building2 className="project-icon teal" />
                                            </div>
                                            <span className="project-name">Instalación Chancadores</span>
                                        </div>
                                    </td>
                                    <td><span className="project-code">PRJ-007</span></td>
                                    <td><span className="project-company">Antofagasta Minerals</span></td>
                                    <td>
                                        <span className="status-badge active">
                                            <span className="status-badge-dot active" />
                                            Active
                                        </span>
                                    </td>
                                    <td><span className="project-activity">5 hours ago</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

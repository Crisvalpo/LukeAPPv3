import React from 'react'
import { Folder, FileText, BarChart2, Package, Lock, Search, Trash2, Settings, Eye } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ColorSwatch } from './ColorSwatch'
import { Heading, Text } from '@/components/ui/Typography'
import '@/styles/tables.css'
import '@/styles/engineering.css'
import styles from './styleguide.module.css'

export const metadata = {
    title: 'Style Guide | LukeAPP',
    description: 'Laboratorio de estilos - Sistema de diseño LukeAPP'
}

export default function StyleGuidePage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <span className="text-gradient">Laboratorio de Estilos</span>
                </h1>
                <p className={styles.subtitle}>
                    Sistema de Diseño LukeAPP - Fuente de verdad visual para desarrolladores
                </p>
            </header>

            {/* Standard Page Header Documentation */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>🏛️ Encabezados de Página</h2>
                <p className={styles.sectionDesc}>
                    Estándar para títulos de páginas en el dashboard (Accent Line + Gradient)
                </p>

                <div className={styles.preview} style={{ background: 'var(--color-bg-app)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Basic Header */}
                    <div className="dashboard-header" style={{ marginBottom: '3rem' }}>
                        <div className="dashboard-header-content">
                            <div className="dashboard-accent-line" />
                            <Heading level={1} className="dashboard-title">Título de la Página</Heading>
                        </div>
                        <Text size="base" className="dashboard-subtitle">Descripción corta y concisa del propósito de esta vista</Text>
                    </div>

                    {/* Header with Actions */}
                    <div className="dashboard-header" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="dashboard-header-content-wrapper">
                                <div className="dashboard-header-content">
                                    <div className="dashboard-accent-line" />
                                    <Heading level={1} className="dashboard-title">Título con Acciones</Heading>
                                </div>
                                <Text size="base" className="dashboard-subtitle">Variante con botones de acción a la derecha</Text>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm">Exportar</Button>
                                <Button variant="default" size="sm">+ Nuevo</Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.codeBlock}>
                    <code>{`/* Basic Header */
<div className="dashboard-header">
    <div className="dashboard-header-content">
        <div className="dashboard-accent-line" />
        <Heading level={1} className="dashboard-title">Título de la Página</Heading>
    </div>
    <Text size="base" className="dashboard-subtitle">Descripción corta</Text>
</div>

/* Header with Actions */
<div className="dashboard-header">
     <div className="flex justify-between items-start">
        <div>
            <div className="dashboard-header-content">
                <div className="dashboard-accent-line" />
                <Heading level={1} className="dashboard-title">Título</Heading>
            </div>
            <Text className="dashboard-subtitle">Descripción</Text>
        </div>
        <div className="flex gap-2">
            <Button>Acción</Button>
        </div>
    </div>
</div>`}</code>
                </div>
            </section>

            {/* Quick Reference Table */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>📌 Referencia Rápida</h2>
                <p className={styles.sectionDesc}>
                    Variables más utilizadas para copiar rápidamente
                </p>

                <div className={styles.quickRefGrid}>
                    <div className={styles.quickRefCategory}>
                        <h3 className={styles.quickRefTitle}>Colores Principales</h3>
                        <ul className={styles.quickRefList}>
                            <li><code>var(--color-primary)</code> - Azul característico</li>
                            <li><code>var(--color-success)</code> - Verde éxito</li>
                            <li><code>var(--color-error)</code> - Rojo error</li>
                            <li><code>var(--color-warning)</code> - Naranja advertencia</li>
                        </ul>
                    </div>

                    <div className={styles.quickRefCategory}>
                        <h3 className={styles.quickRefTitle}>Backgrounds</h3>
                        <ul className={styles.quickRefList}>
                            <li><code>var(--color-bg-app)</code> - Fondo principal</li>
                            <li><code>var(--color-bg-surface-1)</code> - Superficie nivel 1</li>
                            <li><code>var(--color-bg-surface-2)</code> - Superficie nivel 2</li>
                        </ul>
                    </div>

                    <div className={styles.quickRefCategory}>
                        <h3 className={styles.quickRefTitle}>Texto</h3>
                        <ul className={styles.quickRefList}>
                            <li><code>var(--color-text-main)</code> - Texto principal</li>
                            <li><code>var(--color-text-muted)</code> - Texto secundario</li>
                            <li><code>var(--color-text-dim)</code> - Texto terciario</li>
                        </ul>
                    </div>

                    <div className={styles.quickRefCategory}>
                        <h3 className={styles.quickRefTitle}>Espaciado</h3>
                        <ul className={styles.quickRefList}>
                            <li><code>var(--spacing-2)</code> - 8px (gaps pequeños)</li>
                            <li><code>var(--spacing-4)</code> - 16px (padding standard)</li>
                            <li><code>var(--spacing-6)</code> - 24px (secciones)</li>
                            <li><code>var(--spacing-8)</code> - 32px (separadores)</li>
                        </ul>
                    </div>

                    <div className={styles.quickRefCategory}>
                        <h3 className={styles.quickRefTitle}>Border Radius</h3>
                        <ul className={styles.quickRefList}>
                            <li><code>var(--radius-sm)</code> - 6px (botones pequeños)</li>
                            <li><code>var(--radius-md)</code> - 10px (inputs)</li>
                            <li><code>var(--radius-lg)</code> - 16px (cards)</li>
                        </ul>
                    </div>

                    <div className={styles.quickRefCategory}>
                        <h3 className={styles.quickRefTitle}>Utilidades</h3>
                        <ul className={styles.quickRefList}>
                            <li><code className="text-primary">.glass-panel</code> - Efecto glassmorphism</li>
                            <li><code className="text-primary">.text-gradient</code> - Texto con gradiente</li>
                            <li><code className="text-primary">.card-3d</code> - Efecto 3D hover</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Colors Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Colores y Variables</h2>
                <p className={styles.sectionDesc}>
                    Variables CSS disponibles en <code>design-system.css</code>
                </p>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Backgrounds</h3>
                    <div className={styles.colorGrid}>
                        <ColorSwatch name="--color-bg-app" value="hsl(220, 20%, 10%)" />
                        <ColorSwatch name="--color-bg-surface-1" value="hsl(220, 15%, 14%)" />
                        <ColorSwatch name="--color-bg-surface-2" value="hsl(220, 15%, 18%)" />
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Primary Colors</h3>
                    <div className={styles.colorGrid}>
                        <ColorSwatch name="--color-primary" value="hsl(215, 90%, 55%)" />
                        <ColorSwatch name="--color-primary-hover" value="hsl(215, 90%, 65%)" />
                        <ColorSwatch name="--color-primary-glow" value="hsla(215, 90%, 55%, 0.5)" />
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Semantic Colors</h3>
                    <div className={styles.colorGrid}>
                        <ColorSwatch name="--color-success" value="hsl(150, 70%, 45%)" />
                        <ColorSwatch name="--color-warning" value="hsl(35, 90%, 60%)" />
                        <ColorSwatch name="--color-error" value="hsl(0, 80%, 60%)" />
                        <ColorSwatch name="--color-info" value="hsl(200, 80%, 55%)" />
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Text Colors</h3>
                    <div className={styles.colorGrid}>
                        <ColorSwatch name="--color-text-main" value="hsl(0, 0%, 98%)" />
                        <ColorSwatch name="--color-text-muted" value="hsl(220, 10%, 70%)" />
                        <ColorSwatch name="--color-text-dim" value="hsl(220, 10%, 45%)" />
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Glassmorphism</h3>
                    <div className={styles.colorGrid}>
                        <ColorSwatch name="--glass-surface" value="hsla(220, 15%, 16%, 0.7)" />
                        <ColorSwatch name="--glass-border" value="hsla(0, 0%, 100%, 0.08)" />
                    </div>
                </div>
            </section>

            {/* Typography Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Tipografía</h2>
                <p className={styles.sectionDesc}>
                    Tamaños de fuente definidos en el sistema de diseño
                </p>

                <div className={styles.typographyShowcase}>
                    <div className={styles.typeRow}>
                        <code className={styles.typeLabel}>--font-size-4xl</code>
                        <div style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 700 }}>
                            Título Principal 3rem
                        </div>
                    </div>
                    <div className={styles.typeRow}>
                        <code className={styles.typeLabel}>--font-size-3xl</code>
                        <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>
                            Título Secundario 2rem
                        </div>
                    </div>
                    <div className={styles.typeRow}>
                        <code className={styles.typeLabel}>--font-size-2xl</code>
                        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}>
                            Subtítulo Grande 1.5rem
                        </div>
                    </div>
                    <div className={styles.typeRow}>
                        <code className={styles.typeLabel}>--font-size-xl</code>
                        <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>
                            Subtítulo Mediano 1.25rem
                        </div>
                    </div>
                    <div className={styles.typeRow}>
                        <code className={styles.typeLabel}>--font-size-lg</code>
                        <div style={{ fontSize: 'var(--font-size-lg)' }}>
                            Texto Grande 1.125rem
                        </div>
                    </div>
                    <div className={styles.typeRow}>
                        <code className={styles.typeLabel}>--font-size-base</code>
                        <div style={{ fontSize: 'var(--font-size-base)' }}>
                            Texto Normal 1rem
                        </div>
                    </div>
                    <div className={styles.typeRow}>
                        <code className={styles.typeLabel}>--font-size-sm</code>
                        <div style={{ fontSize: 'var(--font-size-sm)' }}>
                            Texto Pequeño 0.875rem
                        </div>
                    </div>
                    <div className={styles.typeRow}>
                        <code className={styles.typeLabel}>--font-size-xs</code>
                        <div style={{ fontSize: 'var(--font-size-xs)' }}>
                            Texto Extra Pequeño 0.75rem
                        </div>
                    </div>
                </div>
            </section>

            {/* Tables Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Tablas</h2>
                <p className={styles.sectionDesc}>
                    Estructura estándar para visualización de datos. Usa las clases de <code>tables.css</code>.
                </p>

                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Proyecto</th>
                                    <th>Estado</th>
                                    <th>Progreso</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Folder size={16} className="text-blue-400" />
                                            Expansión Planta Norte
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '999px',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            color: '#34d399',
                                            fontSize: '0.75rem',
                                            fontWeight: 500
                                        }}>
                                            Activo
                                        </span>
                                    </td>
                                    <td>75%</td>
                                    <td>
                                        <Button variant="ghost" size="icon">
                                            <Settings size={16} />
                                        </Button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Folder size={16} className="text-gray-400" />
                                            Mantenimiento Anual
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '999px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#f87171',
                                            fontSize: '0.75rem',
                                            fontWeight: 500
                                        }}>
                                            Detenido
                                        </span>
                                    </td>
                                    <td>30%</td>
                                    <td>
                                        <Button variant="ghost" size="icon">
                                            <Settings size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Navigation Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Botones (Standard)</h2>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
                    <p className={styles.sectionDesc} style={{ color: '#93c5fd', margin: 0 }}>
                        <strong>Regla de Oro:</strong> Usar siempre el componente <code>&lt;Button /&gt;</code>.
                        <br />
                        Este componente encapsula los estilos visuales estándar. Evitar el uso de clases CSS manuales como <code>.btn</code>.
                    </p>
                </div>
                <p className={styles.sectionDesc}>
                    6 variantes × 4 tamaños = 24 combinaciones
                </p>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Default Variant</h3>
                    <div className={styles.buttonRow}>
                        <Button variant="default" size="sm">Small</Button>
                        <Button variant="default" size="default">Default</Button>
                        <Button variant="default" size="lg">Large</Button>
                        <Button variant="default" size="icon"><Search size={16} /></Button>
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Destructive Variant</h3>
                    <div className={styles.buttonRow}>
                        <Button variant="destructive" size="sm">Small</Button>
                        <Button variant="destructive" size="default">Default</Button>
                        <Button variant="destructive" size="lg">Large</Button>
                        <Button variant="destructive" size="icon"><Trash2 size={16} /></Button>
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Outline Variant</h3>
                    <div className={styles.buttonRow}>
                        <Button variant="outline" size="sm">Small</Button>
                        <Button variant="outline" size="default">Default</Button>
                        <Button variant="outline" size="lg">Large</Button>
                        <Button variant="outline" size="icon"><FileText size={16} /></Button>
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Secondary Variant</h3>
                    <div className={styles.buttonRow}>
                        <Button variant="secondary" size="sm">Small</Button>
                        <Button variant="secondary" size="default">Default</Button>
                        <Button variant="secondary" size="lg">Large</Button>
                        <Button variant="secondary" size="icon"><Settings size={16} /></Button>
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Ghost Variant</h3>
                    <div className={styles.buttonRow}>
                        <Button variant="ghost" size="sm">Small</Button>
                        <Button variant="ghost" size="default">Default</Button>
                        <Button variant="ghost" size="lg">Large</Button>
                        <Button variant="ghost" size="icon"><Eye size={16} /></Button>
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Link Variant</h3>
                    <div className={styles.buttonRow}>
                        <Button variant="link" size="sm">Small Link</Button>
                        <Button variant="link" size="default">Default Link</Button>
                        <Button variant="link" size="lg">Large Link</Button>
                    </div>
                </div>
            </section>

            {/* Cards Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Cards</h2>
                <p className={styles.sectionDesc}>
                    Variantes de contenedores disponibles
                </p>

                <div className={styles.cardGrid}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Card Default</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Card base sin efectos especiales. Usa el estilo definido en card.css</p>
                        </CardContent>
                    </Card>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Glass Panel
                        </h3>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                            Efecto glassmorphism con blur y transparencia. Usa la clase <code>.glass-panel</code>
                        </p>
                    </div>

                    <div className="card-3d" style={{
                        padding: '1.5rem',
                        background: 'var(--color-bg-surface-1)',
                        borderRadius: 'var(--radius-lg)'
                    }}>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Card 3D
                        </h3>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                            Efecto 3D al hacer hover. Usa la clase <code>.card-3d</code>
                        </p>
                    </div>

                    <div className="value-card">
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💎</div>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Value Card
                        </h3>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                            Card con animación y estilo premium. Usa la clase <code>.value-card</code>
                        </p>
                    </div>
                </div>
            </section>

            {/* Inputs Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Inputs</h2>
                <p className={styles.sectionDesc}>
                    Estados de campos de entrada
                </p>

                <div className={styles.inputShowcase}>
                    <div className={styles.inputExample}>
                        <label className="auth-label">Normal</label>
                        <Input placeholder="Campo en estado normal" />
                    </div>

                    <div className={styles.inputExample}>
                        <label className="auth-label">Focus</label>
                        <Input placeholder="Campo con focus" autoFocus />
                        <small style={{ color: 'var(--color-text-dim)', fontSize: 'var(--font-size-xs)' }}>
                            Usa <code>--color-primary</code> para el borde
                        </small>
                    </div>

                    <div className={styles.inputExample}>
                        <label className="auth-label">Disabled</label>
                        <Input placeholder="Campo deshabilitado" disabled />
                    </div>

                    <div className={styles.inputExample}>
                        <label className="auth-label">Con Error</label>
                        <Input
                            placeholder="Campo con error"
                            style={{ borderColor: 'var(--color-error)' }}
                        />
                        <small style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)' }}>
                            Este campo es obligatorio
                        </small>
                    </div>
                </div>
            </section>

            {/* Badges Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Badges</h2>
                <p className={styles.sectionDesc}>
                    Etiquetas de estado usando colores semánticos
                </p>

                <div className={styles.badgeRow}>
                    <Badge style={{
                        backgroundColor: 'var(--color-success)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600
                    }}>
                        Success
                    </Badge>
                    <Badge style={{
                        backgroundColor: 'var(--color-warning)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600
                    }}>
                        Warning
                    </Badge>
                    <Badge style={{
                        backgroundColor: 'var(--color-error)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600
                    }}>
                        Error
                    </Badge>
                    <Badge style={{
                        backgroundColor: 'var(--color-info)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600
                    }}>
                        Info
                    </Badge>
                </div>
            </section>

            {/* Tables Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>📊 Tablas</h2>
                <p className={styles.sectionDesc}>
                    Estilos unificados para tablas de datos. Usar <code>.data-table</code> para tabla base.
                </p>

                <div className={styles.preview}>
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>EMPRESA</th>
                                    <th>PROYECTOS</th>
                                    <th>MIEMBROS</th>
                                    <th>CREADA</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>Promet</td>
                                    <td>5</td>
                                    <td>12</td>
                                    <td style={{ color: 'var(--color-text-muted)' }}>11/1/2026</td>
                                </tr>
                                <tr>
                                    <td style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>Salfa</td>
                                    <td>3</td>
                                    <td>8</td>
                                    <td style={{ color: 'var(--color-text-muted)' }}>11/1/2026</td>
                                </tr>
                                <tr>
                                    <td style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>Eimisa</td>
                                    <td>7</td>
                                    <td>15</td>
                                    <td style={{ color: 'var(--color-text-muted)' }}>11/1/2026</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.codeBlock}>
                    <code>{`<div className="data-table-wrapper">
  <table className="data-table">
    <thead>
      <tr>
        <th>EMPRESA</th>
        <th>PROYECTOS</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Promet</td>
        <td>5</td>
      </tr>
    </tbody>
  </table>
</div>`}</code>
                </div>

                <div className={styles.usageNote}>
                    <strong>Variantes:</strong>
                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: 'var(--color-text-muted)' }}>
                        <li><code>.data-table--compact</code> - Menor padding</li>
                        <li><code>.data-table--spacious</code> - Mayor padding</li>
                    </ul>
                    <strong>Importar estilos:</strong> <code>import '@/styles/tables.css'</code>
                </div>
            </section>

            {/* Spacing Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Espaciado</h2>
                <p className={styles.sectionDesc}>
                    Variables de spacing disponibles
                </p>

                <div className={styles.spacingShowcase}>
                    {[1, 2, 3, 4, 6, 8, 12].map(size => (
                        <div key={size} className={styles.spacingRow}>
                            <code className={styles.spacingLabel}>--spacing-{size}</code>
                            <div
                                className={styles.spacingBox}
                                style={{ width: `var(--spacing-${size})`, height: `var(--spacing-${size})` }}
                            />
                            <span className={styles.spacingValue}>
                                {size === 1 ? '4px' :
                                    size === 2 ? '8px' :
                                        size === 3 ? '12px' :
                                            size === 4 ? '16px' :
                                                size === 6 ? '24px' :
                                                    size === 8 ? '32px' : '48px'}
                            </span>
                        </div>
                    ))}
                </div>
            </section>


            {/* Tabs Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Navegación (Tabs)</h2>
                <p className={styles.sectionDesc}>
                    Sistema de navegación por pestañas con dos variantes
                </p>

                <div className={styles.preview}>
                    {/* Default Variant */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 className={styles.subsectionTitle}>Default (Pill)</h3>
                        <p className={styles.sectionDesc} style={{ margin: '0 0 1rem 0' }}>
                            Estilo botón/pastilla, usado en selectores pequeños o interfaces densas.
                        </p>
                        <div className="tabs">
                            <div className="tabs__list">
                                <button className="tabs__trigger tabs__trigger--active">Activo</button>
                                <button className="tabs__trigger">Inactivo</button>
                                <button className="tabs__trigger">Disabled</button>
                            </div>
                        </div>
                    </div>

                    {/* Underline Variant */}
                    <div>
                        <h3 className={styles.subsectionTitle}>Underline (Premium)</h3>
                        <p className={styles.sectionDesc} style={{ margin: '0 0 1rem 0' }}>
                            Estilo financiero/limpio, usado en layouts principales y dashboards.
                            <br />
                            Agrega <code>variant="underline"</code> a <code>TabsList</code> y <code>TabsTrigger</code>.
                        </p>
                        <div className="tabs">
                            <div className="tabs__list tabs__list--underline">
                                <button className="tabs__trigger tabs__trigger--underline tabs__trigger--active">
                                    Engineering
                                </button>
                                <button className="tabs__trigger tabs__trigger--underline">
                                    Procurement
                                </button>
                                <button className="tabs__trigger tabs__trigger--underline">
                                    Settings
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Module Navigation Bar */}
                    <div style={{ marginTop: '3rem' }}>
                        <h3 className={styles.subsectionTitle}>Barra de Navegación de Módulo</h3>
                        <p className={styles.sectionDesc} style={{ margin: '0 0 1rem 0' }}>
                            "Navegación de Pestañas de Nivel Superior".
                            <br />
                            Es el menú principal dentro de los módulos de trabajo (Ingeniería, Abastecimiento).
                            <br />
                            Utiliza un contenedor oscuro con botones tipo "pill".
                        </p>

                        {/* Simulation Container */}
                        <div style={{ background: '#0f172a', padding: '2rem', borderRadius: '1rem', border: '1px solid #1e293b' }}>
                            <div className="engineering-tabs" style={{ marginTop: 0, marginBottom: 0 }}>
                                <button className="tab-button active">
                                    <Folder size={16} /> Catálogo
                                </button>
                                <button className="tab-button">
                                    <FileText size={16} /> Solicitudes
                                </button>
                                <button className="tab-button">
                                    <BarChart2 size={16} /> MTO
                                </button>
                                <button className="tab-button">
                                    <Package size={16} /> Tracking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Usage Guidelines */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Reglas de Uso</h2>

                <Card style={{ marginTop: '1.5rem' }}>
                    <CardHeader>
                        <CardTitle>🚫 Prohibido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: 1.8 }}>
                            <li>Usar colores hexadecimales directamente (ej. <code>#FFFFFF</code>)</li>
                            <li>Usar píxeles fijos para colores o espaciado en componentes</li>
                            <li>Usar <code>style=&#123;&#123;...&#125;&#125;</code> para propiedades visuales</li>
                            <li>Importar iconos directamente de lucide-react (usar mapeo <code>Icons</code>)</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card style={{ marginTop: '1rem' }}>
                    <CardHeader>
                        <CardTitle>✅ Requerido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: 1.8 }}>
                            <li>Usar variables CSS: <code>var(--color-primary)</code></li>
                            <li>Usar componentes UI en lugar de HTML crudo</li>
                            <li>Agregar nuevos componentes a esta Style Guide antes de usar en producción</li>
                            <li>Referenciar clases del design system (<code>.glass-panel</code>, <code>.text-gradient</code>)</li>
                        </ul>
                    </CardContent>
                </Card>
            </section>
            {/* Focus Mode (Modals) Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Focus Mode (Modals)</h2>
                <p className={styles.sectionDesc}>
                    Para acciones críticas que requieren total atención del usuario (pagos, confirmaciones destructivas, formularios complejos).
                </p>

                <div
                    className="modal-overlay"
                    style={{ position: 'relative', height: '300px', borderRadius: '1rem', zIndex: 1 }}
                >
                    <div className="modal-content" style={{ animation: 'none', maxWidth: '350px' }}>
                        <div className="modal-title">Acción Crítica</div>
                        <p className="modal-text">
                            El fondo oscurecido (<code>bg-black/85</code>) y el desenfoque (<code>blur-sm</code>) eliminan distracciones externas.
                        </p>
                        <div className="modal-actions">
                            <Button variant="default" className="full-width">Confirmar Acción</Button>
                            <Button variant="secondary" className="full-width">Cancelar</Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

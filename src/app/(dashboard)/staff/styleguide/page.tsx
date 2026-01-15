import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ColorSwatch } from './ColorSwatch'
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

            {/* Buttons Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Botones</h2>
                <p className={styles.sectionDesc}>
                    6 variantes × 4 tamaños = 24 combinaciones
                </p>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Default Variant</h3>
                    <div className={styles.buttonRow}>
                        <Button variant="default" size="sm">Small</Button>
                        <Button variant="default" size="default">Default</Button>
                        <Button variant="default" size="lg">Large</Button>
                        <Button variant="default" size="icon">🔍</Button>
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Destructive Variant</h3>
                    <div className={styles.buttonRow}>
                        <Button variant="destructive" size="sm">Small</Button>
                        <Button variant="destructive" size="default">Default</Button>
                        <Button variant="destructive" size="lg">Large</Button>
                        <Button variant="destructive" size="icon">🗑️</Button>
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Outline Variant</h3>
                    <div className={styles.buttonRow}>
                        <Button variant="outline" size="sm">Small</Button>
                        <Button variant="outline" size="default">Default</Button>
                        <Button variant="outline" size="lg">Large</Button>
                        <Button variant="outline" size="icon">📝</Button>
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Secondary Variant</h3>
                    <div className={styles.buttonRow}>
                        <Button variant="secondary" size="sm">Small</Button>
                        <Button variant="secondary" size="default">Default</Button>
                        <Button variant="secondary" size="lg">Large</Button>
                        <Button variant="secondary" size="icon">⚙️</Button>
                    </div>
                </div>

                <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>Ghost Variant</h3>
                    <div className={styles.buttonRow}>
                        <Button variant="ghost" size="sm">Small</Button>
                        <Button variant="ghost" size="default">Default</Button>
                        <Button variant="ghost" size="lg">Large</Button>
                        <Button variant="ghost" size="icon">👁️</Button>
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
        </div>
    )
}

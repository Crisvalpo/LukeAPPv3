'use client'

import React from 'react'
import {
    Folder, FileText, BarChart2, Package, Lock, Search, Trash2, Settings, Eye,
    Plus, Edit, Save, Download, Upload, Filter,
    ChevronRight, ChevronLeft, ChevronDown, Menu, X, ArrowLeft,
    Check, AlertCircle, AlertTriangle, Info, Clock, Mail,
    User, Box, Layers, Play, Pause, MoreVertical, Building2, FolderKanban
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function StyleGuidePage() {
    return (
        <div className="space-y-12 animate-fade-in text-text-main pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <header className="py-12 text-center space-y-4">
                <Heading level={1} className="tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-400 drop-shadow-sm">Laboratorio de Estilos</span>
                </Heading>
                <Text size="lg" className="text-text-muted max-w-2xl mx-auto font-medium">
                    Sistema de Diseño LukeAPP v4 - Documentación viva de componentes y tokens de diseño.
                </Text>
            </header>

            {/* Core Design Tokens */}
            <section className="bg-bg-surface-1/50 border border-glass-border rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Layers size={120} />
                </div>

                <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                        <Heading level={2} className="text-2xl font-bold text-white">Tokens de Diseño (Tailwind v4)</Heading>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Colors */}
                        <div className="bg-bg-app border border-glass-border p-5 rounded-2xl space-y-4">
                            <h3 className="text-xs font-bold text-brand-primary uppercase tracking-widest">Colores Base</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-brand-primary border border-white/10" />
                                    <span className="text-xs font-mono text-text-muted">brand-primary</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-bg-app border border-white/10" />
                                    <span className="text-xs font-mono text-text-muted">bg-app</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-bg-surface-1 border border-white/10" />
                                    <span className="text-xs font-mono text-text-muted">bg-surface-1</span>
                                </div>
                            </div>
                        </div>

                        {/* Typography */}
                        <div className="bg-bg-app border border-glass-border p-5 rounded-2xl space-y-4">
                            <h3 className="text-xs font-bold text-brand-primary uppercase tracking-widest">Tipografía</h3>
                            <div className="space-y-1">
                                <div className="text-2xl font-bold truncate">Display Bold</div>
                                <div className="text-base font-medium text-text-main">Body Medium</div>
                                <div className="text-sm font-normal text-text-muted leading-relaxed">Long reading text for descriptions.</div>
                                <div className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">MONOSPACE SYSTEM</div>
                            </div>
                        </div>

                        {/* Glassmorphism */}
                        <div className="bg-bg-app border border-glass-border p-5 rounded-2xl space-y-4">
                            <h3 className="text-xs font-bold text-brand-primary uppercase tracking-widest">Glassmorphism</h3>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <span className="text-xs font-medium text-white/50">.glass-panel</span>
                            </div>
                            <div className="p-4 rounded-xl border border-brand-primary/20 bg-brand-primary/5">
                                <span className="text-xs font-medium text-brand-primary/50">Themed Glass</span>
                            </div>
                        </div>

                        {/* Effects */}
                        <div className="bg-bg-app border border-glass-border p-5 rounded-2xl space-y-4">
                            <h3 className="text-xs font-bold text-brand-primary uppercase tracking-widest">Efectos</h3>
                            <div className="h-10 w-full bg-brand-primary rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Glow active</span>
                            </div>
                            <div className="h-10 w-full bg-bg-surface-2 rounded-lg border border-white/5 hover:border-brand-primary/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-text-dim uppercase tracking-tighter underline decoration-brand-primary decoration-2">Hover lift</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Typography Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={2} className="text-2xl font-bold text-white">Componentes: Typography</Heading>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-bg-surface-1 border border-glass-border rounded-2xl p-6 space-y-6">
                        <div className="space-y-6 border-b border-glass-border pb-6">
                            <div className="space-y-1">
                                <Text size="xs" className="text-brand-primary font-bold uppercase tracking-widest mb-2 block">Heading Nivel 1 (Módulos)</Text>
                                <Heading level={1}>Título de Módulo</Heading>
                            </div>
                            <div className="space-y-1">
                                <Text size="xs" className="text-brand-primary font-bold uppercase tracking-widest mb-2 block">Heading Nivel 2 (Sección)</Text>
                                <Heading level={2}>Título de Sección</Heading>
                            </div>
                            <div className="space-y-1">
                                <Text size="xs" className="text-brand-primary font-bold uppercase tracking-widest mb-2 block">Heading Nivel 3 (Grupo)</Text>
                                <Heading level={3}>Título de Grupo</Heading>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Text size="lg">Text Large: Ideal para introducciones.</Text>
                            <Text size="base">Text Base: El estándar para la lectura principal.</Text>
                            <Text size="sm">Text Small: Perfecto para descripciones secundarias o auxiliares.</Text>
                            <Text size="xs">Text Extra Small: Usado en badges, etiquetas y metadatos.</Text>
                        </div>
                    </div>

                    <div className="bg-bg-surface-2 border border-glass-border rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-4 right-4 text-[10px] font-mono text-brand-primary opacity-50 px-2 py-1 bg-white/5 rounded">
                            Muestra de Uso
                        </div>
                        <div className="max-w-md space-y-4">
                            <Heading level={2} className="text-brand-primary">Título de Sección</Heading>
                            <Text className="text-text-muted leading-relaxed">
                                Este es un ejemplo de cómo se combinan los componentes de tipografía para crear una jerarquía clara.
                                <span className="text-white font-bold ml-1">Tailwind v4</span> permite un control total sobre estos elementos.
                            </Text>
                            <div className="flex gap-4 items-center">
                                <div className="text-[10px] font-mono uppercase tracking-widest text-text-dim bg-white/5 px-2 py-1 rounded">
                                    PROYECTO: HQ-001
                                </div>
                                <div className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                    EN CURSO
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interaction Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={2} className="text-2xl font-bold text-white">Componentes: Interacción</Heading>
                </div>

                <div className="bg-bg-surface-1 border border-glass-border rounded-3xl overflow-hidden shadow-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Buttons */}
                        <div className="p-8 border-r border-glass-border space-y-8">
                            <div>
                                <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-6">Variantes de Botón</h3>
                                <div className="flex flex-wrap gap-4">
                                    <Button variant="default">Primary Action</Button>
                                    <Button variant="secondary">Secondary</Button>
                                    <Button variant="outline">Outline View</Button>
                                    <Button variant="ghost">Ghost Icon</Button>
                                    <Button variant="destructive">Delete Item</Button>
                                    <Button variant="link">External Link</Button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-6">Tamaños y Estados</h3>
                                <div className="flex flex-wrap items-center gap-4">
                                    <Button size="sm" variant="secondary">Small</Button>
                                    <Button size="default">Default</Button>
                                    <Button size="lg" className="shadow-lg shadow-brand-primary/20">Premium Large</Button>
                                    <Button size="icon" variant="outline"><Settings size={18} /></Button>
                                    <Button disabled>Disabled State</Button>
                                </div>
                            </div>
                        </div>

                        {/* Inputs */}
                        <div className="p-8 bg-bg-surface-2/30 space-y-8">
                            <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-6">Campos de Entrada</h3>
                            <div className="space-y-6 max-w-md">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-brand-primary uppercase tracking-widest ml-1">Campo Estándar</label>
                                    <Input placeholder="Escribe algo aquí..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-brand-primary uppercase tracking-widest ml-1">Con Icono (Search)</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                                        <Input className="pl-10" placeholder="Buscar en registros..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-1">Estado: Error</label>
                                    <Input className="border-red-500/50 text-red-400 placeholder:text-red-400/30" defaultValue="Valor inválido" />
                                    <Text className="text-[10px] text-red-400 ml-1 font-medium">Este campo es obligatorio.</Text>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Layout Patterns */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={2} className="text-2xl font-bold text-white">Patrones de Layout</Heading>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Stat Card Pattern */}
                    <Card className="bg-bg-surface-1/40 hover:bg-bg-surface-1 border-glass-border transition-all duration-300 group hover:-translate-y-1">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
                                    <BarChart2 size={20} />
                                </div>
                                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-none">+12%</Badge>
                            </div>
                            <div>
                                <Text className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Total Proyectos</Text>
                                <Heading level={3} className="text-3xl font-bold text-white">124</Heading>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Access Pattern */}
                    <button className="flex flex-col items-start p-6 bg-bg-surface-1/40 hover:bg-bg-surface-1 border border-glass-border hover:border-brand-primary/50 rounded-2xl transition-all duration-300 text-left shadow-lg group">
                        <div className="flex justify-between w-full items-center mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-main group-hover:text-brand-primary transition-colors">
                                <Folder size={20} />
                            </div>
                            <ChevronRight size={18} className="text-text-dim group-hover:translate-x-1 transition-transform" />
                        </div>
                        <span className="font-bold text-text-main text-lg group-hover:text-brand-primary transition-colors">Ver Directorio</span>
                        <Text className="text-text-dim text-xs">Acceso rápido a archivos y planos.</Text>
                    </button>

                    {/* Context Highlight Pattern */}
                    <div className="flex items-center gap-4 p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl">
                        <div className="w-12 h-12 flex items-center justify-center bg-brand-primary rounded-xl text-white shadow-lg shadow-brand-primary/20 shrink-0">
                            <Building2 size={24} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] font-bold text-brand-primary uppercase tracking-tighter">Filtro Activo</div>
                            <div className="text-white font-bold text-lg truncate">Empresa Promet Chile</div>
                        </div>
                    </div>
                </div>

                {/* Navigation Patterns */}
                <div className="bg-bg-surface-1 border border-glass-border rounded-3xl p-8 space-y-8 mt-12 bg-gradient-to-br from-bg-surface-1 to-bg-app">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                        <Heading level={2} className="text-2xl font-bold text-white">Navegación Secundaria (Tailwind)</Heading>
                    </div>

                    <div className="max-w-4xl">
                        <Tabs defaultValue="tab1" className="w-full">
                            <TabsList variant="underline">
                                <TabsTrigger variant="underline" value="tab1">
                                    <FileText size={16} className="mr-2" />
                                    Resumen Ejecutivo
                                </TabsTrigger>
                                <TabsTrigger variant="underline" value="tab2">
                                    <FolderKanban size={16} className="mr-2" />
                                    Documentación Técnica
                                </TabsTrigger>
                                <TabsTrigger variant="underline" value="tab3">
                                    <Mail size={16} className="mr-2" />
                                    Notificaciones
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Text className="text-text-dim text-xs italic mt-2">
                            * Este estilo es el estándar para navegación dentro de módulos y visualización de sub-vistas.
                        </Text>
                    </div>
                </div>
            </section>

            {/* Focus & Modal Patterns */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={2} className="text-2xl font-bold text-white">Focus Mode & Modales</Heading>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Focus Mode Block */}
                    <div className="bg-bg-surface-1 border border-glass-border rounded-3xl p-8 space-y-6">
                        <div>
                            <Heading level={3} className="text-xl font-bold text-white mb-2">Focus Mode (Modals)</Heading>
                            <Text size="sm" className="text-text-dim">Para acciones críticas que requieren total atención del usuario (pagos, confirmaciones destructivas, formularios complejos).</Text>
                        </div>

                        <div className="relative h-64 w-full bg-black rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
                            {/* Simulated Backdrop Overlay */}
                            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-10" />

                            {/* Modal Content */}
                            <div className="relative z-20 w-full max-w-[320px] bg-bg-surface-1 border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                                <div className="text-center space-y-4">
                                    <Heading level={3} className="text-white text-lg">Acción Crítica</Heading>
                                    <Text size="xs" className="text-text-muted leading-relaxed">
                                        El fondo oscurecido (<code className="text-blue-400">bg-black/85</code>) y el desenfoque (<code className="text-blue-400">blur-sm</code>) eliminan distracciones externas.
                                    </Text>
                                    <div className="space-y-2 pt-2">
                                        <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 border-none shadow-lg shadow-blue-500/20">Confirmar Acción</Button>
                                        <Button variant="secondary" className="w-full">Cancelar</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal Header Variant */}
                    <div className="bg-bg-surface-1 border border-glass-border rounded-3xl p-8 space-y-6">
                        <div>
                            <Heading level={3} className="text-xl font-bold text-white mb-2">Variant: Modal Header</Heading>
                            <Text size="sm" className="text-text-dim">Ejemplo de integración en modal 3D con jerarquía visual clara.</Text>
                        </div>

                        <div className="bg-bg-app border border-white/5 rounded-2xl p-6 space-y-6 shadow-highlight">
                            <div className="flex items-center gap-4">
                                <div className="text-3xl">🔥</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Heading level={3} className="text-2xl font-bold text-white">W-102</Heading>
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/20 text-[9px] font-bold">PENDIENTE</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-mono text-text-dim">ISO-001</span>
                                        <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 text-[8px] h-4">BW</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-white/5 w-full" />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">SPOOL</label>
                                    <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-sm font-medium text-white">SP-01</div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">ESTADO</label>
                                    <select className="w-full p-3 bg-white/5 rounded-lg border border-white/5 text-sm font-medium text-white outline-none">
                                        <option>Pendiente</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module Navigation Pattern */}
                <div className="bg-bg-surface-1 border border-glass-border rounded-3xl p-8 space-y-6">
                    <div>
                        <Heading level={3} className="text-xl font-bold text-white mb-2">Barra de Navegación de Módulo</Heading>
                        <Text size="sm" className="text-text-dim">"Navegación de Pestañas de Nivel Superior". Es el menú principal dentro de los módulos de trabajo (Ingeniería, Abastecimiento). Utiliza un contenedor oscuro con botones tipo "pill".</Text>
                    </div>

                    <div className="bg-bg-app border border-white/5 rounded-2xl p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-sm shadow-lg shadow-blue-500/10">
                                <Folder size={16} />
                                Catálogo
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 font-bold text-sm transition-all">
                                <FileText size={16} />
                                Solicitudes
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 font-bold text-sm transition-all">
                                <BarChart2 size={16} />
                                MTO
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 font-bold text-sm transition-all">
                                <Box size={16} />
                                Tracking
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Reference */}
            <footer className="pt-20 border-t border-glass-border text-center pb-12">
                <Text size="sm" className="text-text-dim">
                    LukeAPP Design System • v4.0.0-beta • <code className="text-brand-primary px-2 bg-white/5 rounded">Tailwind Engine</code>
                </Text>
            </footer>
        </div>
    )
}

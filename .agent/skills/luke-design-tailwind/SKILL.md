---
name: luke-design-tailwind
description: Sistema de Diseño oficial de LukeAPP para Tailwind CSS.
---

# 🎨 LukeAPP Design System (Tailwind Edition)

Esta skill define el estándar visual para el desarrollo de interfaces en LukeAPP utilizando utilidades de Tailwind CSS. Basado en el `Styleguide` original de la plataforma.

## 🌈 Colores (Theme Config)

Utiliza estos colores para mantener la identidad premium oscura y el uso de glassmorphism.

| Categoría | Clase Tailwind | Valor HSL | Uso |
| :--- | :--- | :--- | :--- |
| **Fondo App** | `bg-bg-app` | `hsl(220, 20%, 10%)` | Fondo principal de la aplicación. |
| **Superficie 1** | `bg-bg-surface-1` | `hsl(220, 15%, 14%)` | Paneles y cards nivel 1. |
| **Superficie 2** | `bg-bg-surface-2` | `hsl(220, 15%, 18%)` | Inputs y cards nivel 2. |
| **Primario** | `text-brand-primary` / `bg-brand-primary` | `hsl(215, 90%, 55%)` | Color de marca (Azul). |
| **Éxito** | `text-brand-success` | `hsl(150, 70%, 45%)` | Estados positivos. |
| **Error** | `text-brand-error` | `hsl(0, 80%, 60%)` | Estados de error o destructivos. |

### Texto
- `text-luke-text-main`: Texto principal (casi blanco).
- `text-luke-text-muted`: Texto secundario (grisáceo).
- `text-luke-text-dim`: Texto de ayuda o deshabilitado.

## 📐 Tipografía

Clases personalizadas para asegurar consistencia con el diseño original:

- `text-luke-4xl` (3rem / 48px) - Títulos Hero
- `text-luke-3xl` (2rem / 32px) - Títulos de Sección
- `text-luke-2xl` (1.5rem / 24px) - Encabezados
- `text-luke-xl` (1.25rem / 20px) - Subtítulos
- `text-luke-base` (1rem / 16px) - Cuerpo de texto
- `text-luke-sm` (0.875rem / 14px) - Texto pequeño / UI
- `text-luke-xs` (0.75rem / 12px) - Metadatos

## 🧪 Glassmorphism

Para crear el efecto "Vidrio" característico de LukeAPP:

```html
<div class="bg-glass-surface backdrop-blur-md border border-glass-border shadow-lg rounded-luke-lg">
  <!-- Contenido -->
</div>
```

## 🔘 Bordes (Radius)

- `rounded-luke-sm`: 6px (Botones pequeños)
- `rounded-luke-md`: 10px (Inputs / Selects)
- `rounded-luke-lg`: 16px (Cards / Paneles)

## 🚀 Cómo usar en esta sesión

Al migrar una página:
1. Identifica el componente en `/staff/styleguide`.
2. Busca la clase equivalente en esta Skill.
3. Reemplaza las clases `.css` manuales por utilidades de Tailwind.
4. Si necesitas un gradiente de marca: `bg-gradient-to-br from-brand-primary to-indigo-300 bg-clip-text text-transparent`.

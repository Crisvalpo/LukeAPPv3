---
description: WORKSPACE RULES (LukeAPP)
---

# LukeAPP Workspace Rules & Context

These rules are authoritative for all AI-assisted development.

## 🎯 ARCHITECTURAL PILLARS (CRITICAL)

### 1. Multi-discipline AWP (Advanced Work Packaging)
- **Vision**: LukeAPP is a multi-discipline platform (CIV, MEC/PI, ELE, INST).
- **Core Units**: Organize work around **CWA (Areas)** and **IWP (Work Fronts)**.
- **Goal**: Holistic industrial construction management, moving beyond "Piping-only".

### 2. Dual-Layer Identity (New Standard)
- **Layer A: System Role (Security)**: `admin`, `supervisor`, `worker`. Fixed, controls RLS.
- **Layer B: Functional Role (UX)**: Customizable (e.g., "Expeditor", "Jefe OT"). Controls UI/Routing.
- **Constraint**: A user MUST have a System Role to exist in data; Functional Role is for experience.

### 3. Online Web Core vs Offline Field Satellites
- **Web Core (lukeapp.me)**: Online necessary. Management & Engineering. Next.js + Tailwind v4.
- **Field Satellites (field.lukeapp.me)**: Offline-first. Field execution. PWA + Tailwind.
- **Sync**: Execution happens in Satellites via **Events**. Web Core aggregates and reflects the status.

---

## 🎨 DESIGN SYSTEM & STYLING (Tailwind CSS v4)

### 1. Standard Choice
- **Definitive**: Tailwind CSS v4 is the standard for all layout and utilities.
- **Theme Tokens**: Authorities for colors, radii, and spacing are the CSS variables in `src/styles/design-system.css`.

### 2. UI Mapping (Icons & Typography)
- **Icons**: Use mapping in `src/components/ui/Icons.ts`. NEVER import from `lucide-react` directly.
- **Typography**: Use `<Heading>` and `<Text>` from `src/components/ui/Typography.tsx`.

---

## 💻 DEVELOPMENT HYGIENE

### 1. Language Standard (STRICT)
- **Backend/DB/Logic**: English.
- **UI/Labels/Messages**: Spanish.

### 2. Service Layer Isolation
- **Rule**: Components MUST NOT call Supabase direct. All logic in `src/services/`.

### 3. RLS & Security
- **Rule**: Never bypass RLS in the application code.
- **SQL**: Use `SECURITY DEFINER` functions to break recursion loops in `members` table policies.

---

## 📁 CORE DOCUMENTATION (Human-Readable)
- [**Project Vision**](../PROJECT_VISION.md): High-level mission and roadmap.
- [**Architecture**](../ARCHITECTURE.md): Deep dive into technical patterns.
- [**Development Standards**](../DEVELOPMENT_STANDARDS.md): Detailed coding and styling guide.
- [**Database Schema**](../DATABASE_SCHEMA.md): Complete data reference.

---
**Last Updated**: February 2026
**Context**: Multi-discipline AWP Transformation
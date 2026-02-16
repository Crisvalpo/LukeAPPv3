# Project Vision: LukeAPP v3

**Multi-discipline Industrial Construction Management Platform (AWP)**

LukeAPP is a high-performance, multi-tenant enterprise system designed for the integral management of large-scale industrial construction projects. While it originated with a focus on Piping, it has evolved into a comprehensive platform supporting all industrial disciplines through the principles of **Advanced Work Packaging (AWP)**.

---

## 🏗️ Core Philosophy

### 1. Multi-discipline & Integration
The system is designed to manage the complexity of industrial plants by integrating different disciplines into a single source of truth:
- **CIV**: Civil Works (Foundations, structures)
- **ARC**: Architecture (Buildings, finishing)
- **MEC / PI**: Mechanical & Piping (Equipment, pipe spools, welding)
- **ELE**: Electrical (Trays, cabling, termination)
- **INS / INST**: Instrumentation & Control

### 2. AWP (Advanced Work Packaging) Hierarchy
LukeAPP organizes project execution around geographical and functional units to reduce field silos:
- **CWA (Construction Work Area)**: Large geographical divisions of the project.
- **CWP (Construction Work Package)**: Discipline-specific packages within a CWA.
- **IWP (Installation Work Package)**: The smallest executable unit in the field (e.g., a specific set of spools or a foundation).

### 3. Context-First Identity
> **"A person is not a user until they act within a context."**

The platform enforces that every user action is tied to a specific **Tenant (Company)** and **Context (Project + Role)**. Access is granted exclusively via formal invitations, ensuring strict auditability and security.

---

## 🗺️ Roadmap & Target Phases

### ✅ PHASE 1: Foundation & Identity (Core)
- **Infrastructure**: Next.js 15+, Supabase (Postgres/Auth/RLS), Tailwind CSS v4.
- **Multi-tenant**: CRUD of Companies and Projects with data isolation.
- **Identity**: Dual-layer Role system (System vs Functional).
- **Lobby**: Mandatory project entry hall to confirm context and professional identity.

### ✅ PHASE 2: Engineering & Multi-discipline (AWP)
- **Project Structure**: Areas (CWA) and Work Fronts (IWP) management.
- **Specialty Catalog**: Support for multiple disciplines (CIV, PI, ELE, etc.).
- **Smart Revisions**: Event-based tracking of engineering changes.
- **Impact Analysis**: Automatic conflict detection across disciplines.

### 🔄 PHASE 3: Procurement & Materials (Current Focus)
- **Universal Material Catalog**: Handling technical specs across all disciplines.
- **Bulk Uploaders**: Validated high-performance data ingestion.
- **Inventory & Requests**: Field requisitions and stock movement tracking.

### 🔄 PHASE 4: Visualization & Modeling
- **3D Viewer Core**: Visual status coloring (Integrated BIM).
- **Mapping**: Linking database entities to 3D model elements.
- **Progress Visualization**: Visualizing IWP readiness and field completion.

### 🚧 PHASE 5: Field Execution (Offline-First Satellites)
- **Mobile Satellites**: Dedicated PWA apps for field workers.
- **Event-Sourced Updates**: Workers emit events (e.g., `SPOOL_WELDED`, `FOUNDATION_POURED`) instead of direct DB mutations.
- **Offline-First**: Continuous operation in zero-connectivity environments.

---

## 🧾 The "Golden Rules" of LukeAPP

1. **Scalability**: Every feature must work for 1 company or 100, for 1 project or 50.
2. **Online vs Offline**: Web Core is for management (Online); Field Satellites are for execution (Offline-first). Do not share execution logic between them.
3. **No Sync Assumptions**: The system must tolerate delayed synchronization from field events.
4. **Visibility is Earned**: No user sees data without a confirmed context (Project + Role).
5. **Derive, Don't Design**: UI views should be derived from the data domain and roles, maintaining a consistent, predictable UX.

---
**Confidential - All rights reserved © 2026**

# LukeAPP v3

**Multi-discipline Industrial Construction Management Platform (AWP)**

LukeAPP is a high-performance, multi-tenant enterprise system for managing large-scale industrial projects across all construction disciplines (Civil, Piping, Electrical, etc.) using **Advanced Work Packaging (AWP)** principles.

---

## 🚀 Quick Navigation

To maintain a clean and focused repository, core documentation has been consolidated in the [`.agent/`](.agent/) directory:

- [**Project Vision**](.agent/PROJECT_VISION.md): Mission, multi-discipline scope, and roadmap.
- [**Technical Architecture**](.agent/ARCHITECTURE.md): Identity layers, styling standards (Tailwind v4), and connectivity patterns.
- [**Database Schema**](.agent/DATABASE_SCHEMA.md): Comprehensive reference for tables and RLS security.
- [**Development Standards**](.agent/DEVELOPMENT_STANDARDS.md): Project organization, coding patterns, and security guidelines.

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- npm (or yarn)
- Access to a Supabase project

### Initial Setup
```bash
git clone https://github.com/Crisvalpo/LukeAPPv3.git
cd LukeAPPv3
npm install
cp env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

---

## Eye-Catching Stack
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS v4 + Design System Variable Tokens
- **BaaS**: Supabase (Postgres, RLS, Auth, Realtime, Edge Functions)
- **Hosting**: Self-hosted Ubuntu Server behind Cloudflare

---
**Confidential - All rights reserved © 2026**

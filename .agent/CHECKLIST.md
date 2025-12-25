# 📋 Development Checklist

This checklist ensures documentation stays up-to-date and code quality is maintained.

---

## ✅ **After Implementing a New Feature**

### **1. Code Quality**
- [ ] All variable/function names in **English**
- [ ] All UI text/labels in **Spanish**
- [ ] Using centralized types from `src/types/index.ts`
- [ ] Using constants from `src/constants/index.ts`
- [ ] No Tailwind classes (100% Vanilla CSS)
- [ ] Service layer pattern followed (no DB queries in components)
- [ ] Error handling implemented
- [ ] Loading states implemented

### **2. Documentation Updates**

#### **Always Update:**
- [ ] **README.md** - Add feature to "Estado Actual" section
  - Mark feature as ✅ if completed
  - Mark as 🚧 if in progress

#### **Update if Applicable:**
- [ ] **DEVELOPMENT.md** - If you created a new pattern or convention
- [ ] **lukeapp.md** - If you added/changed architectural rules
- [ ] **src/types/index.ts** - If you added new database entities
- [ ] **src/constants/index.ts** - If you added routes, labels, or enums

### **3. Database Changes**
- [ ] Created migration file in `supabase/migrations/`
- [ ] Applied migration (manually or via script)
- [ ] RLS policies added/updated
- [ ] Types updated in `src/types/index.ts`

---

## 🎯 **Before Starting a New Session**

### **For the AI:**
- [ ] Read `.agent/workflows/lukeapp.md` - Understand workspace rules
- [ ] Read `README.md` - Check current project status
- [ ] Review last 3-5 commits - Understand recent changes
- [ ] Check `src/types/` and `src/constants/` - Know available resources

### **For Developers:**
- [ ] Pull latest changes: `git pull origin main`
- [ ] Check `README.md` for current status
- [ ] Review `DEVELOPMENT.md` for coding standards
- [ ] Ensure dev server is running: `npm run dev`

---

## 🚀 **Before Committing Code**

### **Pre-commit Checklist:**
- [ ] Code builds without errors: `npm run build`
- [ ] No TypeScript errors
- [ ] No console.log() statements (unless intentional)
- [ ] All imports use `@/` alias (not relative paths)
- [ ] Commit message follows convention:
  ```
  feat: Brief description
  fix: Brief description
  docs: Brief description
  refactor: Brief description
  ```
- [ ] Multi-line commit body if complex change

---

## 📦 **When Adding a New Page/Route**

- [ ] Page component created in `src/app/...`
- [ ] Route constant added to `src/constants/index.ts`
- [ ] Using `ROUTES.ROUTE_NAME` instead of hardcoded strings
- [ ] Dashboard CSS imported: `@/styles/dashboard.css`
- [ ] Feature-specific CSS created if needed
- [ ] Auth check implemented (redirect if not authenticated)
- [ ] Context check (company/project/role) if needed
- [ ] Loading state implemented
- [ ] Empty state designed (if list/collection view)

---

## 🗄️ **When Adding a New Database Table**

- [ ] Migration created: `supabase/migrations/XXXX_table_name.sql`
- [ ] RLS policies defined (at minimum: super_admin access)
- [ ] Types added to `src/types/index.ts`:
  ```typescript
  export interface NewEntity {
      id: string
      // ... fields
  }
  ```
- [ ] Service created: `src/services/new-entity.ts`
- [ ] CRUD functions implemented:
  - `getAll()` or `getByX()`
  - `getById()`
  - `create()`
  - `update()`
  - `delete()`

---

## 🎨 **When Adding New Styles**

- [ ] Created in appropriate CSS file:
  - `dashboard.css` - Common dashboard styles
  - `feature.css` - Feature-specific styles
- [ ] Using CSS variables from `globals.css`
- [ ] No inline styles (unless dynamic)
- [ ] No Tailwind classes
- [ ] Responsive design considered
- [ ] Dark mode compatible (if applicable)

---

## 🔐 **Security Checklist**

- [ ] RLS policies tested for:
  - Super Admin (full access)
  - Founder (company-scoped access)
  - Admin (project-scoped access)
  - Regular users (restricted access)
- [ ] No sensitive data exposed in client
- [ ] API routes validate user permissions
- [ ] Supabase anon key used (not service key)

---

## 📊 **Phase Completion Checklist**

When completing a major phase:

- [ ] All features working as expected
- [ ] All RLS policies applied
- [ ] README.md updated with completed features
- [ ] DEVELOPMENT.md updated with new patterns
- [ ] Screenshots/demos created (if applicable)
- [ ] Git tag created: `git tag -a v1.0.0 -m "Phase 1 Complete"`
- [ ] Git tag pushed: `git push origin v1.0.0`

---

## 🐛 **Bug Fix Checklist**

- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Related code reviewed for similar issues
- [ ] Commit message explains the bug and fix
- [ ] Consider adding validation to prevent recurrence

---

## ♻️ **Refactoring Checklist**

- [ ] All tests still pass (when implemented)
- [ ] No breaking changes to API
- [ ] Types updated if data structure changed
- [ ] Documentation updated if patterns changed
- [ ] Commit message explains what and why

---

## 📝 **Notes**

### **Critical Files to Keep Updated:**
1. `.agent/workflows/lukeapp.md` - **Architectural rules** (update when rules change)
2. `README.md` - **Project status** (update after each feature)
3. `DEVELOPMENT.md` - **Coding standards** (update when adding patterns)
4. `src/types/index.ts` - **Type definitions** (update when schema changes)
5. `src/constants/index.ts` - **Constants** (update when adding routes/enums)

### **Quick Reference:**
- **English:** Code, functions, variables, database
- **Spanish:** UI text, labels, user-facing content
- **CSS:** 100% Vanilla (no Tailwind)
- **Service Layer:** All DB queries in `src/services/`
- **Types:** Use centralized types from `src/types/`

---

**Last Updated:** December 2024

# 🧪 Phase 1 - Complete Test Flow

This document outlines the complete test flow for Phase 1, from clean database to fully operational system.

---

## 🎯 Test Objective

Validate the complete multi-tenant invitation flow:
```
Staff → Create Company → Invite Founder
  ↓
Founder → Accept → Create Project → Invite Admin
  ↓
Admin → Accept → Access Project Dashboard
```

---

## 📋 Prerequisites

1. Clean database (only 1 Staff user)
2. Dev server running: `npm run dev`
3. Staff user credentials ready

---

## 🚀 Test Steps

### **Step 1: Clean Database** (DONE)

Run the cleanup script:
```bash
node scripts/clean_database.js
```

Expected result:
- ✅ 0 companies
- ✅ 0 projects
- ✅ 1 member (Staff)
- ✅ 0 invitations
- ✅ 1 user (Staff)

---

### **Step 2: Login as Staff**

1. Go to `http://localhost:3000`
2. Click "Acceder"
3. Login with Staff credentials
4. Verify redirect to `/staff`
5. Verify sidebar shows "⚡ Super Admin"

**Expected:**
- ✅ Empty dashboard (0 companies)
- ✅ "Crear Nueva Empresa" button visible

---

### **Step 3: Create Company**

1. Click "Crear Nueva Empresa"
2. Fill form:
   - Name: **"Acme Corporation"**
   - Slug: **"acme"** (auto-generated)
3. Click "🚀 Crear Empresa"

**Expected:**
- ✅ Success message
- ✅ Redirect to `/staff/companies`
- ✅ Company appears in list
- ✅ Stats: 0 projects, 0 members

---

### **Step 4: Invite Founder**

1. Click `/staff/invitations` in sidebar
2. Select company: "Acme Corporation"
3. Email: `founder@acme.com`
4. Role: Founder (auto-selected)
5. Click "📧 Generar Link de Invitación"

**Expected:**
- ✅ Success message
- ✅ Invitation link appears
- ✅ WhatsApp/Email share buttons
- ✅ Pending invitation in list

---

### **Step 5: Accept Founder Invitation**

1. Copy invitation link
2. Open in **incognito/private window**
3. See invitation page with:
   - Company: "Acme Corporation"
   - Role: "Founder"
4. Fill form:
   - Email: `founder@acme.com` (pre-filled)
   - Password: `Test1234!`
   - Confirm password: `Test1234!`
5. Click "Aceptar Invitación"

**Expected:**
- ✅ Account created
- ✅ Member record created
- ✅ Invitation status → accepted
- ✅ Redirect to `/founder`
- ✅ Sidebar shows "🏢 Founder"
- ✅ Empty state: "¡Bienvenido!"
- ✅ Button: "🚀 Crear Mi Primer Proyecto"

---

### **Step 6: Create Project as Founder**

1. Click "🚀 Crear Mi Primer Proyecto"
2. Fill form:
   - Name: **"Construction Phase 1"**
   - Code: **"CONSTRUCTION-PHASE-1"** (auto-generated)
   - Description: "Initial construction phase"
3. Click "🚀 Crear Proyecto"

**Expected:**
- ✅ Project created
- ✅ Redirect to `/founder/projects`
- ✅ Project in list with stats
- ✅ Status badge: "Planificación"

---

### **Step 7: Invite Admin to Project**

1. Click `/founder/invitations` in sidebar
2. Select project: "Construction Phase 1"
3. Email: `admin@acme.com`
4. Role: Admin (fixed)
5. Click "📧 Generar Link de Invitación"

**Expected:**
- ✅ Success message
- ✅ Invitation link
- ✅ Pending invitation in list

---

### **Step 8: Accept Admin Invitation**

1. Copy invitation link
2. Open in **new incognito window**
3. See invitation page with:
   - Company: "Acme Corporation"
   - Project: "Construction Phase 1"
   - Role: "Admin"
4. Fill form:
   - Email: `admin@acme.com`
   - Password: `Test1234!`
5. Click "Aceptar Invitación"

**Expected:**
- ✅ Account created
- ✅ Member record with project_id
- ✅ Redirect to `/admin`
- ✅ Sidebar shows "👤 Admin"
- ✅ Project info displayed
- ✅ Stats: 1 member
- ✅ Quick actions visible

---

## ✅ Success Criteria

### **Staff Dashboard:**
- Can create companies ✅
- Can invite founders ✅
- Can see stats ✅

### **Founder Dashboard:**
- Can create projects ✅
- Can invite admins to projects ✅
- Can view/edit company ✅

### **Admin Dashboard:**
- Auto-detects project ✅
- Shows project info ✅
- Has quick actions ready ✅

### **Security:**
- No unauthorized access ✅
- Member validation works ✅
- No duplicate invitations ✅
- No inviting existing members ✅

---

## 🐛 Common Issues

### Issue: "No pudimos cargar tu perfil"
**Solution:** RLS policies issue - check database

### Issue: Redirect to `/unauthorized`
**Solution:** User has no member record - check invitations table

### Issue: "Ya existe una invitación pendiente"
**Solution:** Working as intended - use different email or revoke existing

---

## 📊 Database State After Test

```
companies:     1  (Acme Corporation)
projects:      1  (Construction Phase 1)
users:         3  (Staff, Founder, Admin)
members:       3  (1 super_admin, 1 founder, 1 admin)
invitations:   2  (both accepted)
```

---

**Test Date:** December 2024
**Phase:** 1 (Foundation)
**Status:** Ready for execution

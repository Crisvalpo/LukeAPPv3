-- Diagnóstico: Verificar por qué RLS está bloqueando acceso
-- Ejecutar en SQL Editor de Supabase

-- 1. Ver tu user_id actual
SELECT 
  'Tu user_id' as info,
  auth.uid() as user_id;

-- 2. Verificar si tienes membresía
SELECT 
  'Tus membresías' as info,
  m.id,
  m.user_id,
  m.company_id,
  m.role_id,
  c.name as company_name
FROM members m
LEFT JOIN companies c ON c.id = m.company_id
WHERE m.user_id = auth.uid();

-- 3. Verificar todas las companies que existen
SELECT 
  'Companies existentes' as info,
  id,
  name,
  created_at
FROM companies
ORDER BY created_at DESC;

-- 4. Verificar todos los members
SELECT 
  'Todos los members' as info,
  m.id,
  m.user_id,
  m.company_id,
  m.role_id,
  u.email
FROM members m
LEFT JOIN users u ON u.id = m.user_id
ORDER BY m.created_at DESC;

-- 5. Probar acceso a engineering_revisions
SELECT 
  'Test: Puedes ver engineering_revisions?' as info,
  COUNT(*) as count
FROM engineering_revisions;

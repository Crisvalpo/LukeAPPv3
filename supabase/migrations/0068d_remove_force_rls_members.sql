-- Migration 0068d: Remove FORCE RLS from Members (Service Role Fix)
-- Purpose: FORCE RLS prevents service role from bypassing RLS
-- Date: 2026-01-21

-- Remove FORCE (keep RLS enabled but allow service role to bypass)
ALTER TABLE public.members NO FORCE ROW LEVEL SECURITY;

-- RLS remains ENABLED, but service role can now bypass it
-- Regular users still subject to RLS policies

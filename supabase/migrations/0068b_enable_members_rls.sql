-- Migration 0068b: ENABLE RLS on Members Table (CRITICAL HOTFIX)
-- Purpose: RLS was disabled on members table, preventing all policies from working
-- Date: 2026-01-21

-- Enable RLS on members table
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner (optional but recommended)
ALTER TABLE public.members FORCE ROW LEVEL SECURITY;

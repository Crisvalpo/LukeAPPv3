-- Add logo_url column to companies table
-- Migration: 0101_add_logo_url_to_companies.sql
-- Date: 2026-01-15

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS logo_url text;

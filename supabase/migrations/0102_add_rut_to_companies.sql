-- Add rut column to companies table
-- Migration: 0102_add_rut_to_companies.sql
-- Date: 2026-01-16

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS rut text;

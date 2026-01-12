-- Add pdf_url column to engineering_revisions table
ALTER TABLE public.engineering_revisions
ADD COLUMN IF NOT EXISTS pdf_url text;

COMMENT ON COLUMN public.engineering_revisions.pdf_url IS 'URL to the PDF file of the isometric revision';

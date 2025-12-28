-- Check what was saved
SELECT 
    'Isometrics' as table_name,
    COUNT(*) as total_count,
    COUNT(DISTINCT company_id) as distinct_companies
FROM public.isometrics
UNION ALL
SELECT 
    'Engineering_Revisions' as table_name,
    COUNT(*) as total_count,
    COUNT(DISTINCT company_id) as distinct_companies
FROM public.engineering_revisions;

-- Detailed check
SELECT 
    i.iso_number,
    i.revision as iso_rev,
    i.status,
    er.rev_code as rev_table_code,
    er.revision_status,
    er.company_id IS NOT NULL as has_company_id,
    er.announcement_date
FROM public.isometrics i
LEFT JOIN public.engineering_revisions er ON er.isometric_id = i.id
ORDER BY i.iso_number;

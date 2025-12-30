-- Check what revisions already exist and fix the data
SELECT 
  er.id,
  er.isometric_id,
  i.iso_number,
  er.rev_code,
  er.revision_status
FROM engineering_revisions er
JOIN isometrics i ON i.id = er.isometric_id
WHERE i.iso_number IN ('3800AE-BBD-380-0403-1', '3800PR-SW-380-5260-1')
ORDER BY i.iso_number, er.rev_code;

-- Check if the problematic revision already exists
SELECT * FROM engineering_revisions 
WHERE isometric_id = 'bb1af79f-937f-41ff-a991-6eb5c3036886' 
  AND rev_code = '2';

-- Also check ALL revisions for this isometric
SELECT * FROM engineering_revisions 
WHERE isometric_id = 'bb1af79f-937f-41ff-a991-6eb5c3036886'
ORDER BY rev_code;

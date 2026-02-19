-- Clean up residual Auth Users
-- Retains ONLY the Genesis User: luke@lukeapp.com
-- Returns the deleted emails for verification.

DELETE FROM auth.users
WHERE email NOT IN ('luke@lukeapp.com')
RETURNING id, email, created_at;

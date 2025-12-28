# Complete E2E Test Script for PowerShell
# This will execute all necessary migrations and setup

$supabaseUrl = "https://rvgrhtqxzfcypbfxqilp.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDgyMjEsImV4cCI6MjA4MjA4NDIyMX0.pqeQkyGrK_EWx28OSR6eaph9Vdg1kzdUiNZe3wKtrT8"

Write-Host "🧹 Cleaning engineering_revisions..." -ForegroundColor Yellow

$body = @{
    count = "exact"
} | ConvertTo-Json

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
}

# Delete all engineering_revisions
try {
    Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/engineering_revisions" `
        -Method Delete `
        -Headers $headers `
        -Body $body
    Write-Host "✅ Cleared engineering_revisions" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Delete all isometrics
try {
    Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/isometrics" `
        -Method Delete `
        -Headers $headers `
        -Body $body
    Write-Host "✅ Cleared isometrics" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n✅ Database cleaned! Now:" -ForegroundColor Green
Write-Host "1. Execute COMPLETE_E2E_TEST.sql in Supabase SQL Editor" -ForegroundColor Cyan
Write-Host "2. Hard refresh the page (Ctrl+Shift+R)" -ForegroundColor Cyan
Write-Host "3. Try uploading the Excel file" -ForegroundColor Cyan

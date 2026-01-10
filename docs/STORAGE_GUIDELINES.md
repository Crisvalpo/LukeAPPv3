# Storage Bucket Guidelines - LukeAPP

## ⚠️ IMPORTANT: New File Upload Structure

**All NEW file uploads MUST use the consolidated structure:**

```
Bucket: project-files
Path: {company_id}/{project_id}/{category}/{filename}
```

### Categories:
- `logos/` - Project logos (primary, secondary)
- `structure-models/` - 3D models of structures (.glb, .gltf)
- `isometric-models/` - 3D isometric models (.glb)
- `drawings/` - PDF drawings and documents
- `photos/` - Project photos and images

### Example Paths:
```
project-files/
  ├── 9b82248d-73b5-4fb8-86e2-b26252d1fb6b/  (Eimisa company_id)
      ├── a1b2c3d4-e5f6-7890-abcd-ef1234567890/  (Project WSA2)
          ├── logos/
          │   ├── primary.png
          │   ├── secondary.png
          ├── structure-models/
          │   ├── building-north.glb
          │   ├── building-south.glb
          ├── isometric-models/
          │   ├── iso-001-A.glb
          │   ├── iso-001-A.pdf
          │   ├── iso-002-B.glb
```

### 🚨 IMPORTANT: Automatic Folder Creation

**When creating a new project, you MUST create the base folder structure in Storage:**

```typescript
// Example: In src/services/projects.ts -> createProject()
async function ensureProjectStorageFolders(companyId: string, projectId: string) {
    const supabase = createClient()
    const basePath = `${companyId}/${projectId}`
    
    // Create placeholder files to establish folder structure
    const folders = ['logos', 'structure-models', 'isometric-models', 'drawings', 'photos']
    
    for (const folder of folders) {
        await supabase.storage
            .from('project-files')
            .upload(`${basePath}/${folder}/.keep`, new Blob(['']))
    }
}
```

**This ensures:**
- ✅ Folders exist before first upload
- ✅ RLS policies work correctly  
- ✅ File browsers show proper structure
- ✅ Cleanup logic has consistent paths


---

## 📁 Current Legacy Structure (DO NOT USE FOR NEW FILES)

### Current Buckets (deprecated, cleanup in progress):
1. **structure-models** - Pattern: `{projectId}-modelname.glb`
2. **isometric-models** - Pattern: `{projectId}-filename.glb`
3. **project-logos** - Pattern: `{projectId}/filename.png`

**These buckets are maintained for backward compatibility with existing files only.**

---

## ✅ Implementation Checklist for New Uploads

When implementing a new file upload feature:

- [ ] Use bucket: `project-files`
- [ ] Use path: `{company_id}/{project_id}/{category}/{filename}`
- [ ] Set appropriate MIME type restrictions
- [ ] Implement RLS policies for `company_id` folder access
- [ ] Add file size limits in RLS or application layer
- [ ] Update cleanup logic in `deleteProjectComplete` if needed

---

## 🔐 RLS Policy Template

```sql
-- Allow authenticated users to upload to their company's projects
CREATE POLICY "Users can upload to own company projects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM public.members 
        WHERE user_id = auth.uid()
    )
);

-- Allow authenticated users to read from their company's projects  
CREATE POLICY "Users can read from own company projects"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM public.members 
        WHERE user_id = auth.uid()
    )
);
```

---

## 🔄 Migration Plan (Future)

When ready to migrate existing files:
1. Create migration script to copy files from legacy buckets
2. Update all database references (URLs) to new paths
3. Verify UI displays files correctly from new paths
4. Delete files from legacy buckets
5. Remove legacy buckets

**Estimated effort:** 4-6 hours
**Priority:** Medium (technical debt, not blocking)

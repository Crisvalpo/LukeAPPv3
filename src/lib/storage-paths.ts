/**
 * Storage Path Utilities
 * 
 * Generates human-readable storage paths for Supabase Storage.
 * Format: {slug}-{id-prefix}/{subfolder}/{filename}
 * 
 * Example: acme-construction-fd48f0e5/proyecto-norte-8af4928e/models/file.glb
 */

/**
 * Sanitize text for use in storage paths
 * Converts to lowercase, replaces spaces and special chars with hyphens
 */
function sanitizeForPath(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD') // Normalize accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get short ID prefix (first 8 characters of UUID)
 */
function getShortId(uuid: string): string {
    return uuid.split('-')[0];
}

/**
 * Generate company storage folder name
 * Format: {company-slug}-{id-prefix}
 * Example: acme-construction-fd48f0e5
 */
export function getCompanyStoragePath(company: {
    id: string;
    slug: string;
}): string {
    const shortId = getShortId(company.id);
    return `${company.slug}-${shortId}`;
}

/**
 * Generate project storage folder name
 * Format: {project-code}-{id-prefix} or {project-name}-{id-prefix}
 * Example: proyecto-norte-8af4928e
 */
export function getProjectStorageName(project: {
    id: string;
    code?: string | null;
    name: string;
}): string {
    const shortId = getShortId(project.id);
    const identifier = project.code || sanitizeForPath(project.name);
    return `${identifier}-${shortId}`;
}

/**
 * Generate full project storage path
 * Format: {company-slug}-{company-id}/{project-identifier}-{project-id}
 * Example: acme-construction-fd48f0e5/proyecto-norte-8af4928e
 */
export function getProjectStoragePath(
    company: { id: string; slug: string },
    project: { id: string; code?: string | null; name: string }
): string {
    const companyPath = getCompanyStoragePath(company);
    const projectName = getProjectStorageName(project);
    return `${companyPath}/${projectName}`;
}

/**
 * Generate complete file path for project files
 * Format: {company}/{project}/{subfolder}/{filename}
 * Example: acme-construction-fd48f0e5/proyecto-norte-8af4928e/isometric-models/model.glb
 */
export function getProjectFilePath(
    company: { id: string; slug: string },
    project: { id: string; code?: string | null; name: string },
    subfolder: string,
    filename: string
): string {
    // Force subfolder to be relative, remove leading slashes
    const cleanSubfolder = subfolder.replace(/^\/+/g, '');
    const projectPath = getProjectStoragePath(company, project);
    return `${projectPath}/${cleanSubfolder}/${filename}`;
}

/**
 * Generate company-level file path (e.g., for company logo)
 * Format: {company-slug}-{company-id}/company/{subfolder}/{filename}
 * Example: acme-construction-fd48f0e5/company/logo/logo.png
 */
export function getCompanyFilePath(
    company: { id: string; slug: string },
    subfolder: string,
    filename: string
): string {
    const companyPath = getCompanyStoragePath(company);
    return `${companyPath}/company/${subfolder}/${filename}`;
}

/**
 * Build the full storage path for a document revision file.
 * Format: {company-slug}-{id}/{project-code}-{id}/documents/revisions/{document_code}/{rev_code}_{filename}
 */
export function getDocumentRevisionStoragePath(
    company: { id: string; slug: string },
    project: { id: string; code?: string | null; name: string },
    documentCode: string,
    revCode: string,
    filename: string
): string {
    const DOC_REVISIONS_FOLDER = 'documents/revisions'
    const basePath = getProjectStoragePath(company, project)
    const safeDocCode = documentCode.replace(/[^a-zA-Z0-9_-]/g, '_')
    return `${basePath}/${DOC_REVISIONS_FOLDER}/${safeDocCode}/${revCode}_${filename}`
}

/**
 * Extract company and project IDs from storage path
 * Useful for reverse lookup and cleanup operations
 */
export function parseStoragePath(path: string): {
    companyId?: string;
    projectId?: string;
} | null {
    const parts = path.split('/');

    if (parts.length < 1) return null;

    // Extract company ID from first segment (format: slug-id)
    const companySegment = parts[0];
    const companyId = companySegment.split('-').pop();

    // Extract project ID from second segment if exists
    let projectId: string | undefined;
    if (parts.length >= 2 && parts[1] !== 'company') {
        const projectSegment = parts[1];
        projectId = projectSegment.split('-').pop();
    }

    return {
        companyId,
        projectId
    };
}

'use client';

import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ImageEditor, { type CropSettings } from '../common/ImageEditor';
import { getCompanyFilePath } from '@/lib/storage-paths';

interface CompanyLogoUploadProps {
    companyId: string;
    companyName: string;
    currentLogoUrl?: string | null;
    onUpdate: (logoUrl: string) => void;
    showMissingBadge?: boolean;
}

export default function CompanyLogoUpload({
    companyId,
    companyName,
    currentLogoUrl,
    onUpdate,
    showMissingBadge
}: CompanyLogoUploadProps) {
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    async function handleFileSelect(file: File) {
        // Validate file
        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            alert('Solo se permiten archivos PNG o JPG');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('El archivo no debe superar 5MB');
            return;
        }

        // Create temp URL for editor
        const tempUrl = URL.createObjectURL(file);
        setTempImageUrl(tempUrl);
        setIsEditing(true);
    }

    async function handleSaveCroppedImage(croppedBlob: Blob, cropSettings: CropSettings) {
        setIsUploading(true);
        try {
            // Fetch company slug for descriptive path
            const { data: companyData } = await supabase
                .from('companies')
                .select('id, slug')
                .eq('id', companyId)
                .single();

            if (!companyData) throw new Error('Company not found');

            // Generate filename
            const timestamp = Date.now();
            const fileName = `company_logo_${timestamp}.png`;

            // Path: {company-slug}-{id}/company/logo/{filename}
            const company = { id: companyData.id, slug: companyData.slug };
            const storagePath = getCompanyFilePath(company, 'logo', fileName);

            // Delete old logo if exists
            if (currentLogoUrl) {
                try {
                    if (currentLogoUrl.includes('/project-files/')) {
                        const pathParts = currentLogoUrl.split('/project-files/');
                        if (pathParts.length > 1) {
                            await supabase.storage
                                .from('project-files')
                                .remove([decodeURIComponent(pathParts[1])]);
                        }
                    }
                } catch (e) {
                    console.warn('Error deleting old logo', e);
                }
            }

            // Upload new cropped image
            const { error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(storagePath, croppedBlob, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('project-files')
                .getPublicUrl(storagePath);

            // Update company in database
            const { error: updateError } = await supabase
                .from('companies')
                .update({ logo_url: publicUrl })
                .eq('id', companyId);

            if (updateError) throw updateError;

            // Cleanup
            if (tempImageUrl) {
                URL.revokeObjectURL(tempImageUrl);
            }
            setTempImageUrl(null);
            setIsEditing(false);

            // Notify parent
            onUpdate(publicUrl);
        } catch (error: any) {
            console.error('Error saving logo:', error);
            alert('Error al guardar el logo: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    }

    function handleCancelEdit() {
        if (tempImageUrl) {
            URL.revokeObjectURL(tempImageUrl);
        }
        setTempImageUrl(null);
        setIsEditing(false);
    }

    return (
        <>
            <div
                className="company-logo-container"
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                {currentLogoUrl ? (
                    <img
                        src={currentLogoUrl}
                        alt="Company Logo"
                        className="company-logo-image"
                    />
                ) : (
                    <div className="company-logo-initials">
                        {companyName.substring(0, 2).toUpperCase()}
                    </div>
                )}

                <div className="logo-upload-overlay">
                    <div className="logo-upload-text">
                        📸<br />Cambiar logo
                    </div>
                </div>
            </div>

            {showMissingBadge && (
                <div
                    className="missing-badge-overlay pulsate"
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    style={{
                        cursor: 'pointer',
                        marginTop: '0.5rem',
                        width: 'max-content'
                    }}
                    title="Haz clic para subir un logo"
                >
                    ⚠️ Falta Logo
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                }}
                style={{ display: 'none' }}
            />

            {/* Image Editor Modal */}
            {tempImageUrl && isEditing && (
                <ImageEditor
                    imageUrl={tempImageUrl}
                    title="Editar Logo de Empresa"
                    onSave={handleSaveCroppedImage}
                    onCancel={handleCancelEdit}
                    aspect={1}
                    cropShape="round"
                />
            )}
        </>
    );
}

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
            window.dispatchEvent(new Event('onboarding-updated'));
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
                className="relative w-48 h-48 rounded-full bg-white flex items-center justify-center overflow-hidden cursor-pointer group shadow-[0_0_40px_rgba(59,130,246,0.5)] border-4 border-white shrink-0"
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                {currentLogoUrl ? (
                    <img
                        src={currentLogoUrl}
                        alt="Company Logo"
                        className="w-full h-full object-contain p-4"
                    />
                ) : (
                    <div className="text-4xl font-bold text-slate-800">
                        {companyName.substring(0, 2).toUpperCase()}
                    </div>
                )}

                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-white text-center text-sm font-semibold">
                        <Upload className="mx-auto mb-1 h-5 w-5" />
                        Cambiar logo
                    </div>
                </div>
            </div>

            {showMissingBadge && (
                <div
                    className="mt-3 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-semibold animate-pulse cursor-pointer w-max"
                    onClick={() => !isUploading && fileInputRef.current?.click()}
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

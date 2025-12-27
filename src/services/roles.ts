// =====================================================
// Service: Company Roles Management
// Description: CRUD and business logic for company_roles table
// Author: LukeAPP Development Team
// Date: 2025-12-26
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type {
    CompanyRole,
    CompanyRoleWithStats,
    CreateCompanyRoleParams,
    UpdateCompanyRoleParams,
    ApiResponse
} from '@/types';

// ==========================================
// READ OPERATIONS
// ==========================================

/**
 * Get all roles for a specific company
 */
export async function getCompanyRoles(companyId: string): Promise<ApiResponse<CompanyRole[]>> {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('company_roles')
            .select('*')
            .eq('company_id', companyId)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching company roles:', error);
            return {
                success: false,
                message: 'Error al cargar los roles',
                data: []
            };
        }

        return {
            success: true,
            message: 'Roles cargados correctamente',
            data: data || []
        };
    } catch (error) {
        console.error('Unexpected error in getCompanyRoles:', error);
        return {
            success: false,
            message: 'Error inesperado al cargar roles',
            data: []
        };
    }
}

/**
 * Get roles with member count statistics
 */
export async function getCompanyRolesWithStats(
    companyId: string
): Promise<ApiResponse<CompanyRoleWithStats[]>> {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('company_roles')
            .select(`
        *,
        members:members(count)
      `)
            .eq('company_id', companyId)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching company roles with stats:', error);
            return {
                success: false,
                message: 'Error al cargar roles con estadísticas',
                data: []
            };
        }

        // Transform the data to include members_count
        const rolesWithStats: CompanyRoleWithStats[] = (data || []).map((role: any) => ({
            ...role,
            members_count: role.members?.[0]?.count || 0
        }));

        return {
            success: true,
            message: 'Roles con estadísticas cargados correctamente',
            data: rolesWithStats
        };
    } catch (error) {
        console.error('Unexpected error in getCompanyRolesWithStats:', error);
        return {
            success: false,
            message: 'Error inesperado al cargar roles',
            data: []
        };
    }
}

/**
 * Get a single role by ID
 */
export async function getRoleById(roleId: string): Promise<ApiResponse<CompanyRole>> {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('company_roles')
            .select('*')
            .eq('id', roleId)
            .single();

        if (error || !data) {
            return {
                success: false,
                message: 'Rol no encontrado'
            };
        }

        return {
            success: true,
            message: 'Rol encontrado',
            data
        };
    } catch (error) {
        console.error('Unexpected error in getRoleById:', error);
        return {
            success: false,
            message: 'Error al buscar el rol'
        };
    }
}

// ==========================================
// CREATE OPERATIONS
// ==========================================

/**
 * Create a new company role
 */
export async function createRole(params: CreateCompanyRoleParams): Promise<ApiResponse<CompanyRole>> {
    try {
        const supabase = createClient();

        // Check for duplicate name in company
        const { data: existing } = await supabase
            .from('company_roles')
            .select('id')
            .eq('company_id', params.company_id)
            .eq('name', params.name)
            .maybeSingle();

        if (existing) {
            return {
                success: false,
                message: `Ya existe un rol con el nombre "${params.name}" en esta empresa`
            };
        }

        // Create the role
        const { data, error } = await supabase
            .from('company_roles')
            .insert({
                company_id: params.company_id,
                name: params.name,
                description: params.description || null,
                color: params.color || '#64748b',
                base_role: params.base_role,
                permissions: params.permissions,
                is_template: false
            })
            .select()
            .single();

        if (error || !data) {
            console.error('Error creating role:', error);
            return {
                success: false,
                message: 'Error al crear el rol'
            };
        }

        return {
            success: true,
            message: `Rol "${params.name}" creado correctamente`,
            data
        };
    } catch (error) {
        console.error('Unexpected error in createRole:', error);
        return {
            success: false,
            message: 'Error inesperado al crear el rol'
        };
    }
}

/**
 * Clone standard piping roles to a company
 */
export async function cloneStandardRoles(companyId: string): Promise<ApiResponse<{ roles_created: number }>> {
    try {
        const supabase = createClient();

        // Call the database function
        const { data, error } = await supabase.rpc('clone_standard_piping_roles', {
            target_company_id: companyId
        });

        if (error) {
            console.error('Error cloning standard roles:', error);
            return {
                success: false,
                message: 'Error al clonar roles estándar',
                data: { roles_created: 0 }
            };
        }

        const result = data as { success: boolean; message: string; roles_created: number };

        if (!result.success) {
            return {
                success: false,
                message: result.message,
                data: { roles_created: 0 }
            };
        }

        return {
            success: true,
            message: `${result.roles_created} roles estándar clonados correctamente`,
            data: { roles_created: result.roles_created }
        };
    } catch (error) {
        console.error('Unexpected error in cloneStandardRoles:', error);
        return {
            success: false,
            message: 'Error inesperado al clonar roles',
            data: { roles_created: 0 }
        };
    }
}

// ==========================================
// UPDATE OPERATIONS
// ==========================================

/**
 * Update an existing role
 */
export async function updateRole(
    roleId: string,
    updates: UpdateCompanyRoleParams
): Promise<ApiResponse<CompanyRole>> {
    try {
        const supabase = createClient();

        // Get current role to check if it's a template
        const { data: currentRole } = await supabase
            .from('company_roles')
            .select('is_template, company_id, name')
            .eq('id', roleId)
            .single();

        if (!currentRole) {
            return {
                success: false,
                message: 'Rol no encontrado'
            };
        }

        if (currentRole.is_template) {
            return {
                success: false,
                message: 'No puedes modificar un rol del sistema'
            };
        }

        // Check for duplicate name if name is being updated
        if (updates.name && updates.name !== currentRole.name) {
            const { data: duplicate } = await supabase
                .from('company_roles')
                .select('id')
                .eq('company_id', currentRole.company_id)
                .eq('name', updates.name)
                .neq('id', roleId)
                .maybeSingle();

            if (duplicate) {
                return {
                    success: false,
                    message: `Ya existe un rol con el nombre "${updates.name}"`
                };
            }
        }

        // Update the role
        const { data, error } = await supabase
            .from('company_roles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', roleId)
            .select()
            .single();

        if (error || !data) {
            console.error('Error updating role:', error);
            return {
                success: false,
                message: 'Error al actualizar el rol'
            };
        }

        return {
            success: true,
            message: 'Rol actualizado correctamente',
            data
        };
    } catch (error) {
        console.error('Unexpected error in updateRole:', error);
        return {
            success: false,
            message: 'Error inesperado al actualizar el rol'
        };
    }
}

// ==========================================
// DELETE OPERATIONS
// ==========================================

/**
 * Delete a role (with protection)
 */
export async function deleteRole(roleId: string): Promise<ApiResponse<void>> {
    try {
        const supabase = createClient();

        // Get role info
        const { data: role } = await supabase
            .from('company_roles')
            .select('is_template, name')
            .eq('id', roleId)
            .single();

        if (!role) {
            return {
                success: false,
                message: 'Rol no encontrado'
            };
        }

        // Protection 1: Cannot delete system templates
        if (role.is_template) {
            return {
                success: false,
                message: 'No puedes eliminar un rol del sistema'
            };
        }

        // Protection 2: Cannot delete if users are assigned
        const { count } = await supabase
            .from('members')
            .select('id', { count: 'exact', head: true })
            .eq('functional_role_id', roleId);

        if (count && count > 0) {
            return {
                success: false,
                message: `No puedes eliminar este rol. ${count} usuario(s) lo están usando.`
            };
        }

        // Proceed with deletion
        const { error } = await supabase
            .from('company_roles')
            .delete()
            .eq('id', roleId);

        if (error) {
            console.error('Error deleting role:', error);
            return {
                success: false,
                message: 'Error al eliminar el rol'
            };
        }

        return {
            success: true,
            message: `Rol "${role.name}" eliminado correctamente`
        };
    } catch (error) {
        console.error('Unexpected error in deleteRole:', error);
        return {
            success: false,
            message: 'Error inesperado al eliminar el rol'
        };
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get count of members using a specific role
 */
export async function getMembersCountByRole(roleId: string): Promise<number> {
    try {
        const supabase = createClient();

        const { count } = await supabase
            .from('members')
            .select('id', { count: 'exact', head: true })
            .eq('functional_role_id', roleId);

        return count || 0;
    } catch (error) {
        console.error('Error getting members count:', error);
        return 0;
    }
}

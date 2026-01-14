'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignJointToSpoolAction(jointId: string, spoolId: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('spools_joints')
            .update({ spool_id: spoolId })
            .eq('id', jointId)

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error('Error assigning joint to spool:', error)
        return { success: false, message: error.message }
    }
}

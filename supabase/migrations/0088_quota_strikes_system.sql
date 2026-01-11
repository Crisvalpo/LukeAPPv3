-- Create table to track quota strikes (days with exceeded quota)
CREATE TABLE IF NOT EXISTS public.quota_strikes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    spool_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure only one strike per company per day
    UNIQUE(company_id, date)
);

-- Enable RLS
ALTER TABLE public.quota_strikes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "System can insert quota strikes" ON public.quota_strikes
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can view their own company strikes" ON public.quota_strikes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.members
            WHERE members.user_id = auth.uid()
            AND members.company_id = quota_strikes.company_id
        )
    );

-- Create table for system notifications (Email Queue)
CREATE TABLE IF NOT EXISTS public.system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('quota_warning', 'quota_blocked')),
    strike_count INTEGER NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "System can insert notifications" ON public.system_notifications
    FOR INSERT TO authenticated
    WITH CHECK (true);
    
CREATE POLICY "Admins can view notifications" ON public.system_notifications
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.members
            WHERE members.user_id = auth.uid()
            AND members.company_id = system_notifications.company_id
            AND members.role_id IN ('founder', 'super_admin', 'admin')
        )
    );

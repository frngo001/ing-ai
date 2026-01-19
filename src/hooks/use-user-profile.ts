import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type UserProfile = {
    id: string;
    name: string;
    avatarUrl: string;
    email?: string;
    planType?: 'free' | 'pro' | 'enterprise';
};

const profileCache: Record<string, UserProfile> = {};

export function useUserProfile(userId: string | undefined) {
    const [profile, setProfile] = useState<UserProfile | null>(
        userId ? profileCache[userId] || null : null
    );
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const fetchProfile = async (force = false) => {
        if (!userId) return;

        // Validation: Check if userId is a valid UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

        if (!isUUID) {
            return;
        }

        // Check cache
        if (!force && profileCache[userId]) {
            setProfile(profileCache[userId]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    full_name, 
                    avatar_url, 
                    email,
                    user_plans (
                        plan_type
                    )
                `)
                .eq('id', userId)
                .single();

            if (error) {
                if (error.code !== 'PGRST116') {
                    console.error('[useUserProfile] Error fetching profile:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                }
                return;
            }

            if (data) {
                const planData = (data as any).user_plans;
                const planType = (Array.isArray(planData) ? planData[0]?.plan_type : planData?.plan_type) || 'free';
                const newProfile: UserProfile = {
                    id: userId,
                    name: data.full_name || data.email?.split('@')[0] || 'Unknown',
                    avatarUrl: data.avatar_url || '',
                    email: data.email || '',
                    planType: planType,
                };
                profileCache[userId] = newProfile;
                setProfile(newProfile);
            }
        } catch (err) {
            console.error('[useUserProfile] Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [userId, supabase]);

    return {
        profile: profile || (userId ? profileCache[userId] : null),
        loading,
        refreshProfile: () => fetchProfile(true)
    };
}

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type UserProfile = {
    id: string;
    name: string;
    avatarUrl: string;
};

const profileCache: Record<string, UserProfile> = {};

export function useUserProfile(userId: string | undefined) {
    const [profile, setProfile] = useState<UserProfile | null>(
        userId ? profileCache[userId] || null : null
    );
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (!userId) return; // Only check for userId here, cache check moved inside fetchProfile

        const fetchProfile = async () => {
            // Validation: Check if userId is a valid UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

            if (!isUUID) {
                // Optionally set a mock profile if you still support legacy data, otherwise just return
                return;
            }

            // Check cache
            if (profileCache[userId]) {
                setProfile(profileCache[userId]);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url, email')
                    .eq('id', userId)
                    .single();

                if (error) {
                    // Ignore "invalid input syntax" or "not found" (code PGRST116 for single())
                    if (error.code !== 'PGRST116') {
                        console.error('[useUserProfile] Error fetching profile:', error);
                    }
                    return;
                }

                if (data) {
                    const newProfile = {
                        id: userId,
                        name: data.full_name || data.email?.split('@')[0] || 'Unknown',
                        avatarUrl: data.avatar_url,
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

        fetchProfile();
    }, [userId, supabase]);

    return { profile: profile || (userId ? profileCache[userId] : null), loading };
}

import { supabase } from './supabase/client';
import type { Profile } from './types/database';

class AuthState {
    user = $state<Profile | null>(null);
    permissions = $state<string[]>([]);
    loading = $state(true);

    async init() {
        try {
            this.loading = true;
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                const [profileRes, permRes] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
                    supabase.from('role_permissions').select('role, permission_slug')
                ]);

                if (profileRes.data) {
                    if (profileRes.data.deleted_at) {
                        await this.logout();
                        return;
                    }

                    this.user = profileRes.data;
                    // Filter permissions that belong to the user's role
                    this.permissions = permRes.data
                        ? permRes.data
                            .filter((p: any) => p.role === this.user?.role || this.user?.role === 'admin')
                            .map((p: any) => p.permission_slug)
                        : [];

                    // Note: If user is admin, they get all permissions usually, 
                    // but the filter above handles it or we can just fetch all if admin.
                    if (profileRes.data.role === 'admin') {
                        const { data: allPerms } = await supabase.from('permissions').select('slug');
                        if (allPerms) this.permissions = allPerms.map(p => p.slug);
                    }
                }
            }
        } catch (e) {
            console.error('Auth Init Error:', e);
        } finally {
            this.loading = false;
        }
    }

    has(permission: string) {
        if (this.user?.role === 'admin') return true;
        return this.permissions.includes(permission);
    }

    async refresh() {
        // Reload user profile and permissions
        await this.init();
    }

    async logout() {
        await supabase.auth.signOut();
        this.user = null;
        this.permissions = [];
    }
}

export const auth = new AuthState();

// Subscribe to profile changes to auto-refresh permissions
supabase
    .channel('profile-changes')
    .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${(await supabase.auth.getSession()).data.session?.user.id}`
    }, () => {
        auth.refresh();
    })
    .subscribe();


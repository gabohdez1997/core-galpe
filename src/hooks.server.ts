import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll: () => event.cookies.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value, options }) => {
                    event.cookies.set(name, value, { ...options, path: '/' });
                });
            },
        },
    });

    event.locals.getSession = async () => {
        const { data: { session } } = await event.locals.supabase.auth.getSession();
        return session;
    };

    return resolve(event, {
        filterSerializedResponseHeaders(name) {
            return name === 'content-range' || name === 'x-supabase-parse-le';
        },
    });
};

const authGuard: Handle = async ({ event, resolve }) => {
    const session = await event.locals.getSession();
    const isAuthPath = event.url.pathname.startsWith('/auth');
    const isDashboardPath = event.url.pathname.startsWith('/dashboard');

    if (!session && isDashboardPath) {
        throw redirect(303, '/auth/login');
    }

    if (session && isAuthPath) {
        throw redirect(303, '/dashboard');
    }

    return resolve(event);
};

export const handle = sequence(supabase, authGuard);

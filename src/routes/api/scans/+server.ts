import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
    const scannerKey = request.headers.get('X-Scanner-Key');

    // Basic shared-secret auth
    if (scannerKey !== env.PRIVATE_SCANNER_KEY) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();

        const { error } = await supabase
            .from('inventory_scans')
            .insert({
                hostname: data.hostname,
                serial_number: data.serial_number,
                cpu: data.cpu,
                ram_gb: parseInt(data.ram_gb) || 0,
                disks: data.disks,
                ip_address: data.ip_address,
                mac_address: data.mac_address,
                asset_tag: data.asset_tag,
                responsible_name: data.responsible_name,
                monitor_model: data.monitor_model,
                monitor_serial: data.monitor_serial,
                printer_info: data.printer_info,
                scanner_user_email: data.scanner_user_email,
                responsible_email: data.responsible_email,
                status: 'pending'
            });

        if (error) {
            console.error('Database error:', error);
            return json({ error: error.message }, { status: 500 });
        }

        return json({ success: true });
    } catch (err: any) {
        console.error('Request error:', err);
        return json({ error: 'Invalid request data' }, { status: 400 });
    }
}

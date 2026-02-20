export type UserRole = 'admin' | 'editor' | 'viewer';
export type EquipmentType = 'computer' | 'printer' | 'server' | 'router' | 'other';
export type EquipmentStatus = 'active' | 'maintenance' | 'retired' | 'in_stock';
export type MaintenanceType = 'preventative' | 'corrective';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TicketPriority = 'baja' | 'media' | 'alta' | 'critica';
export type TicketStatus = 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado';

export interface Location {
    id: string;
    name: string;
    created_at: string;
}

export interface Department {
    id: string;
    name: string;
    location_id: string;
    created_at: string;
    locations?: Location;
}

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
    department_id: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    departments?: Department;
}

export interface Personnel {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    department_id: string | null;
    created_at: string;
    updated_at: string;
    departments?: Department;
}

export interface Tool {
    id: string;
    name: string;
    description: string | null;
    serial_number: string | null;
    status: EquipmentStatus;
    department_id: string | null;
    responsible_id: string | null;
    created_at: string;
    updated_at: string;
    departments?: Department;
    personnel?: Personnel;
}

export interface DiskInfo {
    type: 'SSD' | 'HDD' | 'NVMe' | 'Other';
    capacity: string;
}

export interface EquipmentSpecifications {
    // Hardware
    cpu?: string;
    ram?: string;
    disks?: DiskInfo[];
    os?: string;
    antivirus?: string;

    // Network
    ip_address?: string;
    mac_address?: string;

    // Peripherals
    monitor_model?: string;
    monitor_serial?: string;
    monitor_size?: string;
    keyboard_brand?: string;
    mouse_brand?: string;
    connected_printers?: string;

    // UPS
    ups_brand?: string;
    ups_capacity?: string;
    ups_status?: string;

    // Lifecycle & Management
    vendor?: string;
    purchase_date?: string;
    warranty_expiry?: string;
    cost?: number;
    location_detail?: string;
    additional_notes?: string;
}

export interface Equipment {
    id: string;
    name: string;
    asset_tag: string | null;
    type: EquipmentType;
    serial_number: string | null;
    image_url: string | null;
    department_id: string | null;
    responsible_id: string | null;
    status: EquipmentStatus;
    specifications: EquipmentSpecifications;
    created_at: string;
    updated_at: string;
    departments?: Department;
    personnel?: Personnel;
}

export interface AuditLog {
    id: string;
    table_name: string;
    record_id: string;
    action: string;
    old_data: Record<string, any> | null;
    new_data: Record<string, any> | null;
    changed_by: string | null;
    created_at: string;
    profiles?: Profile;
}

export interface MaintenanceRecord {
    id: string;
    equipment_id: string;
    type: MaintenanceType;
    status: MaintenanceStatus;
    title: string;
    description: string | null;
    scheduled_date: string;
    performed_at: string | null;
    performed_by: string | null;
    cost: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    equipment?: Equipment;
    personnel?: Personnel;
}

export interface Consumable {
    id: string;
    name: string;
    category: string;
    unit: string;
    stock_quantity: number;
    min_stock: number;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface MaintenanceConsumable {
    id: string;
    maintenance_id: string;
    consumable_id: string;
    quantity_used: number;
    maintenance_records?: MaintenanceRecord;
    consumables?: Consumable;
}

export interface TicketCategory {
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string;
    created_at: string;
}

export interface Ticket {
    id: string;
    title: string;
    description: string | null;
    category_id: string | null;
    personnel_id: string | null;
    equipment_id: string | null;
    assigned_to: string | null;
    priority: TicketPriority;
    status: TicketStatus;
    created_at: string;
    updated_at: string;
    ticket_categories?: TicketCategory;
    personnel?: Personnel;
    equipment?: Equipment;
    profiles?: Profile;
}

export interface TicketHistory {
    id: string;
    ticket_id: string;
    user_id: string | null;
    comment: string | null;
    previous_status: string | null;
    new_status: string | null;
    created_at: string;
    profiles?: Profile;
}

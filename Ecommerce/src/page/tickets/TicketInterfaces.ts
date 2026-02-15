export interface UserBasic {
    id: number;
    nom: string;
    email: string;
    role: string;
}

export interface TicketType {
    id: number;
    name: string;
    description: string;
}

export interface TicketMessage {
    id: number;
    body: string;
    sender_id: number;
    sender: UserBasic; // Assumons que le backend inclut l'expéditeur
    tickets_id: number;
    created_at: string;
}

export interface Ticket {
    id: number;
    title: string;
    status: 'ouvert' | 'en_cours' | 'ferme';
    priority: 'faible' | 'normal' | 'urgent';
    created_at: string;
    updated_at: string;
    user_id: number;
    assigned_to: number | null;
    ticket_type_id: number;
    
    // Relations incluses par le backend
    user: UserBasic; 
    assignedSpecialist?: UserBasic | null;
    type: TicketType;
    messages?: TicketMessage[];
}
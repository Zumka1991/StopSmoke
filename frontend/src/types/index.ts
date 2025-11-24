export interface User {
    email: string;
    name: string;
    quitDate: string | null;
    cigarettesPerDay: number;
    pricePerPack: number;
    currency: string;
    isAdmin: boolean;
}

export interface Marathon {
    id: number;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    participantsCount: number;
    isJoined: boolean;
    userStatus?: 'Active' | 'Disqualified' | 'Completed';
}

export interface CreateMarathonDto {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
}

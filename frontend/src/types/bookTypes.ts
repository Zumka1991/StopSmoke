export interface Book {
    id: number;
    title: string;
    author: string;
    description: string;
    coverImageUrl?: string;
    fb2FragmentUrl?: string;
    externalUrl?: string;
    createdAt: string;
}

export interface CreateBookRequest {
    title: string;
    author: string;
    description: string;
    externalUrl?: string;
}

export interface UpdateBookRequest {
    title?: string;
    author?: string;
    description?: string;
    externalUrl?: string;
}

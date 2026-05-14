export interface Video {
    id: number;
    title: string;
    description: string;
    videoUrl: string;
    platform: string;
    thumbnailUrl?: string;
    createdAt: string;
}

export interface CreateVideoRequest {
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl?: string;
}

export interface UpdateVideoRequest {
    title?: string;
    description?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
}

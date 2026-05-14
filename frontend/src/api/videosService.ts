import api from './axios';
import type { Video, CreateVideoRequest, UpdateVideoRequest } from '../types/videoTypes';

const API_URL = '/videos';

export const videosService = {
    async getVideos(): Promise<Video[]> {
        const response = await api.get(API_URL);
        return response.data;
    },

    async getVideo(id: number): Promise<Video> {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    },

    async createVideo(request: CreateVideoRequest): Promise<Video> {
        const response = await api.post(API_URL, request);
        return response.data;
    },

    async updateVideo(id: number, request: UpdateVideoRequest): Promise<void> {
        await api.put(`${API_URL}/${id}`, request);
    },

    async deleteVideo(id: number): Promise<void> {
        await api.delete(`${API_URL}/${id}`);
    }
};

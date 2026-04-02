import api from './axios';
import type { Book, CreateBookRequest, UpdateBookRequest } from '../types/bookTypes';

const API_URL = '/books';

export const booksService = {
    async getBooks(): Promise<Book[]> {
        const response = await api.get(API_URL);
        return response.data;
    },

    async getBook(id: number): Promise<Book> {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    },

    async createBook(request: CreateBookRequest): Promise<Book> {
        const response = await api.post(API_URL, request);
        return response.data;
    },

    async updateBook(id: number, request: UpdateBookRequest): Promise<void> {
        await api.put(`${API_URL}/${id}`, request);
    },

    async deleteBook(id: number): Promise<void> {
        await api.delete(`${API_URL}/${id}`);
    },

    async uploadCover(id: number, file: File): Promise<{ coverImageUrl: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`${API_URL}/upload-cover/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    async uploadFb2(id: number, file: File): Promise<{ fb2FragmentUrl: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`${API_URL}/upload-fb2/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

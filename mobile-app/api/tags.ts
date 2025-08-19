import { API_URL } from '@env';
import { TagOut } from '../types/types';

export async function listTags(): Promise<TagOut[]> {
    const response = await fetch(`${API_URL}/tags/`);
    if (!response.ok) throw new Error(`GET /tags/ ${response.status}`);
    return response.json();
}

export async function createTag(name: string): Promise<TagOut> {
    const response = await fetch(`${API_URL}/tags/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(`POST /tags/ ${response.status}`);
    return response.json();
}

export async function renameTag(id: string, name: string): Promise<TagOut> {
        const response = await fetch(`${API_URL}/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(`PUT /tags/${id} ${response.status}`);
    return response.json();
}

export async function deleteTag(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/tags/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `DELETE /tags/${id} ${response.status}`)
    }
}
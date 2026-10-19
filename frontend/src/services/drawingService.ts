import { ApiResponse, DrawingDetail, DrawingSummary } from '../types/api';
import { apiRequest } from './api';

export const drawingService = {
  async getUserDrawings(): Promise<DrawingSummary[]> {
    const res = await apiRequest<ApiResponse<DrawingSummary[]>>('/drawings');
    return res.data || [];
  },

  async saveDrawing(payload: {
    id?: string;
    title: string;
    elementsJson: string;
    appStateJson?: string;
    thumbnail?: string;
    isPublic?: boolean;
  }): Promise<DrawingDetail> {
    const res = await apiRequest<ApiResponse<DrawingDetail>>('/drawings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async getDrawing(id: string): Promise<DrawingDetail> {
    const res = await apiRequest<ApiResponse<DrawingDetail>>(`/drawings/${id}`);
    return res.data;
  },

  async updateDrawing(
    id: string,
    payload: {
      title?: string;
      elementsJson?: string;
      appStateJson?: string;
      thumbnail?: string;
      isPublic?: boolean;
    }
  ): Promise<DrawingDetail> {
    const res = await apiRequest<ApiResponse<DrawingDetail>>(`/drawings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteDrawing(id: string): Promise<void> {
    await apiRequest<ApiResponse<void>>(`/drawings/${id}`, {
      method: 'DELETE',
    });
  },
};

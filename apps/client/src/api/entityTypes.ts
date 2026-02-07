// Entity Types API for DRME backend

import { apiClient } from './client';

export interface EntityType {
  id: string;
  tenantId: string;
  name: string;
  displayName: string;
  description: string | null;
  tableName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EntityTypeWithRelations extends EntityType {
  attributeCount: number;
  recordCount: number;
}

export interface EntityTypeListResponse {
  data: EntityType[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SearchEntityTypeParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateEntityTypeData {
  name: string;
  displayName: string;
  description?: string;
}

export interface UpdateEntityTypeData {
  displayName?: string;
  description?: string;
  isActive?: boolean;
}

export const entityTypesApi = {
  async getAll(params: SearchEntityTypeParams = {}): Promise<EntityTypeListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.set('search', params.search);
    if (params.isActive !== undefined) queryParams.set('isActive', String(params.isActive));
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const query = queryParams.toString();
    return apiClient.get<EntityTypeListResponse>(`entity-types${query ? `?${query}` : ''}`);
  },

  async getById(id: string): Promise<EntityType> {
    return apiClient.get<EntityType>(`entity-types/${id}`);
  },

  async getByIdWithRelations(id: string): Promise<EntityTypeWithRelations> {
    return apiClient.get<EntityTypeWithRelations>(`entity-types/${id}/with-relations`);
  },

  async create(data: CreateEntityTypeData): Promise<EntityType> {
    return apiClient.post<EntityType>('entity-types', data);
  },

  async update(id: string, data: UpdateEntityTypeData): Promise<EntityType> {
    return apiClient.put<EntityType>(`entity-types/${id}`, data);
  },

  async delete(id: string): Promise<EntityType> {
    return apiClient.delete<EntityType>(`entity-types/${id}`);
  },
};

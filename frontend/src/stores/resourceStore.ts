import { create } from 'zustand';
import { api } from '../api/client';
import { getApiErrorMessage } from '../api/errors';

export type Owner = { id: number; username: string };
export type ModelResource = {
  id: number; name: string; description: string | null; provider: string; model_name: string;
  base_url: string | null; status: string; created_at: string; updated_at: string; owner: Owner;
};
export type RagResource = {
  id: number; name: string; description: string | null; type: string; endpoint: string | null;
  status: string; created_at: string; updated_at: string; owner: Owner;
};
export type McpResource = RagResource;

export type ModelPayload = {
  name: string; description: string | null; provider: string; model_name: string;
  base_url: string | null; api_key?: string; status: string;
};
export type StubPayload = {
  name: string; description: string | null; type: string; endpoint: string | null; status: string;
};

type ResourceState = {
  models: ModelResource[];
  rags: RagResource[];
  mcps: McpResource[];
  isLoading: boolean;
  error: string;
  fetchAll: () => Promise<void>;
  createResource: (kind: ResourceKind, payload: ModelPayload | StubPayload) => Promise<void>;
  updateResource: (kind: ResourceKind, id: number, payload: ModelPayload | StubPayload) => Promise<void>;
  deleteResource: (kind: ResourceKind, id: number) => Promise<void>;
};

export type ResourceKind = 'models' | 'rags' | 'mcps';

export const useResourceStore = create<ResourceState>((set, get) => ({
  models: [], rags: [], mcps: [], isLoading: false, error: '',
  fetchAll: async () => {
    set({ isLoading: true, error: '' });
    try {
      const [models, rags, mcps] = await Promise.all([
        api.get<ModelResource[]>('/models'), api.get<RagResource[]>('/rags'), api.get<McpResource[]>('/mcps'),
      ]);
      set({ models: models.data, rags: rags.data, mcps: mcps.data });
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Не удалось выполнить операцию с ресурсом.') });
      throw error;
    } finally { set({ isLoading: false }); }
  },
  createResource: async (kind, payload) => {
    set({ error: '' });
    try { await api.post(`/${kind}`, payload); await get().fetchAll(); }
    catch (error) { set({ error: getApiErrorMessage(error, 'Не удалось выполнить операцию с ресурсом.') }); throw error; }
  },
  updateResource: async (kind, id, payload) => {
    set({ error: '' });
    try { await api.put(`/${kind}/${id}`, payload); await get().fetchAll(); }
    catch (error) { set({ error: getApiErrorMessage(error, 'Не удалось выполнить операцию с ресурсом.') }); throw error; }
  },
  deleteResource: async (kind, id) => {
    set({ error: '' });
    try { await api.delete(`/${kind}/${id}`); await get().fetchAll(); }
    catch (error) { set({ error: getApiErrorMessage(error, 'Не удалось выполнить операцию с ресурсом.') }); throw error; }
  },
}));

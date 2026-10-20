import { create } from 'zustand';
import { api } from '../api/client';
import { getApiErrorMessage } from '../api/errors';

import type { McpResource, ModelResource, RagResource, Owner } from './resourceStore';

export type Agent = {
  id: number;
  name: string;
  description: string | null;
  system_prompt: string;
  status: string;
  model_id: number | null;
  model: ModelResource | null;
  rags: RagResource[];
  mcps: McpResource[];
  owner: Owner | null;
  created_at: string;
  updated_at: string;
};

export type AgentPayload = Pick<Agent, 'name' | 'description' | 'system_prompt' | 'status'> & {
  model_id: number | null;
  rag_ids: number[];
  mcp_ids: number[];
};

type AgentState = {
  agents: Agent[];
  isLoading: boolean;
  error: string;
  fetchAgents: () => Promise<void>;
  fetchAgent: (id: number) => Promise<Agent>;
  createAgent: (payload: AgentPayload) => Promise<Agent>;
  updateAgent: (id: number, payload: AgentPayload) => Promise<Agent>;
  deleteAgent: (id: number) => Promise<void>;
  clearError: () => void;
};

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  isLoading: false,
  error: '',
  clearError: () => set({ error: '' }),
  fetchAgents: async () => {
    set({ isLoading: true, error: '' });
    try {
      const response = await api.get<Agent[]>('/agents');
      set({ agents: response.data });
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Не удалось выполнить операцию с агентом.') });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  fetchAgent: async (id) => {
    set({ error: '' });
    try {
      const response = await api.get<Agent>(`/agents/${id}`);
      set((state) => ({ agents: [...state.agents.filter((agent) => agent.id !== id), response.data] }));
      return response.data;
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Не удалось выполнить операцию с агентом.') });
      throw error;
    }
  },
  createAgent: async (payload) => {
    set({ error: '' });
    try {
      const response = await api.post<Agent>('/agents', payload);
      set((state) => ({ agents: [...state.agents, response.data] }));
      return response.data;
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Не удалось выполнить операцию с агентом.') });
      throw error;
    }
  },
  updateAgent: async (id, payload) => {
    set({ error: '' });
    try {
      const response = await api.put<Agent>(`/agents/${id}`, payload);
      set((state) => ({ agents: state.agents.map((agent) => agent.id === id ? response.data : agent) }));
      return response.data;
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Не удалось выполнить операцию с агентом.') });
      throw error;
    }
  },
  deleteAgent: async (id) => {
    set({ error: '' });
    try {
      await api.delete(`/agents/${id}`);
      set((state) => ({ agents: state.agents.filter((agent) => agent.id !== id) }));
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Не удалось выполнить операцию с агентом.') });
      throw error;
    }
  },
}));

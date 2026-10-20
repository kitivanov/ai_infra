import { create } from 'zustand';
import { api } from '../api/client';
import { getApiErrorMessage } from '../api/errors';

export type ChatMessage = {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};
export type ChatSummary = {
  id: number;
  user_id: number;
  agent_id: number;
  created_at: string;
  updated_at: string;
};
type ChatDetail = ChatSummary & { messages: ChatMessage[] };
type MessageResponse = { user_message: ChatMessage; assistant_message: ChatMessage };

type ChatState = {
  chats: ChatSummary[];
  activeChatId: number | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string;
  currentAgentId: number | null;
  loadForAgent: (agentId: number) => Promise<void>;
  startNewChat: (agentId: number) => Promise<void>;
  selectChat: (chatId: number) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
};

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [], currentAgentId: null, activeChatId: null, messages: [], isLoading: false, isSending: false, error: '',
  loadForAgent: async (agentId) => {
    const previous = get();
    const previousChatId = previous.currentAgentId === agentId ? previous.activeChatId : null;
    set({ currentAgentId: agentId, chats: [], activeChatId: null, messages: [], isLoading: true, error: '' });
    try {
      const response = await api.get<ChatSummary[]>(`/agents/${agentId}/chats`);
      const chats = response.data;
      if (!chats.length) {
        set({ chats, activeChatId: null, messages: [] });
        return;
      }
      const selected = chats.find((chat) => chat.id === previousChatId) ?? chats[0];
      const detail = await api.get<ChatDetail>(`/chats/${selected.id}`);
      set({ chats, activeChatId: selected.id, messages: detail.data.messages });
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Не удалось выполнить запрос. Попробуйте ещё раз.') });
      throw error;
    } finally { set({ isLoading: false }); }
  },
  selectChat: async (chatId) => {
    set({ isLoading: true, error: '' });
    try {
      const response = await api.get<ChatDetail>(`/chats/${chatId}`);
      set({ activeChatId: response.data.id, messages: response.data.messages });
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Не удалось выполнить запрос. Попробуйте ещё раз.') });
      throw error;
    } finally { set({ isLoading: false }); }
  },
  startNewChat: async (agentId) => {
    set({ isLoading: true, error: '' });
    try {
      const response = await api.post<ChatDetail>(`/agents/${agentId}/chats`);
      set((state) => ({ currentAgentId: agentId, chats: [response.data, ...state.chats], activeChatId: response.data.id, messages: [] }));
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Не удалось выполнить запрос. Попробуйте ещё раз.') });
      throw error;
    } finally { set({ isLoading: false }); }
  },
  sendMessage: async (message) => {
    const chatId = get().activeChatId;
    if (!chatId) throw new Error('Сначала создайте чат');
    set({ isSending: true, error: '' });
    try {
      const response = await api.post<MessageResponse>(`/chats/${chatId}/messages`, { message });
      set((state) => ({ messages: [...state.messages, response.data.user_message, response.data.assistant_message] }));
    } catch (error) {
      set({ error: getApiErrorMessage(error, 'Не удалось выполнить запрос. Попробуйте ещё раз.') });
      throw error;
    } finally { set({ isSending: false }); }
  },
}));

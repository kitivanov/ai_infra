import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AgentChatPanel } from '../components/AgentChatPanel';
import { AgentConfigurationPanel } from '../components/AgentConfigurationPanel';
import { AppLayout } from '../components/AppLayout';
import { StatusPill } from '../components/StatusPill';
import { useAgentStore } from '../stores/agentStore';
import type { Agent } from '../stores/agentStore';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';

export function AgentDetailPage() {
  const { id } = useParams();
  const agentId = Number(id);
  const agents = useAgentStore((state) => state.agents);
  const fetchAgent = useAgentStore((state) => state.fetchAgent);
  const deleteAgent = useAgentStore((state) => state.deleteAgent);
  const error = useAgentStore((state) => state.error);
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(agents.find((item) => item.id === agentId) ?? null);
  const [isLoading, setIsLoading] = useState(!agent);
  const [activeTab, setActiveTab] = useState<'chat' | 'configuration'>(() => window.location.hash === '#configuration' ? 'configuration' : 'chat');
  const [draft, setDraft] = useState('');
  const chats = useChatStore((state) => state.chats);
  const selectChat = useChatStore((state) => state.selectChat);
  const messages = useChatStore((state) => state.messages);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const isChatLoading = useChatStore((state) => state.isLoading);
  const isSending = useChatStore((state) => state.isSending);
  const chatError = useChatStore((state) => state.error);
  const loadChats = useChatStore((state) => state.loadForAgent);
  const startNewChat = useChatStore((state) => state.startNewChat);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCurrent = true;
    if (!Number.isInteger(agentId) || agentId < 1) {
      setIsLoading(false);
      setAgent(null);
      return;
    }
    setAgent(null);
    setIsLoading(true);
    void fetchAgent(agentId)
      .then((loadedAgent) => { if (isCurrent) setAgent(loadedAgent); })
      .catch(() => { if (isCurrent) setAgent(null); })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
  }, [agentId, fetchAgent]);

  useEffect(() => {
    if (agent?.id === agentId) void loadChats(agent.id).catch(() => undefined);
  }, [agent?.id, agentId, loadChats]);

  useEffect(() => {
    const hash = activeTab === 'configuration' ? '#configuration' : '#chat';
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
    }
  }, [activeTab]);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;
    setDraft('');
    try { await sendMessage(message); }
    catch { setDraft(message); }
  }

  async function handleNewChat() {
    try { await startNewChat(agentId); }
    catch { /* The chat store displays the error. */ }
  }

  async function handleDelete() {
    if (!agent || !window.confirm(`Удалить агента «${agent.name}»? Это действие нельзя отменить.`)) return;
    try {
      await deleteAgent(agent.id);
      navigate('/agents', { replace: true });
    } catch {
      // Ошибка отображается из состояния store.
    }
  }

  return (
    <AppLayout activeSection="agents" footerRight="КАРТОЧКА АГЕНТА">
      <section className="detail-content">
        <Link className="back-link" to="/agents">← Все агенты</Link>
        {isLoading ? (
          <div className="agents-state"><span className="loading-mark" />Загружаем агента...</div>
        ) : !agent ? (
          <div className="detail-not-found">
            <span className="eyebrow">АГЕНТ НЕ НАЙДЕН</span>
            <h1>Не удалось найти агента</h1>
            <p>{error || 'Возможно, агент был удалён или у вас нет к нему доступа.'}</p>
            <Link className="primary-link" to="/agents">Вернуться к списку</Link>
          </div>
        ) : (
          <>
            <div className="detail-heading">
              <div>
                <span className="eyebrow">АГЕНТ / {agent.id}</span>
                <h1>{agent.name}</h1>
                <p>{agent.description || 'Описание пока не добавлено.'}</p>
                <p className="owner-line">Владелец: {agent.owner?.username ?? 'Платформа'}</p>
              </div>
              <StatusPill status={agent.status} />
            </div>
            <div className="agent-tabs" role="tablist" aria-label="Раздел агента">
              <button className={activeTab === 'chat' ? 'is-active' : ''} onClick={() => setActiveTab('chat')} role="tab" aria-selected={activeTab === 'chat'} type="button">Chat</button>
              <button className={activeTab === 'configuration' ? 'is-active' : ''} onClick={() => setActiveTab('configuration')} role="tab" aria-selected={activeTab === 'configuration'} type="button">Configuration</button>
            </div>
            {activeTab === 'chat' ? (
              <AgentChatPanel
                agent={agent}
                chats={chats}
                activeChatId={activeChatId}
                messages={messages}
                isLoading={isChatLoading}
                isSending={isSending}
                error={chatError}
                draft={draft}
                messageListRef={messageListRef}
                onSelectChat={(chatId) => void selectChat(chatId)}
                onNewChat={() => void handleNewChat()}
                onDraftChange={setDraft}
                onSend={(event) => void handleSend(event)}
              />
            ) : <AgentConfigurationPanel agent={agent} />}
            {agent.owner?.id === userId && (
              <div className="detail-actions">
                <Link className="primary-link" to={`/agents/${agent.id}/edit`}>Изменить агента</Link>
                <button className="danger-button" type="button" onClick={() => void handleDelete()}>Удалить агента</button>
              </div>
            )}
          </>
        )}
      </section>
    </AppLayout>
  );
}



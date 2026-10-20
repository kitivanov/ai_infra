import type { FormEvent, RefObject } from 'react';
import type { Agent } from '../stores/agentStore';
import type { ChatMessage, ChatSummary } from '../stores/chatStore';

type AgentChatPanelProps = {
  agent: Agent;
  chats: ChatSummary[];
  activeChatId: number | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string;
  draft: string;
  messageListRef: RefObject<HTMLDivElement | null>;
  onSelectChat: (chatId: number) => void;
  onNewChat: () => void;
  onDraftChange: (value: string) => void;
  onSend: (event: FormEvent<HTMLFormElement>) => void;
};

export function AgentChatPanel({ agent, chats, activeChatId, messages, isLoading, isSending, error, draft, messageListRef, onSelectChat, onNewChat, onDraftChange, onSend }: AgentChatPanelProps) {
  return (
    <section className="chat-panel">
      <div className="chat-toolbar">
        <div>
          <strong>Чат с агентом</strong>
          <span>{agent.model ? `${agent.model.name} · ${agent.model.provider}` : 'Модель не настроена'}</span>
        </div>
        <div className="chat-toolbar-actions">
          {chats.length > 0 && (
            <select aria-label="История чатов" disabled={isLoading || isSending} onChange={(event) => onSelectChat(Number(event.target.value))} value={activeChatId ?? ''}>
              {chats.map((chat, index) => <option key={chat.id} value={chat.id}>Диалог {chats.length - index} · {new Date(chat.created_at).toLocaleDateString('ru-RU')}</option>)}
            </select>
          )}
          <button className="secondary-button" disabled={isLoading || !agent.model} onClick={onNewChat} type="button">＋ Новый чат</button>
        </div>
      </div>
      {error && <div className="api-alert chat-alert" role="alert">{error}</div>}
      {isLoading ? (
        <div className="chat-empty"><span className="loading-mark" />Загружаем историю...</div>
      ) : !activeChatId ? (
        <div className="chat-empty">
          <div className="empty-symbol">✳</div>
          <h2>Начните диалог</h2>
          <p>{agent.model ? 'Отправьте первое сообщение, чтобы начать новый чат с агентом.' : 'Для чата сначала выберите модель в конфигурации агента.'}</p>
          {agent.model && <button className="primary-link" onClick={onNewChat} type="button">Создать чат</button>}
        </div>
      ) : (
        <>
          <div className="chat-messages" ref={messageListRef} aria-live="polite">
            {messages.length === 0 ? (
              <div className="chat-empty compact"><p>Чат создан. Напишите сообщение, чтобы начать.</p></div>
            ) : messages.map((message) => (
              <article className={`chat-message ${message.role === 'user' ? 'from-user' : 'from-assistant'}`} key={message.id}>
                <span className="message-author">{message.role === 'user' ? 'Вы' : agent.name}</span>
                <p>{message.content}</p>
              </article>
            ))}
            {isSending && <article className="chat-message from-assistant"><span className="message-author">{agent.name}</span><p className="typing-indicator"><i /><i /><i /></p></article>}
          </div>
          <form className="chat-composer" onSubmit={onSend}>
            <textarea aria-label="Сообщение" disabled={isSending} onChange={(event) => onDraftChange(event.target.value)} placeholder="Напишите сообщение агенту..." rows={2} value={draft} />
            <button className="primary-link" disabled={isSending || !draft.trim()} type="submit">{isSending ? 'Отправка...' : 'Отправить'} <span aria-hidden="true">↗</span></button>
          </form>
        </>
      )}
    </section>
  );
}

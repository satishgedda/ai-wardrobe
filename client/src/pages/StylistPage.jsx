import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bot, MessageCircle, Plus, Send, Sparkles, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStylistStore } from '../store/stylist-store'

const prompts = ['What should I wear today?', 'Help me style something for dinner.', 'Which pieces am I underusing?']

function StylistPage() {
  const { conversations, activeConversation, isLoading, isSending, error, loadConversations, openConversation, newConversation, sendMessage, deleteConversation } = useStylistStore()
  const [draft, setDraft] = useState('')
  const messagesRef = useRef(null)

  useEffect(() => {
    loadConversations().then((items) => {
      if (items[0]) return openConversation(items[0]._id)
      return newConversation()
    }).catch(() => {})
  }, [loadConversations, openConversation, newConversation])

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' })
  }, [activeConversation?.messages, isSending])

  async function handleSend(event) {
    event.preventDefault()
    if (!draft.trim() || isSending || !activeConversation) return
    const content = draft.trim()
    setDraft('')
    try { await sendMessage(content) } catch { setDraft(content) }
  }

  async function handleNewConversation() {
    try { await newConversation() } catch { /* Store exposes the user-facing error. */ }
  }

  async function handleDelete(conversationId) {
    try { await deleteConversation(conversationId) } catch { /* Store exposes the user-facing error. */ }
  }

  return (
    <main className="stylist-page">
      <header className="stylist-header"><Link className="back-link" to="/wardrobe"><ArrowLeft size={15} /> Back to wardrobe</Link><div><p className="eyebrow">Your private edit</p><h1>AI Stylist</h1><p>Ask for a considered answer built around the pieces you already own.</p></div></header>
      <div className="stylist-layout">
        <aside className="conversation-sidebar"><div className="conversation-sidebar-header"><span>Conversations</span><button className="icon-button" type="button" aria-label="New conversation" onClick={handleNewConversation}><Plus size={18} /></button></div><div className="conversation-list">{conversations.map((conversation) => <div className={`conversation-entry ${activeConversation?._id === conversation._id ? 'conversation-entry-active' : ''}`} key={conversation._id}><button className="conversation-entry-select" type="button" onClick={() => openConversation(conversation._id)}><MessageCircle size={15} /><span>{conversation.title}</span></button><button className="entry-delete" type="button" aria-label={`Delete ${conversation.title}`} onClick={() => handleDelete(conversation._id)}><Trash2 size={14} /></button></div>)}</div></aside>
        <section className="chat-panel" aria-label="AI stylist conversation"><div className="chat-panel-header"><div><Bot size={20} /><strong>{activeConversation?.title || 'New styling conversation'}</strong></div><span><Sparkles size={14} /> Wardrobe aware</span></div><div className="chat-messages" ref={messagesRef}>{activeConversation?.messages?.length ? activeConversation.messages.map((message) => <div className={`chat-message chat-message-${message.role}`} key={message._id}><div className="message-avatar">{message.role === 'assistant' ? <Bot size={16} /> : <span>You</span>}</div><div className="message-body"><p>{message.content}</p>{message.referencedClothingItemIds?.length > 0 && <small>{message.referencedClothingItemIds.length} wardrobe {message.referencedClothingItemIds.length === 1 ? 'piece' : 'pieces'} referenced</small>}</div></div>) : <div className="chat-welcome"><div className="stylist-mark"><Sparkles size={22} /></div><h2>A sharper point of view.</h2><p>Ask me about your wardrobe, an occasion, or the weather. I&apos;ll work with what you own.</p><div className="prompt-list">{prompts.map((prompt) => <button type="button" key={prompt} onClick={() => setDraft(prompt)}>{prompt}</button>)}</div></div>}{isSending && <div className="chat-message chat-message-assistant"><div className="message-avatar"><Bot size={16} /></div><div className="typing-indicator"><span /><span /><span /></div></div>}{isLoading && <div className="chat-loading">Opening your conversations...</div>}</div>{error && <p className="chat-error" role="alert">{error}</p>}<form className="chat-composer" onSubmit={handleSend}><textarea value={draft} rows="1" placeholder="Ask your stylist anything..." aria-label="Message your stylist" onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend(event) } }} /><button className="primary-button" type="submit" disabled={!draft.trim() || isSending}><Send size={16} /><span>Send</span></button></form></section>
      </div>
    </main>
  )
}

export default StylistPage

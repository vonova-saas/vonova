'use client';
import { useState } from 'react';
import { AIInput, AIInputTextarea, AIInputToolbar, AIInputTools, AIInputButton, AIInputSubmit, AIInputModelSelect, AIInputModelSelectContent, AIInputModelSelectItem, AIInputModelSelectTrigger, AIInputModelSelectValue } from '@/components/ui/ai/ai-components/input';
import { AIResponse } from '@/components/ui/ai/ai-components/response';
import { AIMessage, AIMessageContent, AIMessageAvatar } from '@/components/ui/ai/ai-components/message';
import { PlusIcon, MicIcon, GlobeIcon, SendIcon } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  from: 'user' | 'assistant';
  timestamp: Date;
}

const models = [
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'claude-2', name: 'Claude 2' },
  { id: 'claude-instant', name: 'Claude Instant' },
  { id: 'palm-2', name: 'PaLM 2' },
  { id: 'llama-2-70b', name: 'Llama 2 70B' },
  { id: 'llama-2-13b', name: 'Llama 2 13B' },
  { id: 'cohere-command', name: 'Command' },
  { id: 'mistral-7b', name: 'Mistral 7B' },
];

// Fake AI responses for demonstration
const fakeResponses = [
  "Hello! I&apos;m your AI assistant. How can I help you today? I can help with coding, writing, analysis, and much more.",
  "That&apos;s an interesting question! Let me break this down for you:\n\n1. **First point**: This is important because...\n2. **Second point**: Consider this aspect...\n3. **Third point**: Don&apos;t forget about...\n\nWould you like me to elaborate on any of these points?",
  "Here&apos;s a code example that might help:\n\n```javascript\nfunction example() {\n  console.log(&apos;Hello, world!&apos;);\n  return &apos;success&apos;;\n}\n```\n\nThis demonstrates the basic concept you&apos;re asking about.",
  "I understand your concern. Based on what you&apos;ve described, here are a few approaches you could consider:\n\n- **Approach A**: Best for simple cases\n- **Approach B**: More robust but complex\n- **Approach C**: Middle ground solution\n\nWhich approach sounds most relevant to your situation?",
  "Great question! This is a common challenge that many developers face. The key is to understand the underlying principles and then apply them to your specific use case.\n\nLet me know if you need any clarification or have follow-up questions!"
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>('');
  const [model, setModel] = useState<string>(models[0].id);
  const [status, setStatus] = useState<'submitted' | 'streaming' | 'ready' | 'error'>('ready');
  const [isTyping, setIsTyping] = useState(false);

  const generateFakeResponse = () => {
    // Simple logic to generate different responses based on user input
    const responseIndex = Math.floor(Math.random() * fakeResponses.length);
    return fakeResponses[responseIndex];
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      from: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setText('');
    setStatus('submitted');
    setIsTyping(true);

    // Simulate AI thinking and responding
    setTimeout(() => {
      setStatus('streaming');
      
      // Simulate streaming response
      const aiResponse = generateFakeResponse();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        from: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setStatus('ready');
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AI</span>
          </div>
          <div>
            <h1 className="font-semibold">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">Powered by {models.find(m => m.id === model)?.name}</p>
          </div>
        </div>
        <AIInputModelSelect onValueChange={setModel} value={model}>
          <AIInputModelSelectTrigger className="w-40">
            <AIInputModelSelectValue />
          </AIInputModelSelectTrigger>
          <AIInputModelSelectContent>
            {models.map((model) => (
              <AIInputModelSelectItem key={model.id} value={model.id}>
                {model.name}
              </AIInputModelSelectItem>
            ))}
          </AIInputModelSelectContent>
        </AIInputModelSelect>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
            <p className="text-muted-foreground max-w-md">
              I&apos;m here to assist you with coding, writing, analysis, and much more. 
              Just type your question below and I&apos;ll do my best to help!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <AIMessage key={message.id} from={message.from}>
              <AIMessageAvatar 
                src={message.from === 'user' ? '/images/avatars/avatar1.avif' : '/images/vonova.png'}
                name={message.from === 'user' ? 'You' : 'AI Assistant'}
              />
              <AIMessageContent>
                {message.from === 'user' ? (
                  <div>{message.content}</div>
                ) : (
                  <AIResponse>{message.content}</AIResponse>
                )}
              </AIMessageContent>
            </AIMessage>
          ))
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <AIMessage from="assistant">
            <AIMessageAvatar 
              src="/images/vonova.png"
              name="AI Assistant"
            />
            <AIMessageContent>
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-muted-foreground">AI is thinking...</span>
              </div>
            </AIMessageContent>
          </AIMessage>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <AIInput onSubmit={handleSubmit}>
          <AIInputTextarea 
            onChange={(e) => setText(e.target.value)} 
            value={text}
            placeholder="Message AI Assistant..."
            disabled={isTyping}
          />
          <AIInputToolbar>
            <AIInputTools>
              <AIInputButton disabled={isTyping}>
                <PlusIcon size={16} />
              </AIInputButton>
              <AIInputButton disabled={isTyping}>
                <MicIcon size={16} />
              </AIInputButton>
              <AIInputButton disabled={isTyping}>
                <GlobeIcon size={16} />
                <span>Search</span>
              </AIInputButton>
            </AIInputTools>
            <AIInputSubmit 
              disabled={!text.trim() || isTyping} 
              status={status}
            >
              <SendIcon size={16} />
            </AIInputSubmit>
          </AIInputToolbar>
        </AIInput>
      </div>
    </div>
  );
}

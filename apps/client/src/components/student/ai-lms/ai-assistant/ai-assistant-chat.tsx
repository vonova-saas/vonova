"use client";
import { useState } from 'react';
import { useRef } from 'react';
import { 
  AIInput, 
  AIInputTextarea, 
  AIInputToolbar, 
  AIInputTools, 
  AIInputButton, 
  AIInputSubmit, 
  AIInputModelSelect, 
  AIInputModelSelectContent, 
  AIInputModelSelectItem, 
  AIInputModelSelectTrigger, 
  AIInputModelSelectValue 
} from '@/components/ui/ai/ai-components/input';
import { AIResponse } from '@/components/ui/ai/ai-components/response';
import { 
  AIConversation, 
  AIConversationContent, 
  AIConversationScrollButton 
} from '@/components/ui/ai/ai-components/conversation';
import { 
  AIBranch, 
  AIBranchMessages, 
  AIBranchSelector, 
  AIBranchPrevious, 
  AIBranchNext 
} from '@/components/ui/ai/ai-components/branch';
import { 
  BotIcon,
  TrashIcon,
  PlusIcon,
  MicIcon,
  GlobeIcon,
  SendIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import useStudentId from '@/hooks/student/use-student-id';

interface Message {
  id: string;
  content: string;
  from: 'user' | 'assistant';
  timestamp: Date;
}

const models = [
  { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
  { id: 'claude-2', name: 'Claude 2', description: 'Advanced reasoning' },
  { id: 'claude-instant', name: 'Claude Instant', description: 'Quick responses' },
  { id: 'palm-2', name: 'PaLM 2', description: 'Google\'s latest' },
  { id: 'llama-2-70b', name: 'Llama 2 70B', description: 'Open source power' },
  { id: 'llama-2-13b', name: 'Llama 2 13B', description: 'Lightweight option' },
  { id: 'cohere-command', name: 'Command', description: 'Enterprise ready' },
  { id: 'mistral-7b', name: 'Mistral 7B', description: 'Fast and accurate' },
];

const fakeResponses = [
  {
    content: "Hello! I\'m your AI assistant. I can help you with coding, writing, analysis, and much more. What would you like to work on today?",
  },
  {
    content: "That\'s an interesting question! Let me break this down for you:\n\n1. **First point**: This is important because it establishes the foundation\n2. **Second point**: Consider this aspect for better understanding\n3. **Third point**: Don\'t forget about the practical implications\n\nWould you like me to elaborate on any of these points?",
  },
  {
    content: "Here\'s a code example that might help:\n\n```javascript\nfunction example() {\n  console.log('Hello, world!');\n  return 'success';\n}\n```\n\nThis demonstrates the basic concept you\'re asking about. You can extend this pattern for more complex scenarios.",
  },
  {
    content: "I understand your concern. Based on what you\'ve described, here are a few approaches you could consider:\n\n- **Approach A**: Best for simple cases, easy to implement\n- **Approach B**: More robust but complex, better for production\n- **Approach C**: Middle ground solution, good balance\n\nWhich approach sounds most relevant to your situation?",
  },
  {
    content: "Great question! This is a common challenge that many developers face. The key is to understand the underlying principles and then apply them to your specific use case.\n\nLet me know if you need any clarification or have follow-up questions!",
  }
];

const AIAssistantChat = () => {
  const studentId = useStudentId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>('');
  const [model, setModel] = useState<string>(models[0].id);
  const [status, setStatus] = useState<'submitted' | 'streaming' | 'ready' | 'error'>('ready');
  const [isTyping, setIsTyping] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(0);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generateFakeResponse = () => {
    const responseIndex = Math.floor(Math.random() * fakeResponses.length);
    return fakeResponses[responseIndex];
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      from: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setText('');
    // Reset textarea height after submit
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setStatus('submitted');
    setIsTyping(true);

    setTimeout(() => {
      setStatus('streaming');
      const aiResponseData = generateFakeResponse();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseData.content,
        from: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setStatus('ready');
      setIsTyping(false);
    }, 2000);
  };

  const clearConversation = () => {
    setMessages([]);
    setCurrentBranch(0);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.from === 'user';
    return (
      <div key={message.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <div className="flex items-end mr-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border">
              {/* OpenAI swirl SVG icon */}
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path d="M20.5 6.5c-3.5-2-8 0-9.5 3.5l-7 12c-2 3.5 0 8 3.5 9.5l12 7c3.5 2 8 0 9.5-3.5l7-12c2-3.5 0-8-3.5-9.5l-12-7z" fill="#fff"/>
                  <path d="M20.5 6.5c-3.5-2-8 0-9.5 3.5l-7 12c-2 3.5 0 8 3.5 9.5l12 7c3.5 2 8 0 9.5-3.5l7-12c2-3.5 0-8-3.5-9.5l-12-7z" stroke="#000" strokeWidth="2"/>
                </g>
              </svg>
            </div>
          </div>
        )}
        <div className={`max-w-[70%] ${isUser ? 'ml-8' : 'mr-8'}`}> 
          <div className={`rounded-2xl px-4 py-3 text-base ${isUser ? 'bg-white text-black' : 'bg-neutral-900 text-white'} shadow-sm`}>
            <AIResponse>{message.content}</AIResponse>
          </div>
        </div>
        {isUser && (
          <div className="flex items-end ml-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/avatars/avatar1.avif" alt="User" className="w-10 h-10 rounded-full border" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BotIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold">AI Assistant</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Powered by {models.find(m => m.id === model)?.name}
              </p>
              <Badge variant="secondary" className="text-xs">
                {messages.length} messages
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AIInputModelSelect onValueChange={setModel} value={model}>
            <AIInputModelSelectTrigger className="w-40">
              <AIInputModelSelectValue />
            </AIInputModelSelectTrigger>
            <AIInputModelSelectContent>
              {models.map((model) => (
                <AIInputModelSelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span>{model.name}</span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </div>
                </AIInputModelSelectItem>
              ))}
            </AIInputModelSelectContent>
          </AIInputModelSelect>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearConversation}
            disabled={messages.length === 0}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {/* Chat Messages - Compact height to fit dashboard */}
      <div className="h-[calc(100vh-280px)] overflow-hidden">
        <AIConversation className="h-full">
          <AIConversationContent>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <BotIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  I&apos;m here to assist you with coding, writing, analysis, and much more. 
                  Just type your question below and I&apos;ll do my best to help!
                </p>
              </div>
            ) : (
              <AIBranch defaultBranch={currentBranch} onBranchChange={setCurrentBranch}>
                <AIBranchMessages>
                  <div className="space-y-4">
                    {messages.map((message) => renderMessage(message))}
                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex w-full justify-start mb-4">
                        <div className="flex items-end mr-2">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border">
                            {/* OpenAI swirl SVG icon */}
                            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g>
                                <path d="M20.5 6.5c-3.5-2-8 0-9.5 3.5l-7 12c-2 3.5 0 8 3.5 9.5l12 7c3.5 2 8 0 9.5-3.5l7-12c2-3.5 0-8-3.5-9.5l-12-7z" fill="#fff"/>
                                <path d="M20.5 6.5c-3.5-2-8 0-9.5 3.5l-7 12c-2 3.5 0 8 3.5 9.5l12 7c3.5 2 8 0 9.5-3.5l7-12c2-3.5 0-8-3.5-9.5l-12-7z" stroke="#000" strokeWidth="2"/>
                              </g>
                            </svg>
                          </div>
                        </div>
                        <div className="max-w-[70%] mr-8">
                          <div className="rounded-2xl px-4 py-3 text-base bg-neutral-900 text-white shadow-sm flex items-center gap-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-gray-200">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </AIBranchMessages>
                <AIBranchSelector from="assistant">
                  <AIBranchPrevious />
                  <AIBranchNext />
                </AIBranchSelector>
              </AIBranch>
            )}
          </AIConversationContent>
          <AIConversationScrollButton />
        </AIConversation>
      </div>
      {/* Fixed Input Area at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg flex flex-col-reverse items-stretch p-4 gap-0">
        <AIInput onSubmit={handleSubmit} className="border shadow-sm w-full">
          <AIInputTextarea 
            onChange={(e) => setText(e.target.value)} 
            value={text}
            placeholder="Message AI Assistant..."
            disabled={isTyping}
            className="min-h-[60px] max-h-[120px] resize-none w-full"
            style={{overflowY: 'auto'}}
            ref={textareaRef}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const form = e.currentTarget.form;
                if (form) form.requestSubmit();
              }
            }}
          />
          <AIInputToolbar>
            <AIInputTools>
              <AIInputButton disabled={isTyping} className="hover:bg-accent/50">
                <PlusIcon size={16} />
              </AIInputButton>
              <AIInputButton
                disabled={isTyping}
                className="hover:bg-accent/50"
                onClick={() => router.push(`/student/${studentId}/ai-assistant/voice`)}
              >
                <MicIcon size={16} />
              </AIInputButton>
              <AIInputButton disabled={isTyping} className="hover:bg-accent/50">
                <GlobeIcon size={16} />
                <span>Search</span>
              </AIInputButton>
            </AIInputTools>
            <AIInputSubmit 
              disabled={!text.trim() || isTyping} 
              status={status}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <SendIcon size={16} />
            </AIInputSubmit>
          </AIInputToolbar>
        </AIInput>
      </div>
    </div>
  );
};

export default AIAssistantChat; 
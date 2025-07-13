'use client';
import {
  AIInput,
  AIInputButton,
  AIInputModelSelect,
  AIInputModelSelectContent,
  AIInputModelSelectItem,
  AIInputModelSelectTrigger,
  AIInputModelSelectValue,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from '@/components/ui/ai/ai-components/input';
import { GlobeIcon, MicIcon, PlusIcon, SendIcon } from 'lucide-react';
import { type FormEventHandler } from 'react';

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

interface AIInputComponentProps {
  text: string;
  setText: (text: string) => void;
  model: string;
  setModel: (model: string) => void;
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  onSubmit: FormEventHandler<HTMLFormElement>;
  placeholder?: string;
  disabled?: boolean;
}

const AIInputComponent = ({
  text,
  setText,
  model,
  setModel,
  status,
  onSubmit,
  placeholder = "Message AI Assistant...",
  disabled = false,
}: AIInputComponentProps) => {
  return (
    <AIInput onSubmit={onSubmit}>
      <AIInputTextarea 
        onChange={(e) => setText(e.target.value)} 
        value={text}
        placeholder={placeholder}
        disabled={disabled}
      />
      <AIInputToolbar>
        <AIInputTools>
          <AIInputButton disabled={disabled}>
            <PlusIcon size={16} />
          </AIInputButton>
          <AIInputButton disabled={disabled}>
            <MicIcon size={16} />
          </AIInputButton>
          <AIInputButton disabled={disabled}>
            <GlobeIcon size={16} />
            <span>Search</span>
          </AIInputButton>
          <AIInputModelSelect onValueChange={setModel} value={model}>
            <AIInputModelSelectTrigger>
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
        </AIInputTools>
        <AIInputSubmit 
          disabled={!text.trim() || disabled} 
          status={status}
        >
          <SendIcon size={16} />
        </AIInputSubmit>
      </AIInputToolbar>
    </AIInput>
  );
};

export default AIInputComponent;
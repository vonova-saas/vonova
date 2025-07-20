'use client';
import { AIMessage, AIMessageAvatar, AIMessageContent } from '@/components/ui/ai/ai-components/message';

interface AIMessageComponentProps {
  from: 'user' | 'assistant';
  content: string;
  avatar?: string;
  name?: string;
  children?: React.ReactNode;
}

const AIMessageComponent = ({
  from,
  content,
  avatar,
  name,
  children
}: AIMessageComponentProps) => {
  const defaultAvatar = from === 'user' 
    ? '/images/avatars/avatar1.avif' 
    : '/images/vonova.png';
  
  const defaultName = from === 'user' ? 'You' : 'AI Assistant';

  return (
    <AIMessage from={from}>
      <AIMessageAvatar 
        src={avatar || defaultAvatar}
        name={name || defaultName}
      />
      <AIMessageContent>
        {children || <div>{content}</div>}
      </AIMessageContent>
    </AIMessage>
  );
};

export default AIMessageComponent;
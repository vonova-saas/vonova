'use client';
import { AIResponse } from '@/components/ui/ai/ai-components/response';
import { useEffect, useState } from 'react';

interface AIResponseComponentProps {
  content: string;
  isStreaming?: boolean;
  streamingSpeed?: number;
}

const AIResponseComponent = ({ 
  content, 
  isStreaming = false, 
  streamingSpeed = 100 
}: AIResponseComponentProps) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      setCurrentIndex(0);
      return;
    }

    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, streamingSpeed);

      return () => clearTimeout(timer);
    }
  }, [content, isStreaming, currentIndex, streamingSpeed]);

  return <AIResponse>{displayedContent}</AIResponse>;
};

export default AIResponseComponent;
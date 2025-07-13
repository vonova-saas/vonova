'use client';
import { AIResponse } from '@/components/ui/ai/ai-components/response';
import {
  AITool,
  AIToolContent,
  AIToolHeader,
  AIToolParameters,
  AIToolResult,
  type AIToolStatus,
} from '@/components/ui/ai/ai-components/tool';

interface AIToolComponentProps {
  name: string;
  description: string;
  status: AIToolStatus;
  parameters: Record<string, unknown>;
  result?: string;
  error?: string;
}

const AIToolComponent = ({
  name,
  description,
  status,
  parameters,
  result,
  error
}: AIToolComponentProps) => {
  return (
    <AITool>
      <AIToolHeader
        description={description}
        name={name}
        status={status}
      />
      <AIToolContent>
        <AIToolParameters parameters={parameters} />
        {(result || error) && (
          <AIToolResult
            error={error}
            result={<AIResponse>{result}</AIResponse>}
          />
        )}
      </AIToolContent>
    </AITool>
  );
};

export default AIToolComponent;

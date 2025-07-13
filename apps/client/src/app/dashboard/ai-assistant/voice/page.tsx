'use client';
import { useRouter } from 'next/navigation';
import AIAssistantVoice from '@/components/dashboard/student/ai-assistant/AIAssistantVoice';

export default function AIAssistantVoicePage() {
  const router = useRouter();
  return <AIAssistantVoice onClose={() => router.push('/dashboard/ai-assistant')} />;
} 
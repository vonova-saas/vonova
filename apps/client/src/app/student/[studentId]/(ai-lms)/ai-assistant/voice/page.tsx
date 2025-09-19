'use client';
import { useRouter } from 'next/navigation';
import AIAssistantVoice from '@/components/student/ai-lms/ai-assistant/ai-assistant-voice';

export default function AIAssistantVoicePage() {
  const router = useRouter();
  return <AIAssistantVoice onClose={() => router.push('/dashboard/ai-assistant')} />;
} 
/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from 'next/image';
import { useState, useRef } from 'react';
import { MicIcon, XIcon, HelpCircleIcon } from 'lucide-react';

interface AIAssistantVoiceProps {
  onClose: () => void;
}

const AIAssistantVoice = ({ onClose }: AIAssistantVoiceProps) => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const [language, setLanguage] = useState<'en-US' | 'ar-SA'>('en-US');

  // Start/stop speech recognition
  const handleMicClick = () => {
    if (recording) {
      setRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }
    setTranscript('');
    setRecording(true);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      setRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let latestTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        latestTranscript += event.results[i][0].transcript;
      }
      if (latestTranscript) {
        setTranscript(latestTranscript + (recording ? ' [listening]' : ''));
      }
    };
    recognition.onend = () => {
      setRecording(false);
    };
    recognition.onerror = () => {
      setRecording(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white dark:bg-background transition-colors relative">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Language Selector */}
        <div className="mb-6 flex gap-4 items-center">
          <label htmlFor="lang-select" className="text-gray-600 dark:text-gray-300 text-sm">Language:</label>
          <select
            id="lang-select"
            value={language}
            onChange={e => setLanguage(e.target.value as 'en-US' | 'ar-SA')}
            className="rounded px-2 py-1 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200 focus:outline-none"
            disabled={recording}
          >
            <option value="en-US">English</option>
            <option value="ar-SA">العربية</option>
          </select>
        </div>
        <div
          className={`rounded-full overflow-hidden shadow-lg flex items-center justify-center transition-all duration-300 ${
            recording ? 'ring-4 ring-blue-400 animate-pulse' : ''
          }`}
          style={{ width: 180, height: 180 }}
        >
          <Image
            src="/images/AI_voice.svg"
            alt="AI Voice"
            width={180}
            height={180}
            priority
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        </div>
        {transcript && (
          <div className="mt-6 text-lg text-center text-gray-700 dark:text-gray-200 max-w-xl">
            {transcript.replace(' [listening]', '')}
            {recording && <span className="ml-2 animate-pulse text-blue-400">●</span>}
          </div>
        )}
        <div className="mt-10 text-gray-400 dark:text-gray-300 text-sm flex items-center gap-1">
          Enable microphone access in Settings
          <HelpCircleIcon className="w-4 h-4 ml-1" />
        </div>
        <div className="mt-8 flex gap-8">
          <button
            className={`w-14 h-14 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 text-2xl shadow transition border-none focus:outline-none ${
              recording ? 'bg-blue-500 animate-pulse text-white' : 'bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700'
            }`}
            aria-label={recording ? 'Stop recording' : 'Enable microphone'}
            onClick={handleMicClick}
          >
            <MicIcon className="w-5 h-5" />
          </button>
          <button
            className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-700 dark:text-gray-200 text-2xl shadow hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
            aria-label="Close voice assistant"
            onClick={onClose}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <button
        className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 dark:text-gray-300 shadow hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
        aria-label="Help"
      >
        <HelpCircleIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default AIAssistantVoice;

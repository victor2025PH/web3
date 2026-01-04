import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VoiceClonerContextType {
  referenceAudio: Blob | null;
  referenceText: string;
  referenceSource: 'default' | 'upload' | 'record';
  setReferenceAudio: (audio: Blob | null, source: 'default' | 'upload' | 'record') => void;
  setReferenceText: (text: string) => void;
  clearReference: () => void;
}

const VoiceClonerContext = createContext<VoiceClonerContextType | undefined>(undefined);

export const VoiceClonerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [referenceAudio, setReferenceAudioState] = useState<Blob | null>(null);
  const [referenceText, setReferenceTextState] = useState<string>('请在这里填入参考文本内容');
  const [referenceSource, setReferenceSource] = useState<'default' | 'upload' | 'record'>('default');

  const setReferenceAudio = (audio: Blob | null, source: 'default' | 'upload' | 'record') => {
    setReferenceAudioState(audio);
    setReferenceSource(source);
  };

  const setReferenceText = (text: string) => {
    setReferenceTextState(text);
  };

  const clearReference = () => {
    setReferenceAudioState(null);
    setReferenceSource('default');
    setReferenceTextState('请在这里填入参考文本内容');
  };

  return (
    <VoiceClonerContext.Provider
      value={{
        referenceAudio,
        referenceText,
        referenceSource,
        setReferenceAudio,
        setReferenceText,
        clearReference,
      }}
    >
      {children}
    </VoiceClonerContext.Provider>
  );
};

export const useVoiceCloner = () => {
  const context = useContext(VoiceClonerContext);
  if (context === undefined) {
    throw new Error('useVoiceCloner must be used within a VoiceClonerProvider');
  }
  return context;
};

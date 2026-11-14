import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for pronouncing English medical questions and terms using Web Speech API.
 * Automatically chooses the best English voice (en-CA / en-US) with medical-paced cadence.
 */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const updateVoices = () => {
      try {
        voicesRef.current = window.speechSynthesis.getVoices();
      } catch {
        voicesRef.current = [];
      }
    };

    updateVoices();
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      try {
        if ('onvoiceschanged' in window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
        window.speechSynthesis.cancel();
      } catch {}
      utteranceRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {}
    utteranceRef.current = null;
    setIsSpeaking(false);
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (text: string, id: string = 'main') => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      try {
        // If already speaking this item, toggle off
        if (window.speechSynthesis.speaking && isSpeaking && speakingId === id) {
          stop();
          return;
        }

        window.speechSynthesis.cancel();

        const cleanText = text.replace(/[*_#`]/g, '').trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Select voice: Canadian English (en-CA) preferred for NACC, then US (en-US), then any English
        const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
        const enVoice =
          voices.find((v) => v.lang === 'en-CA' || v.lang === 'en_CA') ||
          voices.find((v) => v.lang === 'en-US' || v.lang === 'en_US') ||
          voices.find((v) => v.lang.startsWith('en'));

        if (enVoice) {
          utterance.voice = enVoice;
          utterance.lang = enVoice.lang;
        } else {
          utterance.lang = 'en-CA';
        }

        // Slightly measured speed for clear articulation of medical terminology
        utterance.rate = 0.92;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setSpeakingId(id);
        };
        utterance.onend = () => {
          utteranceRef.current = null;
          setIsSpeaking(false);
          setSpeakingId(null);
        };
        utterance.onerror = () => {
          utteranceRef.current = null;
          setIsSpeaking(false);
          setSpeakingId(null);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch {
        utteranceRef.current = null;
        setIsSpeaking(false);
        setSpeakingId(null);
      }
    },
    [isSpeaking, speakingId, stop]
  );

  return {
    isSpeaking,
    speakingId,
    isSupported,
    speak,
    stop,
  };
}

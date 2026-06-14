import React, { useEffect, useState } from 'react';
import { cn } from '../../../logic/utils/cn';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useSpeechToText, useTextToSpeech } from '../../../logic/hooks/useSpeech';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface VoiceInputProps {
  className?: string;
  onTranscript?: (text: string) => void;
  lang?: string;
}

export const VoiceInput: React.FC<VoiceInputProps & { id?: string }> = ({ className, onTranscript, lang = 'id-ID', id = "voice-input" }) => {
  const { startListening, stopListening, isListening, transcript, error, isSupported } = useSpeechToText();

  useEffect(() => {
    if (transcript && onTranscript && !isListening) {
      onTranscript(transcript);
    }
  }, [transcript, isListening, onTranscript]);

  if (!isSupported) return null;

  return (
    <div id={id} className={cn("inline-flex items-center gap-SpacingTiny", className)}>
      <button
        id={`${id}-trigger`}
        type="button"
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
        className={cn(
          "p-SpacingTiny rounded-RadiusFull transition-all duration-DurationMid shadow-ElevationLow",
          isListening 
            ? "bg-FeedbackColorError text-White scale-110 shadow-ElevationHigh animate-pulse" 
            : "bg-ColorBgSecondary text-TextColorMuted hover:text-ColorPrimary hover:bg-ColorSidebarAccent"
        )}
        title={isListening ? "Berhenti Rekam" : "Mulai Rekam"}
      >
        {isListening ? <Mic id={`${id}-mic-icon`} size="1.25rem" /> : <MicOff id={`${id}-micoff-icon`} size="1.25rem" />}
      </button>
      
      {isListening && (
        <span id={`${id}-listening-status`} className="text-FontSizeNano font-black text-FeedbackColorError animate-pulse">
          Mendengarkan...
        </span>
      )}
      
      {error && !isListening && (
        <span id={`${id}-error-info`} className="text-FontSizeNano text-FeedbackColorError font-bold">
          Terjadi kesalahan suara.
        </span>
      )}
    </div>
  );
};

interface TextToSpeechProps {
  text: string;
  className?: string;
  lang?: string;
  id?: string;
}

export const TextToSpeech: React.FC<TextToSpeechProps> = ({ text, className, lang = 'id-ID', id = "tts-control" }) => {
  const { speak, stop, isReading, isSupported } = useTextToSpeech();

  if (!isSupported || !text) return null;

  return (
    <button
      id={id}
      type="button"
      onClick={() => isReading ? stop() : speak(text, lang)}
      className={cn(
        "p-SpacingTiny rounded-RadiusSmall transition-all",
        isReading 
          ? "text-ColorPrimary bg-ColorPrimary/opacity-OpacitySubtle shadow-ElevationLow" 
          : "text-TextColorMuted hover:text-TextColorBase hover:bg-ColorSidebarAccent",
        className
      )}
      title={isReading ? "Berhenti Suara" : "Putar Suara"}
    >
      {isReading ? <VolumeX id={`${id}-stop-icon`} size="1rem" /> : <Volume2 id={`${id}-play-icon`} size="1rem" />}
    </button>
  );
};

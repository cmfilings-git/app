import React, { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Pause,
  Play,
  Circle,
  PhoneOff,
  VolumeX,
} from 'lucide-react';
import { ActiveCallState } from '../types';
import { formatDuration, getInitials } from '../data/initialData';

interface InCallOverlayProps {
  call: ActiveCallState;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleHold: () => void;
  onToggleRecording: () => void;
  onChangeNote: (note: string) => void;
  onEndCall: (recordedAudioDataUrl?: string) => void;
}

export const InCallOverlay: React.FC<InCallOverlayProps> = ({
  call,
  onToggleMute,
  onToggleSpeaker,
  onToggleHold,
  onToggleRecording,
  onChangeNote,
  onEndCall,
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Attempt local silent audio capture via MediaRecorder when recording is active
  useEffect(() => {
    let cancelled = false;

    const startCapture = async () => {
      if (!call.isRecording || call.status !== 'connected') return;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') return;
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunksRef.current.push(ev.data);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      } catch {
        // Microphone unavailable or denied — proceed cleanly with silent recording metadata
      }
    };

    const stopCapture = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };

    if (call.isRecording && call.status === 'connected') {
      startCapture();
    } else {
      stopCapture();
    }

    return () => {
      cancelled = true;
      stopCapture();
    };
  }, [call.isRecording, call.status]);

  const handleHangup = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (blob.size > 0 && blob.size < 1_500_000) {
          const reader = new FileReader();
          reader.onloadend = () => {
            onEndCall(typeof reader.result === 'string' ? reader.result : undefined);
          };
          reader.readAsDataURL(blob);
        } else {
          onEndCall(undefined);
        }
      };
      try {
        recorder.stop();
      } catch {
        onEndCall(undefined);
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      onEndCall(undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between px-6 py-10 overflow-y-auto">
      <div className="max-w-md w-full mx-auto flex flex-col items-center text-center pt-4">
        <div className="w-16 h-16 rounded-full bg-ocean-50 border border-ocean-200 text-ocean-700 font-display text-xl font-semibold flex items-center justify-center mb-4">
          {getInitials(call.contact.name)}
        </div>

        <h2 className="text-2xl font-semibold text-slate-900 mb-1">
          {call.contact.name}
        </h2>
        <p className="text-sm font-mono-num text-slate-500 mb-4">
          {call.contact.phone}
        </p>

        <div className="text-base font-mono-num font-medium text-slate-900 mb-2">
          {call.status === 'ringing'
            ? 'Calling...'
            : call.isHold
            ? `On hold · ${formatDuration(call.duration)}`
            : formatDuration(call.duration)}
        </div>

        {call.isRecording && (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-ocean-700">
            <VolumeX className="w-3.5 h-3.5" />
            <span>
              Recording locally
              {call.silentRecording ? ' · Without announcement' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Quick In-Call Note */}
      <div className="max-w-md w-full mx-auto my-6">
        <label htmlFor="incall-note" className="block text-xs font-medium text-slate-500 mb-2">
          Call Note (saved locally)
        </label>
        <textarea
          id="incall-note"
          rows={3}
          value={call.callNote}
          onChange={(e) => onChangeNote(e.target.value)}
          placeholder="Write key details during the call..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-ocean-700 transition-colors resize-none"
        />
      </div>

      {/* Call Controls */}
      <div className="max-w-[280px] w-full mx-auto pb-4 flex flex-col items-center">
        <div className="w-full grid grid-cols-4 gap-2 mb-6">
          <button
            type="button"
            onClick={onToggleMute}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl border transition-colors cursor-pointer ${
              call.isMuted
                ? 'bg-ocean-700 border-ocean-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {call.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="text-[11px] font-medium">Mute</span>
          </button>

          <button
            type="button"
            onClick={onToggleSpeaker}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl border transition-colors cursor-pointer ${
              call.isSpeaker
                ? 'bg-ocean-700 border-ocean-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span className="text-[11px] font-medium">Speaker</span>
          </button>

          <button
            type="button"
            onClick={onToggleHold}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl border transition-colors cursor-pointer ${
              call.isHold
                ? 'bg-ocean-700 border-ocean-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {call.isHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="text-[11px] font-medium">Hold</span>
          </button>

          <button
            type="button"
            onClick={onToggleRecording}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl border transition-colors cursor-pointer ${
              call.isRecording
                ? 'bg-ocean-700 border-ocean-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Circle className={`w-4 h-4 ${call.isRecording ? 'fill-current' : ''}`} />
            <span className="text-[11px] font-medium">Record</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleHangup}
          className="h-11 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.98]"
        >
          <PhoneOff className="w-4 h-4" />
          <span>End Call</span>
        </button>
      </div>
    </div>
  );
};

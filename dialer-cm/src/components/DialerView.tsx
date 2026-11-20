import React, { useState, useRef } from 'react';
import {
  Phone,
  Delete,
  UserPlus,
  Circle,
  VolumeX,
  Play,
  Pause,
  Trash2,
  Download,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  X,
} from 'lucide-react';
import {
  Contact,
  CallRecord,
  CallRecording,
  AppPreferences,
} from '../types';
import { searchT9Contacts, formatDuration } from '../data/initialData';
import { dialerAudio } from '../utils/audio';

interface DialerViewProps {
  contacts: Contact[];
  calls: CallRecord[];
  recordings: CallRecording[];
  preferences: AppPreferences;
  googleLinked: boolean;
  onUpdatePreferences: (patch: Partial<AppPreferences>) => void;
  onStartCall: (target: { name: string; phone: string; contactId?: string }) => void;
  onSaveNumber: (
    data: { name: string; phone: string; email?: string; notes?: string },
    saveToGoogle: boolean
  ) => void;
  onDeleteRecording: (id: string) => void;
  onClearCalls: () => void;
}

const KEYPAD_KEYS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

export const DialerView: React.FC<DialerViewProps> = ({
  contacts,
  calls,
  recordings,
  preferences,
  googleLinked,
  onUpdatePreferences,
  onStartCall,
  onSaveNumber,
  onDeleteRecording,
  onClearCalls,
}) => {
  const [dialedNumber, setDialedNumber] = useState('');
  const [mobileSection, setMobileSection] = useState<'keypad' | 'recents' | 'recordings'>('keypad');
  const [rightPanelTab, setRightPanelTab] = useState<'recordings' | 'recents'>('recordings');

  // Save Number Modal
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savePhone, setSavePhone] = useState('');
  const [saveEmail, setSaveEmail] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [alsoSaveToGoogle, setAlsoSaveToGoogle] = useState(false);

  // Audio Playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const matchedContacts = searchT9Contacts(dialedNumber, contacts);
  const topMatch = matchedContacts[0] || null;

  const handleDigitPress = (digit: string) => {
    if (preferences.keypadSound) {
      dialerAudio.playDtmf(digit);
    }
    setDialedNumber((prev) => (prev.length < 20 ? prev + digit : prev));
  };

  const handleBackspace = () => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const handleCallPress = () => {
    if (!dialedNumber.trim()) {
      if (calls[0]) {
        setDialedNumber(calls[0].phone);
      }
      return;
    }

    const exact = contacts.find(
      (c) => c.phone.replace(/\D/g, '') === dialedNumber.replace(/\D/g, '')
    );

    onStartCall({
      name: exact?.name || dialedNumber,
      phone: exact?.phone || dialedNumber,
      contactId: exact?.id,
    });
  };

  const openSaveNumberModal = (phoneValue: string) => {
    setSavePhone(phoneValue);
    setSaveName('');
    setSaveEmail('');
    setSaveNotes('');
    setAlsoSaveToGoogle(false);
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim() || !savePhone.trim()) return;
    onSaveNumber(
      {
        name: saveName.trim(),
        phone: savePhone.trim(),
        email: saveEmail.trim(),
        notes: saveNotes.trim(),
      },
      alsoSaveToGoogle
    );
    setIsSaveModalOpen(false);
  };

  const handleTogglePlay = (rec: CallRecording) => {
    if (playingId === rec.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (rec.audioDataUrl) {
      const audio = new Audio(rec.audioDataUrl);
      audio.onended = () => setPlayingId(null);
      audio.play().catch(() => setPlayingId(null));
      audioRef.current = audio;
      setPlayingId(rec.id);
    } else {
      // Sample recordings without raw audio blob simulate clean playback timer
      setPlayingId(rec.id);
      window.setTimeout(() => {
        setPlayingId((current) => (current === rec.id ? null : current));
      }, 3000);
    }
  };

  const handleDownloadRecording = (rec: CallRecording) => {
    if (rec.audioDataUrl) {
      const a = document.createElement('a');
      a.href = rec.audioDataUrl;
      a.download = `${rec.name.replace(/\s+/g, '_')}_recording.webm`;
      a.click();
    } else {
      const content = `CM Dialer Recording\nContact: ${rec.name}\nPhone: ${rec.phone}\nTime: ${rec.timestamp}\nDuration: ${formatDuration(rec.durationSeconds)}\nMode: ${rec.silentRecorded ? 'Without announcement' : 'Standard'}\nNote: ${rec.note || 'None'}\n`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rec.name.replace(/\s+/g, '_')}_recording_log.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderRecordingsList = () => (
    <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
      {recordings.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-slate-900 mb-1">No recordings yet</p>
          <p className="text-sm text-slate-500">
            Recorded calls are saved locally on this device.
          </p>
        </div>
      ) : (
        recordings.map((rec) => {
          const isPlaying = playingId === rec.id;
          return (
            <div key={rec.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleTogglePlay(rec)}
                  aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    isPlaying
                      ? 'bg-ocean-700 text-white'
                      : 'bg-ocean-50 text-ocean-700 hover:bg-ocean-100'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {rec.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {rec.timestamp} · <span className="font-mono-num">{formatDuration(rec.durationSeconds)}</span>
                    {rec.silentRecorded ? ' · No announcement' : ''}
                  </p>
                  {rec.note && (
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {rec.note}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadRecording(rec)}
                  aria-label="Download recording"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-ocean-700 hover:bg-ocean-50 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRecording(rec.id)}
                  aria-label="Delete recording"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderRecentsList = () => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {calls.length > 0 && (
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            {calls.length} recent calls
          </span>
          <button
            type="button"
            onClick={onClearCalls}
            className="text-xs font-medium text-ocean-700 hover:text-ocean-800 cursor-pointer"
          >
            Clear History
          </button>
        </div>
      )}

      {calls.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-slate-900 mb-1">No recent calls</p>
          <p className="text-sm text-slate-500">Calls placed from this device appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {calls.map((call) => {
            const isSaved = contacts.some(
              (c) => c.phone.replace(/\D/g, '') === call.phone.replace(/\D/g, '')
            );
            return (
              <div
                key={call.id}
                className="px-4 py-3 flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    {call.type === 'incoming' && <PhoneIncoming className="w-3.5 h-3.5" />}
                    {call.type === 'outgoing' && <PhoneOutgoing className="w-3.5 h-3.5 text-ocean-700" />}
                    {call.type === 'missed' && <PhoneMissed className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {call.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {call.type === 'missed'
                        ? 'Missed'
                        : call.type === 'incoming'
                        ? 'Incoming'
                        : 'Outgoing'}{' '}
                      · {call.timeFormatted}
                      {call.durationSeconds > 0
                        ? ` · ${formatDuration(call.durationSeconds)}`
                        : ''}
                      {call.recorded ? ' · Recorded' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  {!isSaved && (
                    <button
                      type="button"
                      onClick={() => openSaveNumberModal(call.phone)}
                      aria-label={`Save ${call.phone}`}
                      title="Save Number"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-ocean-700 hover:bg-ocean-50 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      onStartCall({
                        name: call.name,
                        phone: call.phone,
                        contactId: call.contactId,
                      })
                    }
                    aria-label={`Call ${call.name}`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-ocean-700 hover:bg-ocean-50 transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header + Mobile Sub-Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dialer</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {preferences.autoRecordCalls
              ? preferences.silentRecordingNoAnnouncement
                ? 'Auto-recording enabled · Without announcement'
                : 'Auto-recording enabled'
              : 'Standard calling mode'}
          </p>
        </div>

        {/* Mobile Segmented Switch */}
        <div className="lg:hidden inline-flex w-fit items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {(
            [
              { id: 'keypad', label: 'Keypad' },
              { id: 'recordings', label: 'Recordings' },
              { id: 'recents', label: 'Recents' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMobileSection(item.id)}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                mobileSection === item.id
                  ? 'bg-white text-ocean-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Keypad Card */}
        <div
          className={`lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 ${
            mobileSection !== 'keypad' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Recording Controls (Compact Width Ocean Blue Toggles) */}
          <div className="flex flex-wrap items-center justify-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <button
              type="button"
              onClick={() =>
                onUpdatePreferences({ autoRecordCalls: !preferences.autoRecordCalls })
              }
              className={`h-8 px-2.5 rounded-lg border inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                preferences.autoRecordCalls
                  ? 'bg-ocean-50 border-ocean-200 text-ocean-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <Circle
                className={`w-3 h-3 shrink-0 ${
                  preferences.autoRecordCalls ? 'fill-current' : ''
                }`}
              />
              <span className="text-xs font-medium">
                Record · {preferences.autoRecordCalls ? 'On' : 'Off'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onUpdatePreferences({
                  silentRecordingNoAnnouncement:
                    !preferences.silentRecordingNoAnnouncement,
                })
              }
              className={`h-8 px-2.5 rounded-lg border inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                preferences.silentRecordingNoAnnouncement
                  ? 'bg-ocean-50 border-ocean-200 text-ocean-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <VolumeX className="w-3 h-3 shrink-0" />
              <span className="text-xs font-medium">
                Silent · {preferences.silentRecordingNoAnnouncement ? 'On' : 'Off'}
              </span>
            </button>
          </div>

          {/* Number Display & Save Number CTA */}
          <div className="min-h-[72px] flex flex-col items-center justify-center mb-4">
            <div className="w-full flex items-center justify-center gap-2">
              <input
                type="tel"
                value={dialedNumber}
                onChange={(e) => setDialedNumber(e.target.value)}
                placeholder="Enter number"
                aria-label="Phone number"
                className="w-full text-center text-2xl sm:text-3xl font-mono-num font-medium text-slate-900 placeholder:text-slate-300 bg-transparent focus:outline-none tracking-tight"
              />
            </div>

            <div className="mt-1.5 h-7 flex items-center justify-center gap-3">
              {topMatch ? (
                <button
                  type="button"
                  onClick={() => setDialedNumber(topMatch.phone)}
                  className="text-xs font-medium text-ocean-700 hover:underline cursor-pointer"
                >
                  {topMatch.name} · {topMatch.phone}
                </button>
              ) : dialedNumber.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => openSaveNumberModal(dialedNumber)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-ocean-700 hover:text-ocean-800 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Save Number</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* 3x4 Keypad Grid (Reduced Button Width) */}
          <div className="grid grid-cols-3 gap-2 max-w-[232px] mx-auto mb-5">
            {KEYPAD_KEYS.map((key) => (
              <button
                key={key.digit}
                type="button"
                onClick={() => handleDigitPress(key.digit)}
                className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200/80 flex flex-col items-center justify-center transition-all cursor-pointer select-none"
              >
                <span className="text-xl font-mono-num font-medium text-slate-900 leading-none">
                  {key.digit}
                </span>
                {key.letters && (
                  <span className="text-[9px] font-medium tracking-widest text-slate-400 mt-0.5">
                    {key.letters}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Primary Call & Utility Row */}
          <div className="max-w-[232px] mx-auto grid grid-cols-3 items-center gap-2">
            <div className="flex justify-center">
              {dialedNumber.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => openSaveNumberModal(dialedNumber)}
                  aria-label="Save number"
                  title="Save Number"
                  className="w-9 h-9 rounded-xl border border-slate-200 text-slate-700 hover:text-ocean-700 hover:border-ocean-200 hover:bg-ocean-50 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleCallPress}
                aria-label="Place call"
                className="w-12 h-12 rounded-full bg-ocean-700 hover:bg-ocean-800 active:scale-95 text-white flex items-center justify-center shadow-sm transition-all cursor-pointer"
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center">
              {dialedNumber.length > 0 && (
                <button
                  type="button"
                  onClick={handleBackspace}
                  onDoubleClick={() => setDialedNumber('')}
                  aria-label="Delete digit"
                  className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Delete className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Side Panel (Recordings & Recents) + Mobile Views */}
        <div
          className={`lg:col-span-6 space-y-4 ${
            mobileSection === 'keypad' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Desktop Switch between Recordings & Recents */}
          <div className="hidden lg:inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRightPanelTab('recordings')}
              className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                rightPanelTab === 'recordings'
                  ? 'bg-white text-ocean-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recordings ({recordings.length})
            </button>
            <button
              type="button"
              onClick={() => setRightPanelTab('recents')}
              className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                rightPanelTab === 'recents'
                  ? 'bg-white text-ocean-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recents ({calls.length})
            </button>
          </div>

          <div className="hidden lg:block">
            {rightPanelTab === 'recordings'
              ? renderRecordingsList()
              : renderRecentsList()}
          </div>

          <div className="lg:hidden">
            {mobileSection === 'recordings'
              ? renderRecordingsList()
              : renderRecentsList()}
          </div>
        </div>
      </div>

      {/* Save Number Modal */}
      {isSaveModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">Save Number</h3>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                aria-label="Close"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveNumber} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Contact name"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={savePhone}
                  onChange={(e) => setSavePhone(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 font-mono-num text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={saveEmail}
                  onChange={(e) => setSaveEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  placeholder="Short note..."
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
                />
              </div>

              {googleLinked && (
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoSaveToGoogle}
                    onChange={(e) => setAlsoSaveToGoogle(e.target.checked)}
                    className="w-4 h-4 accent-ocean-700 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">
                    Also save to linked Google Contacts
                  </span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="h-9 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-3.5 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-xs font-medium text-white cursor-pointer"
                >
                  Save to Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

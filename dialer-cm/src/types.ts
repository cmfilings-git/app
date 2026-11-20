export type NavigationTab = 'contacts' | 'dialer' | 'task' | 'menu';

export type MenuSection =
  | 'root'
  | 'preference'
  | 'settings'
  | 'app-info'
  | 'more-tools'
  | 'support';

export type ContactActionChannel = 'call' | 'whatsapp' | 'email';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  source: 'local' | 'google';
  googleResourceName?: string;
  createdAt: string;
}

export type CallType = 'incoming' | 'outgoing' | 'missed';

export interface CallRecord {
  id: string;
  contactId?: string;
  name: string;
  phone: string;
  type: CallType;
  timestamp: string;
  timeFormatted: string;
  durationSeconds: number;
  recorded: boolean;
  silentRecording: boolean;
  recordingId?: string;
}

export interface CallRecording {
  id: string;
  callId?: string;
  name: string;
  phone: string;
  timestamp: string;
  durationSeconds: number;
  silentRecorded: boolean;
  audioDataUrl?: string;
  note?: string;
}

export type TaskReminderType = 'call' | 'whatsapp';

export interface TaskReminder {
  id: string;
  type: TaskReminderType;
  contactId?: string;
  contactName: string;
  phone: string;
  scheduledTime: string;
  message: string;
  note?: string;
  completed: boolean;
  createdAt: string;
}

export interface MessagePreset {
  id: string;
  type: TaskReminderType;
  title: string;
  text: string;
}

export interface AppPreferences {
  keypadSound: boolean;
  autoRecordCalls: boolean;
  silentRecordingNoAnnouncement: boolean;
  defaultCountryCode: string;
  storageMode: 'local' | 'google-linked';
  googleAccountEmail?: string;
  lastGoogleSync?: string;
}

export interface ActiveCallState {
  status: 'ringing' | 'connected';
  contact: {
    id?: string;
    name: string;
    phone: string;
  };
  duration: number;
  isMuted: boolean;
  isSpeaker: boolean;
  isHold: boolean;
  isRecording: boolean;
  silentRecording: boolean;
  callNote: string;
}

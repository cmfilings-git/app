import {
  Contact,
  CallRecord,
  CallRecording,
  TaskReminder,
  MessagePreset,
  AppPreferences,
} from '../types';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c-1',
    name: 'Elena Rostova',
    phone: '+1 (415) 882-9014',
    email: 'elena.rostova@corebiq.com',
    company: 'CoreBIQ Engineering',
    notes: 'Discuss Q4 analytics dashboard rollout and client onboarding timeline.',
    source: 'local',
    createdAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'c-2',
    name: 'Marcus Vance',
    phone: '+1 (415) 309-8871',
    email: 'marcus.vance@corebiq.com',
    company: 'CoreBIQ Product',
    notes: 'Needs updated proposal sent by email before Friday review.',
    source: 'local',
    createdAt: '2026-10-02T11:30:00Z',
  },
  {
    id: 'c-3',
    name: 'Dr. Sarah Lin',
    phone: '+1 (650) 492-7715',
    email: 'sarah.lin@bayhealth.org',
    company: 'Bay Health Institute',
    notes: 'Prefers WhatsApp reminders 30 minutes before scheduled calls.',
    source: 'local',
    createdAt: '2026-10-04T14:15:00Z',
  },
  {
    id: 'c-4',
    name: 'Alexander Sterling',
    phone: '+1 (212) 677-4022',
    email: 'a.sterling@apexpartners.vc',
    company: 'Apex Partners',
    notes: 'Quarterly KPI briefing and partnership follow-up.',
    source: 'local',
    createdAt: '2026-10-05T16:45:00Z',
  },
  {
    id: 'c-5',
    name: 'Chloe Dubois',
    phone: '+33 1 42 68 55 00',
    email: 'chloe@atelierdubois.fr',
    company: 'Atelier Dubois',
    notes: 'Brand guidelines and reporting template feedback.',
    source: 'local',
    createdAt: '2026-10-08T10:20:00Z',
  },
  {
    id: 'c-6',
    name: 'Kenji Takahashi',
    phone: '+81 3 5555 0148',
    email: 'k.takahashi@neocloud.jp',
    company: 'Neo Cloud Tokyo',
    notes: 'APAC account review call next Tuesday.',
    source: 'local',
    createdAt: '2026-10-10T08:00:00Z',
  },
];

export const INITIAL_CALL_RECORDS: CallRecord[] = [
  {
    id: 'call-1',
    contactId: 'c-1',
    name: 'Elena Rostova',
    phone: '+1 (415) 882-9014',
    type: 'outgoing',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    timeFormatted: '35m ago',
    durationSeconds: 245,
    recorded: true,
    silentRecording: true,
    recordingId: 'rec-1',
  },
  {
    id: 'call-2',
    contactId: 'c-2',
    name: 'Marcus Vance',
    phone: '+1 (415) 309-8871',
    type: 'incoming',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    timeFormatted: '3h ago',
    durationSeconds: 184,
    recorded: true,
    silentRecording: true,
    recordingId: 'rec-2',
  },
  {
    id: 'call-3',
    name: '+1 (917) 555-0143',
    phone: '+1 (917) 555-0143',
    type: 'missed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    timeFormatted: 'Yesterday',
    durationSeconds: 0,
    recorded: false,
    silentRecording: true,
  },
];

export const INITIAL_RECORDINGS: CallRecording[] = [
  {
    id: 'rec-1',
    callId: 'call-1',
    name: 'Elena Rostova',
    phone: '+1 (415) 882-9014',
    timestamp: 'Today, 11:20 AM',
    durationSeconds: 245,
    silentRecorded: true,
    note: 'Q4 dashboard milestones confirmed.',
  },
  {
    id: 'rec-2',
    callId: 'call-2',
    name: 'Marcus Vance',
    phone: '+1 (415) 309-8871',
    timestamp: 'Yesterday, 4:10 PM',
    durationSeconds: 184,
    silentRecorded: true,
    note: 'Pricing deck revisions agreed.',
  },
];

export const INITIAL_PRESETS: MessagePreset[] = [
  {
    id: 'preset-1',
    type: 'whatsapp',
    title: 'Quick Follow-up',
    text: 'Hi, following up on our recent conversation. Let me know a convenient time to connect.',
  },
  {
    id: 'preset-2',
    type: 'whatsapp',
    title: 'Missed Call Reply',
    text: 'Sorry I missed your call. I am tied up briefly and will call you right back.',
  },
  {
    id: 'preset-3',
    type: 'whatsapp',
    title: 'Send Proposal',
    text: 'Sharing the updated proposal and summary details as discussed. Please review when free.',
  },
  {
    id: 'preset-4',
    type: 'call',
    title: 'Check-in Call',
    text: 'Confirm project status, next steps, and any open blockers.',
  },
  {
    id: 'preset-5',
    type: 'call',
    title: 'Payment / Invoice Follow-up',
    text: 'Verify invoice receipt and confirm settlement timeline.',
  },
];

export const INITIAL_TASKS: TaskReminder[] = [
  {
    id: 'task-1',
    type: 'whatsapp',
    contactId: 'c-1',
    contactName: 'Elena Rostova',
    phone: '+1 (415) 882-9014',
    scheduledTime: 'Today, 5:00 PM',
    message: 'Hi, following up on our recent conversation. Let me know a convenient time to connect.',
    note: 'Share final BI report link.',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    type: 'call',
    contactId: 'c-4',
    contactName: 'Alexander Sterling',
    phone: '+1 (212) 677-4022',
    scheduledTime: 'Tomorrow, 10:30 AM',
    message: 'Confirm project status, next steps, and any open blockers.',
    note: 'Quarterly KPI briefing call.',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_PREFERENCES: AppPreferences = {
  keypadSound: true,
  autoRecordCalls: true,
  silentRecordingNoAnnouncement: true,
  defaultCountryCode: '+1',
  storageMode: 'local',
};

export const T9_KEYPAD_MAP: Record<string, string> = {
  '1': '',
  '2': 'abc',
  '3': 'def',
  '4': 'ghi',
  '5': 'jkl',
  '6': 'mno',
  '7': 'pqrs',
  '8': 'tuv',
  '9': 'wxyz',
  '0': '+',
  '*': '',
  '#': '',
};

export function searchT9Contacts(queryDigits: string, contacts: Contact[]): Contact[] {
  const cleanDigits = queryDigits.replace(/[^0-9]/g, '');
  if (!cleanDigits) return [];

  return contacts.filter((contact) => {
    const rawPhone = contact.phone.replace(/[^0-9]/g, '');
    if (rawPhone.includes(cleanDigits)) return true;

    const nameToDigits = contact.name
      .toLowerCase()
      .split('')
      .map((char) => {
        for (const [digit, letters] of Object.entries(T9_KEYPAD_MAP)) {
          if (letters.includes(char)) return digit;
        }
        return '';
      })
      .join('');

    return nameToDigits.includes(cleanDigits);
  });
}

export function cleanPhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '#';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

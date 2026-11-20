import React, { useState, useEffect, useRef } from 'react';
import {
  Contact,
  CallRecord,
  CallRecording,
  TaskReminder,
  MessagePreset,
  AppPreferences,
  ActiveCallState,
  NavigationTab,
  MenuSection,
} from './types';
import {
  INITIAL_CONTACTS,
  INITIAL_CALL_RECORDS,
  INITIAL_RECORDINGS,
  INITIAL_TASKS,
  INITIAL_PRESETS,
  INITIAL_PREFERENCES,
} from './data/initialData';
import { dialerAudio } from './utils/audio';
import {
  connectGoogleContacts,
  fetchGoogleContacts,
  createGoogleContact,
  disconnectGoogleContacts,
  getCachedGoogleToken,
} from './utils/googleContacts';
import { downloadJsonFile, parseContactsFile } from './utils/localBackup';
import { BottomNav } from './components/BottomNav';
import { ContactsView } from './components/ContactsView';
import { DialerView } from './components/DialerView';
import { TasksView } from './components/TasksView';
import { MenuView } from './components/MenuView';
import { InCallOverlay } from './components/InCallOverlay';
import { ConfirmDialog } from './components/ConfirmDialog';

const STORAGE_KEYS = {
  contacts: 'cm_dialer_local_contacts_v3',
  calls: 'cm_dialer_local_calls_v3',
  recordings: 'cm_dialer_local_recordings_v3',
  tasks: 'cm_dialer_local_tasks_v3',
  presets: 'cm_dialer_local_presets_v3',
  preferences: 'cm_dialer_local_prefs_v3',
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or restricted
  }
}

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>(() =>
    readLocal(STORAGE_KEYS.contacts, INITIAL_CONTACTS)
  );
  const [calls, setCalls] = useState<CallRecord[]>(() =>
    readLocal(STORAGE_KEYS.calls, INITIAL_CALL_RECORDS)
  );
  const [recordings, setRecordings] = useState<CallRecording[]>(() =>
    readLocal(STORAGE_KEYS.recordings, INITIAL_RECORDINGS)
  );
  const [tasks, setTasks] = useState<TaskReminder[]>(() =>
    readLocal(STORAGE_KEYS.tasks, INITIAL_TASKS)
  );
  const [presets, setPresets] = useState<MessagePreset[]>(() =>
    readLocal(STORAGE_KEYS.presets, INITIAL_PRESETS)
  );
  const [preferences, setPreferences] = useState<AppPreferences>(() =>
    readLocal(STORAGE_KEYS.preferences, INITIAL_PREFERENCES)
  );

  // Navigation
  const [activeTab, setActiveTab] = useState<NavigationTab>('dialer');
  const [menuSection, setMenuSection] = useState<MenuSection>('root');

  // Active call
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const callTimerRef = useRef<number | null>(null);
  const connectTimeoutRef = useRef<number | null>(null);

  // Google Contacts session state (token lives strictly in memory)
  const [googleLinked, setGoogleLinked] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [googleFeedback, setGoogleFeedback] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    onConfirm: () => {},
  });

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  };

  // Persist every dataset locally on this device
  useEffect(() => writeLocal(STORAGE_KEYS.contacts, contacts), [contacts]);
  useEffect(() => writeLocal(STORAGE_KEYS.calls, calls), [calls]);
  useEffect(() => writeLocal(STORAGE_KEYS.recordings, recordings), [recordings]);
  useEffect(() => writeLocal(STORAGE_KEYS.tasks, tasks), [tasks]);
  useEffect(() => writeLocal(STORAGE_KEYS.presets, presets), [presets]);
  useEffect(() => {
    writeLocal(STORAGE_KEYS.preferences, preferences);
    dialerAudio.setSoundEnabled(preferences.keypadSound);
  }, [preferences]);

  // Active call duration timer
  useEffect(() => {
    if (activeCall && activeCall.status === 'connected' && !activeCall.isHold) {
      callTimerRef.current = window.setInterval(() => {
        setActiveCall((prev) =>
          prev ? { ...prev, duration: prev.duration + 1 } : null
        );
      }, 1000);
    } else if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [activeCall?.status, activeCall?.isHold]);

  useEffect(() => {
    return () => {
      dialerAudio.stopRingback();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // CALL FLOW
  const handleStartCall = (target: {
    name: string;
    phone: string;
    contactId?: string;
  }) => {
    dialerAudio.startRingback();

    setActiveCall({
      status: 'ringing',
      contact: {
        id: target.contactId,
        name: target.name,
        phone: target.phone,
      },
      duration: 0,
      isMuted: false,
      isSpeaker: false,
      isHold: false,
      isRecording: preferences.autoRecordCalls,
      silentRecording: preferences.silentRecordingNoAnnouncement,
      callNote: '',
    });

    connectTimeoutRef.current = window.setTimeout(() => {
      dialerAudio.stopRingback();
      // Only play connected chime when announcement/sound is allowed; silent mode keeps recording unannounced
      if (!preferences.silentRecordingNoAnnouncement) {
        dialerAudio.playConnectedChime();
      }
      setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
    }, 1800);
  };

  const handleEndCall = (recordedAudioDataUrl?: string) => {
    dialerAudio.stopRingback();
    dialerAudio.playHangupTone();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);

    if (activeCall) {
      const callId = `call-${Date.now()}`;
      const shouldSaveRecording =
        activeCall.isRecording && activeCall.status === 'connected';
      const recordingId = shouldSaveRecording ? `rec-${Date.now()}` : undefined;

      const newCall: CallRecord = {
        id: callId,
        contactId: activeCall.contact.id,
        name: activeCall.contact.name,
        phone: activeCall.contact.phone,
        type: 'outgoing',
        timestamp: new Date().toISOString(),
        timeFormatted: 'Just now',
        durationSeconds: activeCall.duration,
        recorded: shouldSaveRecording,
        silentRecording: activeCall.silentRecording,
        recordingId,
      };
      setCalls((prev) => [newCall, ...prev]);

      if (shouldSaveRecording && recordingId) {
        const nowTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        const newRecording: CallRecording = {
          id: recordingId,
          callId,
          name: activeCall.contact.name,
          phone: activeCall.contact.phone,
          timestamp: `Today, ${nowTime}`,
          durationSeconds: Math.max(activeCall.duration, 1),
          silentRecorded: activeCall.silentRecording,
          audioDataUrl: recordedAudioDataUrl,
          note: activeCall.callNote.trim() || undefined,
        };
        setRecordings((prev) => [newRecording, ...prev]);
        showToast('Call recording saved locally');
      }
    }

    setActiveCall(null);
  };

  // CONTACTS ACTIONS
  const mergeImportedContacts = (incoming: Contact[]) => {
    setContacts((prev) => {
      const existingPhones = new Set(
        prev.map((c) => c.phone.replace(/\D/g, '')).filter(Boolean)
      );
      const existingGoogleIds = new Set(
        prev.map((c) => c.googleResourceName).filter(Boolean)
      );

      const additions = incoming.filter((item) => {
        const cleanNum = item.phone.replace(/\D/g, '');
        if (item.googleResourceName && existingGoogleIds.has(item.googleResourceName)) {
          return false;
        }
        if (cleanNum && existingPhones.has(cleanNum)) {
          return false;
        }
        return true;
      });

      return [...additions, ...prev];
    });
  };

  const handleAddContact = (
    data: {
      name: string;
      phone: string;
      email?: string;
      company?: string;
      notes?: string;
    },
    saveToGoogle: boolean
  ) => {
    const newLocalContact: Contact = {
      id: `c-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      company: data.company || '',
      notes: data.notes || '',
      source: 'local',
      createdAt: new Date().toISOString(),
    };

    if (saveToGoogle && googleLinked) {
      setConfirmState({
        isOpen: true,
        title: 'Save Contact to Google Contacts?',
        description: `Save "${data.name}" (${data.phone}) locally on this device and also create this contact in your linked Google Contacts account?`,
        confirmLabel: 'Save to Device & Google',
        onConfirm: async () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          const token = getCachedGoogleToken();
          if (!token) {
            setContacts((prev) => [newLocalContact, ...prev]);
            showToast('Saved locally (reconnect Google to sync)');
            return;
          }
          try {
            const created = await createGoogleContact(token, data);
            setContacts((prev) => [
              {
                ...newLocalContact,
                source: 'google',
                googleResourceName: created.resourceName,
              },
              ...prev,
            ]);
            showToast('Saved to device & Google Contacts');
          } catch (err) {
            setContacts((prev) => [newLocalContact, ...prev]);
            showToast(
              err instanceof Error
                ? `Saved locally · ${err.message}`
                : 'Saved locally'
            );
          }
        },
      });
      return;
    }

    setContacts((prev) => [newLocalContact, ...prev]);
    showToast('Saved to device');
  };

  const handleUpdateContact = (updated: Contact) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteContact = (id: string) => {
    const target = contacts.find((c) => c.id === id);
    if (!target) return;
    setConfirmState({
      isOpen: true,
      title: 'Delete Contact?',
      description: `Remove "${target.name}" from this device? This removes the local copy only.`,
      confirmLabel: 'Delete',
      onConfirm: () => {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast('Contact removed');
      },
    });
  };

  // TASKS & PRESETS ACTIONS
  const handleAddTask = (
    taskData: Omit<TaskReminder, 'id' | 'createdAt' | 'completed'>
  ) => {
    const newTask: TaskReminder = {
      ...taskData,
      id: `task-${Date.now()}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    showToast('Reminder saved locally');
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddPreset = (presetData: Omit<MessagePreset, 'id'>) => {
    setPresets((prev) => [{ ...presetData, id: `preset-${Date.now()}` }, ...prev]);
    showToast('Preset added');
  };

  const handleDeletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  // RECORDINGS & RECENTS ACTIONS
  const handleDeleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    showToast('Recording deleted');
  };

  const handleClearCalls = () => {
    setConfirmState({
      isOpen: true,
      title: 'Clear Call History?',
      description: 'Remove all recent call records stored locally on this device?',
      confirmLabel: 'Clear History',
      onConfirm: () => {
        setCalls([]);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast('Call history cleared');
      },
    });
  };

  // GOOGLE CONTACTS CLIENT-SIDE SYNC (NO CLOUD DB)
  const handleConnectGoogle = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    setGoogleFeedback(null);

    try {
      const { accessToken, email } = await connectGoogleContacts();
      const imported = await fetchGoogleContacts(accessToken);
      mergeImportedContacts(imported);

      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setGoogleLinked(true);
      setPreferences((prev) => ({
        ...prev,
        storageMode: 'google-linked',
        googleAccountEmail: email,
        lastGoogleSync: `Today, ${nowStr}`,
      }));
      setGoogleFeedback(
        `Connected ${email} · Imported ${imported.length} Google contacts into local device storage.`
      );
      showToast(`Linked ${imported.length} Google contacts`);
    } catch (err) {
      setGoogleError(
        err instanceof Error
          ? err.message
          : 'Could not connect Google Contacts. You can also import a CSV or vCard file.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSyncGoogle = async () => {
    const token = getCachedGoogleToken();
    if (!token) {
      await handleConnectGoogle();
      return;
    }

    setGoogleLoading(true);
    setGoogleError(null);
    setGoogleFeedback(null);

    try {
      const imported = await fetchGoogleContacts(token);
      mergeImportedContacts(imported);
      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setPreferences((prev) => ({
        ...prev,
        lastGoogleSync: `Today, ${nowStr}`,
      }));
      setGoogleFeedback(`Synced ${imported.length} contacts from Google into local storage.`);
      showToast('Google Contacts synced');
    } catch (err) {
      setGoogleError(
        err instanceof Error ? err.message : 'Sync failed. Please reconnect Google.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = () => {
    disconnectGoogleContacts();
    setGoogleLinked(false);
    setGoogleFeedback('Disconnected Google account. Existing contacts remain saved locally.');
    setGoogleError(null);
    setPreferences((prev) => ({
      ...prev,
      storageMode: 'local',
      googleAccountEmail: undefined,
    }));
  };

  // LOCAL BACKUP & CSV/VCF IMPORT
  const handleExportLocalBackup = () => {
    downloadJsonFile(`cm-dialer-backup-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      contacts,
      calls,
      recordings,
      tasks,
      presets,
      preferences,
    });
    showToast('Local backup downloaded');
  };

  const handleImportLocalBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.contacts)) setContacts(parsed.contacts);
      if (Array.isArray(parsed.calls)) setCalls(parsed.calls);
      if (Array.isArray(parsed.recordings)) setRecordings(parsed.recordings);
      if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
      if (Array.isArray(parsed.presets)) setPresets(parsed.presets);
      if (parsed.preferences && typeof parsed.preferences === 'object') {
        setPreferences((prev) => ({ ...prev, ...parsed.preferences }));
      }
      showToast('Local backup restored');
    } catch {
      setGoogleError('Invalid backup file. Please select a valid CM Dialer JSON backup.');
    }
  };

  const handleImportContactsFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseContactsFile(file.name, text);
      if (parsed.length === 0) {
        setGoogleError('No valid contacts were found in that file.');
        return;
      }
      mergeImportedContacts(parsed);
      setGoogleError(null);
      setGoogleFeedback(`Imported ${parsed.length} contacts from ${file.name} to local storage.`);
      showToast(`Imported ${parsed.length} contacts`);
    } catch {
      setGoogleError('Unable to read that contact file.');
    }
  };

  const handleRequestResetData = () => {
    setConfirmState({
      isOpen: true,
      title: 'Reset All Local Data?',
      description:
        'This restores sample defaults and clears local contacts, tasks, recordings, and call history saved on this device.',
      confirmLabel: 'Reset Local Data',
      onConfirm: () => {
        Object.values(STORAGE_KEYS).forEach((k) => {
          try {
            localStorage.removeItem(k);
          } catch {
            // ignore
          }
        });
        setContacts(INITIAL_CONTACTS);
        setCalls(INITIAL_CALL_RECORDS);
        setRecordings(INITIAL_RECORDINGS);
        setTasks(INITIAL_TASKS);
        setPresets(INITIAL_PRESETS);
        setPreferences(INITIAL_PREFERENCES);
        disconnectGoogleContacts();
        setGoogleLinked(false);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast('Local device data reset');
      },
    });
  };

  const pendingTaskCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Minimal Clean Top Header */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto h-full px-5 sm:px-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('dialer')}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            CM <span className="text-ocean-700">Dialer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('menu');
              setMenuSection('settings');
            }}
            className="text-xs font-medium text-slate-600 hover:text-ocean-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {googleLinked ? 'Local · Google Linked' : 'Local Storage'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 pt-6 pb-28">
        {activeTab === 'contacts' && (
          <ContactsView
            contacts={contacts}
            tasks={tasks}
            presets={presets}
            googleLinked={googleLinked}
            onStartCall={handleStartCall}
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onOpenGoogleSettings={() => {
              setActiveTab('menu');
              setMenuSection('settings');
            }}
          />
        )}

        {activeTab === 'dialer' && (
          <DialerView
            contacts={contacts}
            calls={calls}
            recordings={recordings}
            preferences={preferences}
            googleLinked={googleLinked}
            onUpdatePreferences={(patch) =>
              setPreferences((prev) => ({ ...prev, ...patch }))
            }
            onStartCall={handleStartCall}
            onSaveNumber={handleAddContact}
            onDeleteRecording={handleDeleteRecording}
            onClearCalls={handleClearCalls}
          />
        )}

        {activeTab === 'task' && (
          <TasksView
            contacts={contacts}
            tasks={tasks}
            presets={presets}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onAddPreset={handleAddPreset}
            onDeletePreset={handleDeletePreset}
            onStartCall={handleStartCall}
          />
        )}

        {activeTab === 'menu' && (
          <MenuView
            activeSection={menuSection}
            onSelectSection={setMenuSection}
            preferences={preferences}
            onUpdatePreferences={(patch) =>
              setPreferences((prev) => ({ ...prev, ...patch }))
            }
            counts={{
              contacts: contacts.length,
              tasks: tasks.length,
              recordings: recordings.length,
              calls: calls.length,
            }}
            googleLinked={googleLinked}
            googleLoading={googleLoading}
            googleFeedback={googleFeedback}
            googleError={googleError}
            onConnectGoogle={handleConnectGoogle}
            onSyncGoogle={handleSyncGoogle}
            onDisconnectGoogle={handleDisconnectGoogle}
            onExportLocalBackup={handleExportLocalBackup}
            onImportLocalBackup={handleImportLocalBackup}
            onImportContactsFile={handleImportContactsFile}
            onRequestResetData={handleRequestResetData}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      {!activeCall && (
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'menu') setMenuSection('root');
          }}
          pendingTaskCount={pendingTaskCount}
        />
      )}

      {/* Active Call Fullscreen Overlay */}
      {activeCall && (
        <InCallOverlay
          call={activeCall}
          onToggleMute={() =>
            setActiveCall((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null))
          }
          onToggleSpeaker={() =>
            setActiveCall((prev) =>
              prev ? { ...prev, isSpeaker: !prev.isSpeaker } : null
            )
          }
          onToggleHold={() =>
            setActiveCall((prev) => (prev ? { ...prev, isHold: !prev.isHold } : null))
          }
          onToggleRecording={() =>
            setActiveCall((prev) =>
              prev ? { ...prev, isRecording: !prev.isRecording } : null
            )
          }
          onChangeNote={(note) =>
            setActiveCall((prev) => (prev ? { ...prev, callNote: note } : null))
          }
          onEndCall={handleEndCall}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Subtle 2-Color Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-lg whitespace-nowrap"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

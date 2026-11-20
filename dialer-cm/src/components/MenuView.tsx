import React, { useState, useRef } from 'react';
import {
  Sliders,
  Settings,
  Info,
  LayoutGrid,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  HardDrive,
  Send,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import { AppPreferences, MenuSection } from '../types';

interface MenuViewProps {
  activeSection: MenuSection;
  onSelectSection: (section: MenuSection) => void;
  preferences: AppPreferences;
  onUpdatePreferences: (patch: Partial<AppPreferences>) => void;
  counts: {
    contacts: number;
    tasks: number;
    recordings: number;
    calls: number;
  };
  googleLinked: boolean;
  googleLoading: boolean;
  googleFeedback: string | null;
  googleError: string | null;
  onConnectGoogle: () => void;
  onSyncGoogle: () => void;
  onDisconnectGoogle: () => void;
  onExportLocalBackup: () => void;
  onImportLocalBackup: (file: File) => void;
  onImportContactsFile: (file: File) => void;
  onRequestResetData: () => void;
}

const MENU_ITEMS: {
  id: Exclude<MenuSection, 'root'>;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'preference',
    label: 'Preference',
    subtitle: 'Dialer sound, silent recording & defaults',
    icon: <Sliders className="w-4 h-4" />,
  },
  {
    id: 'settings',
    label: 'Settings',
    subtitle: 'Local storage backup & Google Contacts link',
    icon: <Settings className="w-4 h-4" />,
  },
  {
    id: 'app-info',
    label: 'App Info',
    subtitle: 'Version, privacy & local device details',
    icon: <Info className="w-4 h-4" />,
  },
  {
    id: 'more-tools',
    label: 'More BI Tools by CM',
    subtitle: 'Analytics, CRM & business tools by CoreBIQ',
    icon: <LayoutGrid className="w-4 h-4" />,
  },
  {
    id: 'support',
    label: 'Support',
    subtitle: 'Contact team, help guide & feedback',
    icon: <HelpCircle className="w-4 h-4" />,
  },
];

const CM_BI_TOOLS = [
  {
    name: 'CoreBIQ Analytics',
    category: 'Business Intelligence',
    description: 'Real-time KPI dashboards, financial reporting, and automated executive summaries.',
    url: 'https://corebiq.com',
  },
  {
    name: 'CM Lead Tracker',
    category: 'Sales & Pipeline',
    description: 'Simple call-to-conversion pipeline tracking designed for field and inside sales teams.',
    url: 'https://dev.corebiq.com',
  },
  {
    name: 'CM Invoice & Billing',
    category: 'Finance',
    description: 'Fast GST/tax invoicing, payment reminders, and client ledger exports.',
    url: 'https://corebiq.com',
  },
  {
    name: 'CM Field Ops',
    category: 'Operations',
    description: 'Daily visit logs, team attendance, and lightweight operational checklists.',
    url: 'https://corebiq.com',
  },
];

export const MenuView: React.FC<MenuViewProps> = ({
  activeSection,
  onSelectSection,
  preferences,
  onUpdatePreferences,
  counts,
  googleLinked,
  googleLoading,
  googleFeedback,
  googleError,
  onConnectGoogle,
  onSyncGoogle,
  onDisconnectGoogle,
  onExportLocalBackup,
  onImportLocalBackup,
  onImportContactsFile,
  onRequestResetData,
}) => {
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const contactsFileInputRef = useRef<HTMLInputElement | null>(null);

  // Support Form state
  const [supportName, setSupportName] = useState('');
  const [supportTopic, setSupportTopic] = useState('General Help');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const desktopSection: Exclude<MenuSection, 'root'> =
    activeSection === 'root' ? 'preference' : activeSection;

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    const subject = encodeURIComponent(`CM Dialer Support — ${supportTopic}`);
    const body = encodeURIComponent(
      `Name: ${supportName || 'User'}\nTopic: ${supportTopic}\n\n${supportMessage}`
    );
    const link = document.createElement('a');
    link.href = `mailto:support@corebiq.com?subject=${subject}&body=${body}`;
    link.click();
    setSupportSent(true);
    setTimeout(() => setSupportSent(false), 3000);
  };

  const renderToggleRow = (
    title: string,
    description: string,
    checked: boolean,
    onToggle: () => void
  ) => (
    <div className="py-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
          checked ? 'bg-ocean-700' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  const renderSectionContent = (section: Exclude<MenuSection, 'root'>) => {
    switch (section) {
      case 'preference':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Preference</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Customize calling, tones, and silent recording behavior.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {renderToggleRow(
                'Auto-Record Calls',
                'Automatically record calls and save them locally on this device.',
                preferences.autoRecordCalls,
                () =>
                  onUpdatePreferences({
                    autoRecordCalls: !preferences.autoRecordCalls,
                  })
              )}
              {renderToggleRow(
                'Call Without Announcement',
                'Record silently with no voice prompt or announcement beep.',
                preferences.silentRecordingNoAnnouncement,
                () =>
                  onUpdatePreferences({
                    silentRecordingNoAnnouncement:
                      !preferences.silentRecordingNoAnnouncement,
                  })
              )}
              {renderToggleRow(
                'Keypad Tones',
                'Play crisp DTMF audio tones while pressing dialer keys.',
                preferences.keypadSound,
                () =>
                  onUpdatePreferences({ keypadSound: !preferences.keypadSound })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label
                htmlFor="country-code-input"
                className="block text-sm font-medium text-slate-900 mb-1.5"
              >
                Default Country Code
              </label>
              <input
                id="country-code-input"
                type="text"
                value={preferences.defaultCountryCode}
                onChange={(e) =>
                  onUpdatePreferences({ defaultCountryCode: e.target.value })
                }
                placeholder="+1"
                className="w-32 h-10 px-3.5 rounded-xl border border-slate-200 font-mono-num text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
              />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            {/* Local Storage Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Local Device Storage
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    All contacts, notes, tasks, and recordings stay saved on this device.
                  </p>
                </div>
                <HardDrive className="w-4 h-4 text-ocean-700 shrink-0 mt-1" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Contacts', value: counts.contacts },
                  { label: 'Tasks', value: counts.tasks },
                  { label: 'Recordings', value: counts.recordings },
                  { label: 'Recents', value: counts.calls },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <p className="text-xl font-semibold font-mono-num text-slate-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={onExportLocalBackup}
                  className="h-9 px-3 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Local Backup</span>
                </button>

                <button
                  type="button"
                  onClick={() => backupInputRef.current?.click()}
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore Backup</span>
                </button>

                <input
                  ref={backupInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImportLocalBackup(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            {/* Optional Link Google Contacts Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Link Google Contacts (Optional)
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Import contacts directly from Google Contacts into local storage, or upload a CSV/vCard file offline.
                </p>
              </div>

              {googleLinked ? (
                <div className="p-4 rounded-xl bg-ocean-50/70 border border-ocean-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {preferences.googleAccountEmail || 'Google Account Connected'}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Synced to local storage
                        {preferences.lastGoogleSync
                          ? ` · Last synced ${preferences.lastGoogleSync}`
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onDisconnectGoogle}
                      className="h-8 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer whitespace-nowrap"
                    >
                      Disconnect
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={googleLoading}
                    onClick={onSyncGoogle}
                    className="h-9 px-3 rounded-lg bg-ocean-700 hover:bg-ocean-800 disabled:opacity-60 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${googleLoading ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {googleLoading ? 'Syncing Contacts...' : 'Sync Google Contacts Now'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Official Google Sign-In Button Style */}
                  <button
                    type="button"
                    disabled={googleLoading}
                    onClick={onConnectGoogle}
                    className="h-9 px-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-medium inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    <span>
                      {googleLoading ? 'Connecting...' : 'Sign in with Google'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => contactsFileInputRef.current?.click()}
                    className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import CSV / vCard</span>
                  </button>

                  <input
                    ref={contactsFileInputRef}
                    type="file"
                    accept=".csv,.vcf,text/csv,text/vcard"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImportContactsFile(file);
                      e.target.value = '';
                    }}
                  />
                </div>
              )}

              {googleFeedback && (
                <p className="text-sm text-ocean-700 font-medium">{googleFeedback}</p>
              )}
              {googleError && (
                <p className="text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3">
                  {googleError}
                </p>
              )}
            </div>

            {/* Reset Device Data */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Reset Local Data
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clear local contacts, recordings, call logs, and reminders on this device.
                </p>
              </div>
              <button
                type="button"
                onClick={onRequestResetData}
                className="h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Device Data</span>
              </button>
            </div>
          </div>
        );

      case 'app-info':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">App Info</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                CM Dialer — Built for fast, uncluttered communication.
              </p>
            </div>

            <div className="divide-y divide-slate-100 text-sm">
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-slate-500">Application</span>
                <span className="font-medium text-slate-900">CM Dialer</span>
              </div>
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-slate-500">Version</span>
                <span className="font-mono-num text-slate-900">2.0.0</span>
              </div>
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-slate-500">Storage Architecture</span>
                <span className="font-medium text-slate-900">
                  Local Device Storage
                </span>
              </div>
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-slate-500">Optional Sync</span>
                <span className="font-medium text-slate-900">
                  Google Contacts / CSV & vCard
                </span>
              </div>
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-slate-500">Publisher</span>
                <span className="font-medium text-slate-900">CM / CoreBIQ</span>
              </div>
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-slate-500">Domain</span>
                <span className="font-mono-num text-ocean-700">dev.corebiq.com</span>
              </div>
            </div>
          </div>
        );

      case 'more-tools':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                More BI Tools by CM
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Business intelligence and daily productivity apps by CM / CoreBIQ.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {CM_BI_TOOLS.map((tool) => (
                <div
                  key={tool.name}
                  className="py-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {tool.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{tool.category}</p>
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-2.5 rounded-lg border border-slate-200 hover:border-ocean-700 hover:text-ocean-700 text-xs font-medium text-slate-700 inline-flex items-center gap-1 shrink-0 transition-colors whitespace-nowrap"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Support</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Send a message to the CM support team or connect via WhatsApp.
                </p>
              </div>

              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      placeholder="Full name"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Topic
                    </label>
                    <select
                      value={supportTopic}
                      onChange={(e) => setSupportTopic(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
                    >
                      <option>General Help</option>
                      <option>Call Recording</option>
                      <option>Google Contacts Sync</option>
                      <option>Feature Request</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Message *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe how we can help..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-ocean-700 resize-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    className="h-9 px-3.5 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{supportSent ? 'Email Opened' : 'Email Support'}</span>
                  </button>

                  <a
                    href="https://wa.me/?text=Hi%20CM%20Dialer%20Support%2C%20I%20need%20help%20with..."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-ocean-700" />
                    <span>WhatsApp Support</span>
                  </a>
                </div>
              </form>
            </div>

            {/* Quick Answers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Quick Answers</h3>
              <div className="divide-y divide-slate-100 text-sm">
                <div className="py-3">
                  <p className="font-medium text-slate-900">Where is my data stored?</p>
                  <p className="text-slate-600 mt-1">
                    Everything stays inside your browser&apos;s local device storage. No external cloud database is used.
                  </p>
                </div>
                <div className="py-3">
                  <p className="font-medium text-slate-900">How do I transfer data to another phone?</p>
                  <p className="text-slate-600 mt-1">
                    Open Menu → Settings and use Export Local Backup (.json), then Restore Backup on the new device.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        {activeSection !== 'root' && (
          <button
            type="button"
            onClick={() => onSelectSection('root')}
            aria-label="Back to menu"
            className="lg:hidden w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Menu</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Preferences, local storage, Google Contacts & CM tools
          </p>
        </div>
      </div>

      {/* Responsive Split: Menu Nav + Section Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Menu List */}
        <div
          className={`lg:col-span-5 bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden ${
            activeSection !== 'root' ? 'hidden lg:block' : 'block'
          }`}
        >
          {MENU_ITEMS.map((item) => {
            const isActiveDesktop = desktopSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`w-full px-4 py-3 min-h-[54px] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                  isActiveDesktop
                    ? 'lg:bg-ocean-50/70 hover:bg-slate-50'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActiveDesktop
                        ? 'lg:bg-ocean-700 lg:text-white bg-slate-100 text-ocean-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Section Detail Panel */}
        <div
          className={`lg:col-span-7 ${
            activeSection === 'root' ? 'hidden lg:block' : 'block'
          }`}
        >
          {renderSectionContent(desktopSection)}
        </div>
      </div>
    </div>
  );
};

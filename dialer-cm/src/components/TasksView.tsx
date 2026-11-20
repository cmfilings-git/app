import React, { useState } from 'react';
import {
  Plus,
  Phone,
  MessageCircle,
  Check,
  Trash2,
  Bookmark,
  X,
} from 'lucide-react';
import {
  Contact,
  TaskReminder,
  TaskReminderType,
  MessagePreset,
} from '../types';
import { cleanPhoneForWhatsApp } from '../data/initialData';

interface TasksViewProps {
  contacts: Contact[];
  tasks: TaskReminder[];
  presets: MessagePreset[];
  onAddTask: (task: Omit<TaskReminder, 'id' | 'createdAt' | 'completed'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddPreset: (preset: Omit<MessagePreset, 'id'>) => void;
  onDeletePreset: (id: string) => void;
  onStartCall: (target: { name: string; phone: string; contactId?: string }) => void;
}

const TIME_SHORTCUTS = [
  'In 15 mins',
  'In 1 hour',
  'Today, 5:00 PM',
  'Tomorrow, 10:00 AM',
];

export const TasksView: React.FC<TasksViewProps> = ({
  contacts,
  tasks,
  presets,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddPreset,
  onDeletePreset,
  onStartCall,
}) => {
  const [filter, setFilter] = useState<'all' | 'call' | 'whatsapp' | 'done'>('all');
  const [mobileComposerOpen, setMobileComposerOpen] = useState(false);
  const [presetsModalOpen, setPresetsModalOpen] = useState(false);

  // Composer form
  const [taskType, setTaskType] = useState<TaskReminderType>('whatsapp');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [scheduledTime, setScheduledTime] = useState('Today, 5:00 PM');
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');

  // Preset creation form
  const [newPresetType, setNewPresetType] = useState<TaskReminderType>('whatsapp');
  const [newPresetTitle, setNewPresetTitle] = useState('');
  const [newPresetText, setNewPresetText] = useState('');

  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId);
    const found = contacts.find((c) => c.id === contactId);
    if (found) {
      setContactName(found.name);
      setPhone(found.phone);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !phone.trim() || !message.trim()) return;

    onAddTask({
      type: taskType,
      contactId: selectedContactId || undefined,
      contactName: contactName.trim(),
      phone: phone.trim(),
      scheduledTime: scheduledTime.trim() || 'Today',
      message: message.trim(),
      note: note.trim() || undefined,
    });

    setSelectedContactId('');
    setContactName('');
    setPhone('');
    setMessage('');
    setNote('');
    setMobileComposerOpen(false);
  };

  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetTitle.trim() || !newPresetText.trim()) return;
    onAddPreset({
      type: newPresetType,
      title: newPresetTitle.trim(),
      text: newPresetText.trim(),
    });
    setNewPresetTitle('');
    setNewPresetText('');
  };

  const handleTriggerWhatsApp = (task: TaskReminder) => {
    const digits = cleanPhoneForWhatsApp(task.phone);
    const encoded = encodeURIComponent(task.message);
    const link = document.createElement('a');
    link.href = `https://wa.me/${digits}?text=${encoded}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'done') return task.completed;
    if (filter === 'call') return !task.completed && task.type === 'call';
    if (filter === 'whatsapp') return !task.completed && task.type === 'whatsapp';
    return !task.completed;
  });

  const activePresets = presets.filter((p) => p.type === taskType);

  const renderComposerForm = () => (
    <form onSubmit={handleCreateTask} className="space-y-4">
      {/* Reminder Type */}
      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setTaskType('whatsapp')}
          className={`h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            taskType === 'whatsapp'
              ? 'bg-white text-ocean-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>
        <button
          type="button"
          onClick={() => setTaskType('call')}
          className={`h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            taskType === 'call'
              ? 'bg-white text-ocean-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call</span>
        </button>
      </div>

      {/* Contact Picker */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Select Contact
        </label>
        <select
          value={selectedContactId}
          onChange={(e) => handleSelectContact(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
        >
          <option value="">Choose saved contact or enter manually...</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.phone})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Name *
          </label>
          <input
            type="text"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Contact name"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Phone *
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono-num text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
          />
        </div>
      </div>

      {/* Time & Shortcuts */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Reminder Time
        </label>
        <input
          type="text"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          placeholder="e.g. Today, 5:00 PM"
          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-ocean-700 mb-2"
        />
        <div className="flex flex-wrap gap-1.5">
          {TIME_SHORTCUTS.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setScheduledTime(slot)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                scheduledTime === slot
                  ? 'bg-ocean-50 border-ocean-200 text-ocean-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Selector */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-600">
            {taskType === 'whatsapp' ? 'WhatsApp Presets' : 'Call Presets'}
          </span>
          <button
            type="button"
            onClick={() => setPresetsModalOpen(true)}
            className="text-xs font-medium text-ocean-700 hover:underline cursor-pointer"
          >
            Manage Presets
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {activePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setMessage(preset.text)}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:border-ocean-700 hover:text-ocean-700 text-xs font-medium text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              {preset.title}
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            taskType === 'whatsapp'
              ? 'WhatsApp preset reminder message...'
              : 'Call reminder agenda or note...'
          }
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-ocean-700 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Extra Note (Optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Private reminder note..."
          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
        />
      </div>

      <button
        type="submit"
        className="h-9 px-4 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
      >
        Save Reminder
      </button>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Call and WhatsApp message preset reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPresetsModalOpen(true)}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Bookmark className="w-3.5 h-3.5 text-ocean-700" />
            <span>Presets</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileComposerOpen(true)}
            className="lg:hidden h-9 px-3 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'call', label: 'Call' },
            { id: 'whatsapp', label: 'WhatsApp' },
            { id: 'done', label: 'Done' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === tab.id
                ? 'bg-white text-ocean-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Task List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-900 mb-1">
                No {filter === 'done' ? 'completed ' : ''}reminders
              </p>
              <p className="text-sm text-slate-500">
                Create a Call or WhatsApp preset reminder to stay on schedule.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        task.completed
                          ? 'bg-ocean-700 border-ocean-700 text-white'
                          : 'border-slate-300 bg-white hover:border-ocean-700'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          task.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {task.contactName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {task.type === 'whatsapp' ? 'WhatsApp Reminder' : 'Call Reminder'} ·{' '}
                        {task.scheduledTime} ·{' '}
                        <span className="font-mono-num">{task.phone}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    aria-label="Delete task"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pl-7 space-y-2.5">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {task.message}
                  </p>
                  {task.note && (
                    <p className="text-xs text-slate-500">Note: {task.note}</p>
                  )}

                  {!task.completed && (
                    <div className="flex items-center gap-2 pt-0.5">
                      {task.type === 'whatsapp' ? (
                        <button
                          type="button"
                          onClick={() => handleTriggerWhatsApp(task)}
                          className="h-8 px-3 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Send WhatsApp</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onStartCall({
                              name: task.contactName,
                              phone: task.phone,
                              contactId: task.contactId,
                            })
                          }
                          className="h-8 px-3 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Now</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Mark Done
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Composer Panel */}
        <div className="hidden lg:block lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sticky top-20">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            New Reminder
          </h2>
          {renderComposerForm()}
        </div>
      </div>

      {/* Mobile Composer Sheet */}
      {mobileComposerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center"
        >
          <div className="w-full max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">New Reminder</h3>
              <button
                type="button"
                onClick={() => setMobileComposerOpen(false)}
                aria-label="Close"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {renderComposerForm()}
          </div>
        </div>
      )}

      {/* Presets Manager Modal */}
      {presetsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Reminder Presets
              </h3>
              <button
                type="button"
                onClick={() => setPresetsModalOpen(false)}
                aria-label="Close"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreatePreset} className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNewPresetType('whatsapp')}
                  className={`h-8 px-3 rounded-lg text-xs font-medium cursor-pointer ${
                    newPresetType === 'whatsapp'
                      ? 'bg-ocean-700 text-white'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  WhatsApp Preset
                </button>
                <button
                  type="button"
                  onClick={() => setNewPresetType('call')}
                  className={`h-8 px-3 rounded-lg text-xs font-medium cursor-pointer ${
                    newPresetType === 'call'
                      ? 'bg-ocean-700 text-white'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  Call Preset
                </button>
              </div>
              <input
                type="text"
                required
                value={newPresetTitle}
                onChange={(e) => setNewPresetTitle(e.target.value)}
                placeholder="Short title (e.g. Payment Reminder)"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
              />
              <textarea
                rows={2}
                required
                value={newPresetText}
                onChange={(e) => setNewPresetText(e.target.value)}
                placeholder="Preset message or call script..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-ocean-700 resize-none"
              />
              <button
                type="submit"
                className="h-8 px-3 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-medium cursor-pointer"
              >
                Add Preset
              </button>
            </form>

            <div className="divide-y divide-slate-100">
              {presets.map((preset) => (
                <div key={preset.id} className="py-2.5 flex items-start justify-between gap-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {preset.title}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        · {preset.type === 'whatsapp' ? 'WhatsApp' : 'Call'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {preset.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeletePreset(preset.id)}
                    aria-label="Delete preset"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

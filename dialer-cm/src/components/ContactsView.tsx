import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Phone,
  MessageCircle,
  Mail,
  X,
  Check,
  Edit2,
  Trash2,
  CalendarClock,
  StickyNote,
  Send,
  Copy,
} from 'lucide-react';
import {
  Contact,
  ContactActionChannel,
  TaskReminder,
  MessagePreset,
} from '../types';
import { cleanPhoneForWhatsApp, getInitials } from '../data/initialData';

interface ContactsViewProps {
  contacts: Contact[];
  tasks: TaskReminder[];
  presets: MessagePreset[];
  googleLinked: boolean;
  onStartCall: (target: { name: string; phone: string; contactId?: string }) => void;
  onAddContact: (
    data: { name: string; phone: string; email?: string; company?: string; notes?: string },
    saveToGoogle: boolean
  ) => void;
  onUpdateContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onAddTask: (task: Omit<TaskReminder, 'id' | 'createdAt' | 'completed'>) => void;
  onToggleTask: (id: string) => void;
  onOpenGoogleSettings: () => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  tasks,
  presets,
  googleLinked,
  onStartCall,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onAddTask,
  onToggleTask,
  onOpenGoogleSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    contacts[0]?.id ?? null
  );
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<ContactActionChannel>('call');

  // Action Form states
  const [callNote, setCallNote] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Contact Notes & Quick Task states
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [quickTaskType, setQuickTaskType] = useState<'call' | 'whatsapp'>('call');
  const [quickTaskTime, setQuickTaskTime] = useState('Tomorrow, 10:00 AM');
  const [quickTaskText, setQuickTaskText] = useState('');
  const [showQuickTaskForm, setShowQuickTaskForm] = useState(false);

  // Add / Edit Contact Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [saveToGoogle, setSaveToGoogle] = useState(false);

  const selectedContact =
    contacts.find((c) => c.id === selectedContactId) || contacts[0] || null;

  useEffect(() => {
    if (selectedContact) {
      setNotesDraft(selectedContact.notes || '');
      setEmailTo(selectedContact.email || '');
      setEmailSubject(`Follow-up — ${selectedContact.name}`);
      setEmailBody('');
      setCallNote('');
      setWaMessage('');
      setNotesSaved(false);
      setShowQuickTaskForm(false);
    }
  }, [selectedContact?.id]);

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  });

  const openContactChannel = (contact: Contact, channel: ContactActionChannel) => {
    setSelectedContactId(contact.id);
    setActiveChannel(channel);
    setMobileDetailOpen(true);
  };

  const openAddModal = () => {
    setEditingContact(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormCompany('');
    setFormNotes('');
    setSaveToGoogle(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormName(contact.name);
    setFormPhone(contact.phone);
    setFormEmail(contact.email || '');
    setFormCompany(contact.company || '');
    setFormNotes(contact.notes || '');
    setSaveToGoogle(false);
    setIsFormModalOpen(true);
  };

  const handleSubmitContactForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    if (editingContact) {
      onUpdateContact({
        ...editingContact,
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        company: formCompany.trim(),
        notes: formNotes.trim(),
      });
    } else {
      onAddContact(
        {
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          company: formCompany.trim(),
          notes: formNotes.trim(),
        },
        saveToGoogle
      );
    }
    setIsFormModalOpen(false);
  };

  const handleSaveNotes = () => {
    if (!selectedContact) return;
    onUpdateContact({ ...selectedContact, notes: notesDraft });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;
    const digits = cleanPhoneForWhatsApp(selectedContact.phone);
    const text = encodeURIComponent(
      waMessage.trim() || `Hi ${selectedContact.name},`
    );
    const link = document.createElement('a');
    link.href = `https://wa.me/${digits}?text=${text}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = emailTo.trim();
    if (!targetEmail) return;
    const subject = encodeURIComponent(emailSubject.trim());
    const body = encodeURIComponent(emailBody.trim());
    const link = document.createElement('a');
    link.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    link.click();
  };

  const handleCopyEmailDraft = () => {
    const draft = `To: ${emailTo}\nSubject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard?.writeText(draft).catch(() => {});
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 1800);
  };

  const handleSaveQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !quickTaskText.trim()) return;
    onAddTask({
      type: quickTaskType,
      contactId: selectedContact.id,
      contactName: selectedContact.name,
      phone: selectedContact.phone,
      scheduledTime: quickTaskTime.trim() || 'Today',
      message: quickTaskText.trim(),
    });
    setQuickTaskText('');
    setShowQuickTaskForm(false);
  };

  const contactTasks = selectedContact
    ? tasks.filter(
        (t) =>
          t.contactId === selectedContact.id ||
          cleanPhoneForWhatsApp(t.phone) === cleanPhoneForWhatsApp(selectedContact.phone)
      )
    : [];

  const whatsappPresets = presets.filter((p) => p.type === 'whatsapp');

  const renderDetailPanel = (contact: Contact) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
      {/* Contact Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-ocean-50 border border-ocean-200 text-ocean-700 font-display text-xs font-semibold flex items-center justify-center shrink-0">
            {getInitials(contact.name)}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 truncate">
              {contact.name}
            </h2>
            <p className="text-xs font-mono-num text-slate-600 truncate">
              {contact.phone}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {[contact.company, contact.email, contact.source === 'google' ? 'Google' : 'Local']
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => openEditModal(contact)}
            aria-label="Edit contact"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              onDeleteContact(contact.id);
              setMobileDetailOpen(false);
            }}
            aria-label="Delete contact"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileDetailOpen(false)}
            aria-label="Close details"
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Action Form Selector: Call | WhatsApp Message | Email */}
      <div>
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-4">
          {(
            [
              { id: 'call', label: 'Call', icon: <Phone className="w-3.5 h-3.5" /> },
              { id: 'whatsapp', label: 'Message', icon: <MessageCircle className="w-3.5 h-3.5" /> },
              { id: 'email', label: 'Email', icon: <Mail className="w-3.5 h-3.5" /> },
            ] as const
          ).map((tab) => {
            const active = activeChannel === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveChannel(tab.id)}
                className={`h-8 px-3 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-white text-ocean-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Call Form CTA */}
        {activeChannel === 'call' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Number to Call
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono-num text-sm text-slate-900">
                {contact.phone}
              </div>
            </div>
            <div>
              <label htmlFor="contact-call-note" className="block text-xs font-medium text-slate-500 mb-1.5">
                Call Agenda (Optional)
              </label>
              <input
                id="contact-call-note"
                type="text"
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
                placeholder="Topic or follow-up point..."
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-ocean-700"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  onStartCall({
                    name: contact.name,
                    phone: contact.phone,
                    contactId: contact.id,
                  })
                }
                className="h-9 px-3.5 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddTask({
                    type: 'call',
                    contactId: contact.id,
                    contactName: contact.name,
                    phone: contact.phone,
                    scheduledTime: 'Today, 5:00 PM',
                    message: callNote.trim() || `Call ${contact.name}`,
                  });
                  setCallNote('');
                }}
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Save Call Task
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp Message Form CTA */}
        {activeChannel === 'whatsapp' && (
          <form onSubmit={handleSendWhatsApp} className="space-y-4">
            {whatsappPresets.length > 0 && (
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-2">
                  Quick Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {whatsappPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setWaMessage(preset.text)}
                      className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:border-ocean-700 hover:text-ocean-700 text-xs font-medium text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="wa-message-input" className="block text-xs font-medium text-slate-500 mb-1.5">
                WhatsApp Message
              </label>
              <textarea
                id="wa-message-input"
                rows={3}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                placeholder={`Write a WhatsApp message to ${contact.name}...`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-ocean-700 resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="h-9 px-3.5 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send on WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddTask({
                    type: 'whatsapp',
                    contactId: contact.id,
                    contactName: contact.name,
                    phone: contact.phone,
                    scheduledTime: 'Today, 6:00 PM',
                    message: waMessage.trim() || `Follow up with ${contact.name} on WhatsApp`,
                  });
                }}
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Remind Later
              </button>
            </div>
          </form>
        )}

        {/* Email Form CTA */}
        {activeChannel === 'email' && (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label htmlFor="email-to-input" className="block text-xs font-medium text-slate-500 mb-1.5">
                Recipient Email
              </label>
              <input
                id="email-to-input"
                type="email"
                required
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-ocean-700"
              />
            </div>
            <div>
              <label htmlFor="email-subject-input" className="block text-xs font-medium text-slate-500 mb-1.5">
                Subject
              </label>
              <input
                id="email-subject-input"
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject line"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-ocean-700"
              />
            </div>
            <div>
              <label htmlFor="email-body-input" className="block text-xs font-medium text-slate-500 mb-1.5">
                Message
              </label>
              <textarea
                id="email-body-input"
                rows={3}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder={`Write an email to ${contact.name}...`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-ocean-700 resize-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="h-9 px-3.5 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </button>
              <button
                type="button"
                onClick={handleCopyEmailDraft}
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                {copiedFeedback ? <Check className="w-3.5 h-3.5 text-ocean-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFeedback ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Contact Tasks */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <CalendarClock className="w-3.5 h-3.5 text-ocean-700" />
            <span>Tasks</span>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickTaskForm((prev) => !prev)}
            className="text-xs font-medium text-ocean-700 hover:text-ocean-800 cursor-pointer whitespace-nowrap"
          >
            {showQuickTaskForm ? 'Cancel' : '+ Add Task'}
          </button>
        </div>

        {showQuickTaskForm && (
          <form onSubmit={handleSaveQuickTask} className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuickTaskType('call')}
                className={`h-8 px-2.5 rounded-lg text-xs font-medium cursor-pointer ${
                  quickTaskType === 'call'
                    ? 'bg-ocean-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                Call
              </button>
              <button
                type="button"
                onClick={() => setQuickTaskType('whatsapp')}
                className={`h-8 px-2.5 rounded-lg text-xs font-medium cursor-pointer ${
                  quickTaskType === 'whatsapp'
                    ? 'bg-ocean-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                WhatsApp
              </button>
              <input
                type="text"
                value={quickTaskTime}
                onChange={(e) => setQuickTaskTime(e.target.value)}
                placeholder="When"
                className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-ocean-700"
              />
            </div>
            <input
              type="text"
              required
              value={quickTaskText}
              onChange={(e) => setQuickTaskText(e.target.value)}
              placeholder="Reminder note or preset message..."
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
            />
            <button
              type="submit"
              className="h-8 px-3 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-medium cursor-pointer"
            >
              Save Task
            </button>
          </form>
        )}

        {contactTasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks linked to this contact.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {contactTasks.map((task) => (
              <div key={task.id} className="py-2 flex items-start gap-2.5">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  aria-label="Toggle task complete"
                  className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                    task.completed
                      ? 'bg-ocean-700 border-ocean-700 text-white'
                      : 'border-slate-300 bg-white hover:border-ocean-700'
                  }`}
                >
                  {task.completed && <Check className="w-3 h-3" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {task.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {task.type === 'whatsapp' ? 'WhatsApp' : 'Call'} · {task.scheduledTime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Notes */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <StickyNote className="w-3.5 h-3.5 text-ocean-700" />
            <span>Notes</span>
          </div>
          <button
            type="button"
            onClick={handleSaveNotes}
            className="text-xs font-medium text-ocean-700 hover:text-ocean-800 cursor-pointer whitespace-nowrap"
          >
            {notesSaved ? 'Saved' : 'Save Note'}
          </button>
        </div>

        <textarea
          rows={3}
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={handleSaveNotes}
          placeholder="Add private notes about this contact (saved on this device)..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-ocean-700 transition-colors resize-none"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {contacts.length} saved ·{' '}
            <button
              type="button"
              onClick={onOpenGoogleSettings}
              className="text-ocean-700 hover:underline font-medium cursor-pointer"
            >
              {googleLinked ? 'Google Contacts linked' : 'Link Google Contacts'}
            </button>
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="h-9 px-3 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Contact</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name, phone, or email..."
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-ocean-700 transition-colors"
        />
      </div>

      {/* Responsive 2-Column Layout on Desktop, Spacious List on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {filteredContacts.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-900 mb-1">No contacts found</p>
              <p className="text-sm text-slate-500">
                Try another search or add a new contact.
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = selectedContact?.id === contact.id;
              return (
                <div
                  key={contact.id}
                  onClick={() => openContactChannel(contact, activeChannel)}
                  className={`px-3.5 py-2.5 min-h-[58px] flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    isSelected ? 'bg-ocean-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                        isSelected
                          ? 'bg-ocean-700 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {getInitials(contact.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {contact.name}
                      </p>
                      <p className="text-xs font-mono-num text-slate-500 truncate mt-0.5">
                        {contact.phone}
                      </p>
                    </div>
                  </div>

                  {/* Call, WhatsApp, Email Minimal Icons */}
                  <div
                    className="flex items-center gap-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openContactChannel(contact, 'call')}
                      aria-label={`Call ${contact.name}`}
                      title="Call"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-ocean-700 hover:bg-ocean-50 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openContactChannel(contact, 'whatsapp')}
                      aria-label={`WhatsApp ${contact.name}`}
                      title="WhatsApp Message"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-ocean-700 hover:bg-ocean-50 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openContactChannel(contact, 'email')}
                      aria-label={`Email ${contact.name}`}
                      title="Email"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-ocean-700 hover:bg-ocean-50 transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Detail Panel */}
        <div className="hidden lg:block lg:col-span-6 sticky top-20">
          {selectedContact ? (
            renderDetailPanel(selectedContact)
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
              Select a contact to call, message, email, or manage tasks and notes.
            </div>
          )}
        </div>
      </div>

      {/* Mobile Detail Sheet */}
      {mobileDetailOpen && selectedContact && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center">
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-2 pb-8">
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto my-2" />
            {renderDetailPanel(selectedContact)}
          </div>
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {isFormModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingContact ? 'Edit Contact' : 'New Contact'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                aria-label="Close modal"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmitContactForm} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter full name"
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
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 font-mono-num text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="Optional"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-ocean-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-ocean-700 resize-none"
                />
              </div>

              {!editingContact && googleLinked && (
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToGoogle}
                    onChange={(e) => setSaveToGoogle(e.target.checked)}
                    className="w-4 h-4 rounded accent-ocean-700 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">
                    Also save to linked Google Contacts
                  </span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="h-9 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-3.5 rounded-lg bg-ocean-700 hover:bg-ocean-800 text-xs font-medium text-white cursor-pointer"
                >
                  {editingContact ? 'Save Changes' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

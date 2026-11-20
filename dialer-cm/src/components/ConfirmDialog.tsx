import React from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-5">{description}</p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-3.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 px-3.5 rounded-lg text-xs font-medium text-white bg-ocean-700 hover:bg-ocean-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

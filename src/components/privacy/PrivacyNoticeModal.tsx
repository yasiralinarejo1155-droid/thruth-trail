import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, FileText, Check } from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Child Biometric Data Protection & Ethics Policy</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sindh School Education and Literacy Department Compliance</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <div className="font-semibold text-emerald-900 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero Raw Image Storage Architecture</span>
            </div>
            <p>
              TruthTrail does NOT store, upload, or transmit raw camera photographs of enrolled minor students to any server. When a child's face is scanned during enrollment, the client device mathematically extracts a non-reversible 128-dimensional floating point embedding vector. The original image buffer is wiped from browser memory immediately.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>1. Mandatory Guardian Consent</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400">
              No biometric template may be generated without signed physical or digital guardian consent under the Sindh Child Protection and Right to Free Education frameworks. Guardians retain the legal right to opt out, in which case the student is marked via supervised manual verification.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-1.5 flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span>2. Cryptographic Anonymity for Civil Servants</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400">
              Field inspectors operate under cryptographically veiled pseudonyms (e.g. <code>INS-7K2Q</code>). Their true legal identities are separated by an asymmetric isolation layer to safeguard them against local landlord intimidation, political retaliation, or harassment.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-1.5">
              3. Data Retention & Erasure Schedule
            </h4>
            <p className="text-slate-500 dark:text-slate-400">
              Biometric mathematical templates are automatically deprecated when a student graduates from Grade 5 (Primary) or Grade 8 (Elementary) or upon formal withdrawal from the Sindh SEMIS register.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>I Understand & Agree</span>
          </button>
        </div>
      </div>
    </div>
  );
};

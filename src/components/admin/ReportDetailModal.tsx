import React from 'react';
import { InspectionReport } from '../../types';
import { X, ShieldCheck, FileCheck, CheckCircle2, Lock, Camera, MapPin, AlertCircle } from 'lucide-react';

interface ReportDetailModalProps {
  report: InspectionReport | null;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  const isGhost = report.verdict === 'confirmed_ghost' || report.verdict === 'partially_ghost';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
        <button
          onClick={onClose}
          aria-label="Close report"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                AUDIT REPORT #{report.id}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs capitalize font-semibold text-slate-500">
                {report.inspectionMode.replace('_', ' ')} Audit
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {report.schoolName}
            </h2>
          </div>
        </div>

        {/* Verdict Badge */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isGhost
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-950 dark:text-red-200'
            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
        }`}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block">Official Audit Verdict</span>
            <span className="text-base font-extrabold capitalize">{report.verdict.replace('_', ' ')}</span>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-500 block text-[10px]">Auditor (Revealed Post-Filing)</span>
            <span className="font-mono font-bold">{report.inspectorPseudonym}</span>
          </div>
        </div>

        {/* GPS Verification */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>GPS Geofence Proof</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Check-in registered at distance of <strong className="font-mono">{report.gpsCheckIn.distanceMeters}m</strong> from school gates on {new Date(report.gpsCheckIn.timestamp).toLocaleString()}.
          </p>
        </div>

        {/* Physical Findings */}
        {report.physicalFindings && (
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white">Physical On-Site Findings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Gate Status</span>
                <span className="font-bold capitalize">{report.physicalFindings.gateStatus}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Headcount vs Register</span>
                <span className="font-mono font-bold">
                  {report.physicalFindings.studentsCountedPhysically} present / {report.physicalFindings.studentsEnrolledOnRegister} on paper
                </span>
                <span className="text-[10px] text-red-600 font-bold block mt-0.5">
                  ({report.physicalFindings.discrepancyPercent}% Discrepancy)
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold block text-slate-800 dark:text-slate-200">Inspector Field Notes:</span>
              <p className="text-slate-600 dark:text-slate-300 italic">
                "{report.physicalFindings.inspectorNotes}"
              </p>
            </div>
          </div>
        )}

        {/* Cryptographic Seal */}
        <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Append-Only Tamper Seal</span>
          </div>
          <div className="break-all text-[10px] text-slate-300">
            Seal: {report.tamperSealHash}
          </div>
          <div className="text-[10px] text-slate-400">
            Digital Signature: {report.cryptographicSignature}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

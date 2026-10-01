import React, { useState } from 'react';
import { AuditLogEntry } from '../../types';
import { ShieldCheck, Search, Clock, FileText, CheckCircle2, Lock } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actorIdentifier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Append-Only Forensic Ledger</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Tamper-Evident System Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic ledger tracking all inspector submissions, blind batch shuffling, and biometric check-ins
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action or actor..."
            className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-64"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4 font-semibold">Timestamp (UTC)</th>
                <th className="py-3 px-4 font-semibold">Actor Role</th>
                <th className="py-3 px-4 font-semibold">Actor Identifier</th>
                <th className="py-3 px-4 font-semibold">Action Event</th>
                <th className="py-3 px-4 font-semibold">Forensic Description</th>
                <th className="py-3 px-4 font-semibold font-mono text-right">IP Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                      {log.actorRole.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                    {log.actorIdentifier}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-800 dark:text-emerald-400 text-[11px]">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400 text-[10px]">
                    {log.ipHash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

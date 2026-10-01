import React, { useState } from 'react';
import { AnonymousReport } from '../../types';
import { truthTrailStore } from '../../services/storage';
import { 
  ShieldAlert, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Lock,
  Camera
} from 'lucide-react';

interface WhistleblowerInboxProps {
  reports: AnonymousReport[];
}

export const WhistleblowerInbox: React.FC<WhistleblowerInboxProps> = ({ reports }) => {
  const [filter, setFilter] = useState<'all' | 'new' | 'corroborated' | 'under_investigation'>('all');

  const filtered = reports.filter(r => filter === 'all' || r.status === filter);

  const handleUpdateStatus = (id: string, newStatus: AnonymousReport['status']) => {
    truthTrailStore.updateAnonymousReportStatus(id, newStatus);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Encrypted Community Whistleblower Channel</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Anonymous Tip Inbox & Ground Intel
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Confidential reports submitted by parents, villagers, and whistleblowing teachers
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            All Tips ({reports.length})
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'new' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            New Unreviewed
          </button>
          <button
            onClick={() => setFilter('corroborated')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'corroborated' ? 'bg-red-600 text-white shadow-xs font-semibold' : 'text-slate-500 hover:text-red-600'
            }`}
          >
            Corroborated High-Risk
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filtered.map((report) => {
          const isCorroborated = report.status === 'corroborated';
          const isNew = report.status === 'new';

          return (
            <div
              key={report.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition-colors space-y-3 ${
                isCorroborated
                  ? 'border-red-200 dark:border-red-900/60 bg-red-50/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {report.schoolName || 'Target School'}
                  </span>
                  <span className="text-slate-400 text-xs">·</span>
                  <span className="text-[11px] font-semibold capitalize text-emerald-800 dark:text-emerald-400">
                    Category: {report.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Filed {new Date(report.submittedAt).toLocaleDateString()} by <strong className="capitalize text-slate-600 dark:text-slate-300">{report.reporterType.replace('_', ' ')}</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isCorroborated
                      ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300'
                      : isNew
                      ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                      : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                  }`}>
                    {report.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                "{report.description}"
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-slate-400" />
                    <span>{report.evidencePhotoCount} Geotagged Photo(s) Attached</span>
                  </span>
                  <span>·</span>
                  <span className="text-red-600 dark:text-red-400 font-semibold font-mono">
                    +{report.riskContribution} Risk Points Added
                  </span>
                </div>

                {/* Triage Actions */}
                <div className="flex items-center gap-2">
                  {report.status !== 'corroborated' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'corroborated')}
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] shadow-xs"
                    >
                      Corroborate (Raise Risk)
                    </button>
                  )}
                  {report.status !== 'under_investigation' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'under_investigation')}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shadow-xs"
                    >
                      Mark Investigating
                    </button>
                  )}
                  {report.status !== 'dismissed' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 text-[11px]"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * TruthTrail - Khairpur Anti-Ghost School Audit System
 * 3-Module Architecture:
 * Module 1: Admin Portal (Login required · 3 Divisions: Schools, Teachers IN/OUT, Inspections Occur · Attendance History · Student Verification)
 * Module 2: School Portal (Open Terminal · Facial Biometrics · Leaflet Map · 3s Redirect · Request New Student · School Head Online Inspection Acceptor)
 * Module 3: Inspector Portal (Login required · Receives Admin requests · Physical & Online Surprise Inspections)
 */

import React, { useState, useEffect } from 'react';
import { PortalType, InspectionReport } from './types';
import { truthTrailStore } from './services/storage';
import { SchoolPortal } from './components/school/SchoolPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { InspectorPortal } from './components/inspector/InspectorPortal';
import { ExportZipModal } from './components/common/ExportZipModal';
import { PrivacyNoticeModal } from './components/privacy/PrivacyNoticeModal';
import { 
  Building2, 
  ShieldCheck, 
  Camera, 
  Download, 
  RotateCcw,
  FileText
} from 'lucide-react';

export default function App() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = truthTrailStore.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsub;
  }, []);

  // Main 3-Portal Switcher: Defaults to 'school' (open terminal as requested)
  const [currentPortal, setCurrentPortal] = useState<PortalType>('school');

  // Modals
  const [isZipModalOpen, setIsZipModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Inspector profile for Inspector module
  const currentInspector = truthTrailStore.inspectors[0] || {
    id: 'insp-01',
    pseudonym: 'INS-7K2Q',
    code: 'INS-7K2Q',
    homeTaluka: 'Khairpur',
    inspectionsCompleted: 14,
    integrityScore: 98
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Persistent Portal Switcher Bar */}
      <div className="bg-slate-900 text-slate-300 px-4 py-2 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-white tracking-wide">TRUTHTRAIL SYSTEM:</span>
            <span className="text-slate-400">
              {currentPortal === 'school' && 'Open School Terminal (Facial Attendance + Map + 3s Auto-Redirect)'}
              {currentPortal === 'admin' && 'District Admin Portal (3 Divisions: Schools, Teachers IN/OUT, Inspections Occur)'}
              {currentPortal === 'inspector' && 'Inspector Portal (Pseudonymous Auditor · Receives Admin Requests)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 mr-1 hidden md:inline">Select Portal:</span>
            <button
              onClick={() => setCurrentPortal('school')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                currentPortal === 'school'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>1. School Terminal (Open)</span>
            </button>

            <button
              onClick={() => setCurrentPortal('admin')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                currentPortal === 'admin'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>2. Admin Portal (Login)</span>
            </button>

            <button
              onClick={() => setCurrentPortal('inspector')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                currentPortal === 'inspector'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>3. Inspector Portal (Login)</span>
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>

            <button
              onClick={() => setIsZipModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
              title="Download full project archive with README"
            >
              <Download className="w-3 h-3" />
              <span>Export ZIP</span>
            </button>

            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="Biometric Privacy & Consent Policy"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                if (confirm('Reset TruthTrail data to initial state?')) {
                  truthTrailStore.resetToDefault();
                }
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="Reset Demo Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODULE ROUTING */}
      <div className="flex-1">
        {currentPortal === 'school' && (
          <SchoolPortal
            onNavigateToAdmin={() => setCurrentPortal('admin')}
            onNavigateToInspector={() => setCurrentPortal('inspector')}
          />
        )}

        {currentPortal === 'admin' && (
          <AdminPortal
            onBackToSchool={() => setCurrentPortal('school')}
            onNavigateToInspector={() => setCurrentPortal('inspector')}
          />
        )}

        {currentPortal === 'inspector' && (
          <InspectorPortal
            currentInspector={currentInspector}
            assignments={truthTrailStore.assignments}
            schools={truthTrailStore.schools}
            reports={truthTrailStore.reports}
            isOffline={false}
            onBackToSchool={() => setCurrentPortal('school')}
          />
        )}
      </div>

      {/* Global Modals */}
      <ExportZipModal
        isOpen={isZipModalOpen}
        onClose={() => setIsZipModalOpen(false)}
      />

      <PrivacyNoticeModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}

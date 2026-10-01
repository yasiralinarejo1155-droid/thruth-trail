/**
 * TruthTrail - Khairpur Anti-Ghost School Audit System
 * 3-Module Architecture:
 * Module 1: Admin Portal (Login required · 3 Divisions: Schools, Teachers IN/OUT, Inspections Occur · Attendance History · Student Verification)
 * Module 2: School Portal (Open Terminal · Facial Biometrics · Leaflet Map · 3s Redirect · Request New Student · School Head Online Inspection Acceptor)
 * Module 3: Inspector Portal (Login required · Receives Admin requests · Physical & Online Surprise Inspections)
 */

import React, { useState, useEffect } from 'react';
import { PortalType } from './types';
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
  FileText,
  Activity,
  CheckCircle2
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
    <div className="min-h-screen bg-slate-100/70 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-600 selection:text-white">
      {/* Top Professional Portal Switcher & System Status Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          {/* Brand Identity / Government Entity Lockup */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-sm shadow-emerald-700/20 ring-1 ring-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  TruthTrail
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Khairpur Audit System
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                Sindh School Education & Literacy Department · Anti-Ghost School Oversight
              </p>
            </div>
          </div>

          {/* Central 3-Module Segmented Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-700/70 shadow-inner">
            <button
              onClick={() => setCurrentPortal('school')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPortal === 'school'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm font-bold ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>School Terminal</span>
              <span className="hidden lg:inline text-[10px] opacity-75 font-normal">(Open)</span>
            </button>

            <button
              onClick={() => setCurrentPortal('admin')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPortal === 'admin'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm font-bold ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
              <span className="hidden lg:inline text-[10px] opacity-75 font-normal">(Login)</span>
            </button>

            <button
              onClick={() => setCurrentPortal('inspector')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPortal === 'inspector'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm font-bold ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Inspector</span>
              <span className="hidden lg:inline text-[10px] opacity-75 font-normal">(Login)</span>
            </button>
          </div>

          {/* Quick Actions & Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsZipModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Download project code archive and README"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export ZIP</span>
            </button>

            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Biometric Privacy & Consent Policy"
              aria-label="Privacy Policy"
            >
              <FileText className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (confirm('Reset TruthTrail data to default initial state?')) {
                  truthTrailStore.resetToDefault();
                }
              }}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset Demo Data"
              aria-label="Reset Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* MODULE ROUTING WITH CLEAN CONTAINER */}
      <div className="flex-1 flex flex-col">
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

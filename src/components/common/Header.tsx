import React from 'react';
import { UserRole, Language } from '../../types';
import { getTranslation } from '../../services/i18n';
import { 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Moon, 
  Sun, 
  Download, 
  FileText, 
  RefreshCw,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  offlineQueueCount: number;
  onSyncOfflineQueue: () => void;
  onOpenZipModal: () => void;
  onOpenPrivacyModal: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  language,
  onLanguageChange,
  darkMode,
  onToggleDarkMode,
  isOffline,
  onToggleOffline,
  offlineQueueCount,
  onSyncOfflineQueue,
  onOpenZipModal,
  onOpenPrivacyModal,
  onResetData
}) => {
  // Navigation tabs based on role
  const getNavLinks = () => {
    if (currentRole === 'super_admin') {
      return [
        { id: 'dashboard', label: getTranslation(language, 'dashboard') },
        { id: 'schools', label: getTranslation(language, 'schools') },
        { id: 'batches', label: getTranslation(language, 'inspectionBatches') },
        { id: 'inbox', label: getTranslation(language, 'whistleblowerInbox') },
        { id: 'audit', label: getTranslation(language, 'auditLogs') },
      ];
    } else if (currentRole === 'inspector') {
      return [
        { id: 'inspector-assignments', label: 'My Assignment' },
        { id: 'inspector-audit-form', label: 'Conduct Audit' },
        { id: 'inspector-history', label: 'Submitted Reports' },
      ];
    } else if (currentRole === 'teacher' || currentRole === 'school_head') {
      return [
        { id: 'teacher-checkin', label: 'Teacher Biometric' },
        { id: 'student-attendance', label: 'Student Roll Call' },
        { id: 'student-enrollment', label: 'Enroll Child' },
        { id: 'school-stats', label: 'School Ledger' },
      ];
    } else {
      // Parent / Community
      return [
        { id: 'parent-verify', label: 'Verify Child Attendance' },
        { id: 'community-report', label: 'Anonymous Tip' },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Strictly follow 3-zone Top Bar Contract: Brand Zone — Nav Links — Primary Actions */}
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onTabChange(navLinks[0]?.id || 'dashboard'); }}
              className="text-lg font-bold tracking-tight text-emerald-800 dark:text-emerald-400 whitespace-nowrap"
            >
              TruthTrail
            </a>
            <span className="hidden sm:inline-block text-xs text-slate-400 dark:text-slate-600">·</span>
            <span className="hidden sm:inline-block text-xs font-medium text-slate-500 dark:text-slate-400">
              Khairpur District
            </span>
          </div>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onTabChange(link.id)}
                  className={`text-xs font-medium transition-colors whitespace-nowrap pb-1 border-b-2 ${
                    isActive
                      ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions (Role Switcher, Quick Utilities, Zip Export) */}
          <div className="flex items-center gap-2">
            {/* Offline Simulator Switch */}
            <button
              onClick={onToggleOffline}
              title={isOffline ? 'Offline Mode Active' : 'Online Mode'}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                isOffline
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-emerald-600" />}
              <span className="hidden xl:inline text-[11px] font-medium">{isOffline ? 'Offline Sim' : 'Online'}</span>
            </button>

            {/* Offline Queue Sync Indicator */}
            {offlineQueueCount > 0 && (
              <button
                onClick={onSyncOfflineQueue}
                title="Sync queued records"
                className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium flex items-center gap-1 shadow-xs animate-pulse whitespace-nowrap"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync ({offlineQueueCount})</span>
              </button>
            )}

            {/* Language Selector */}
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  language === 'en' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('ur')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  language === 'ur' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                اردو
              </button>
              <button
                onClick={() => onLanguageChange('sd')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  language === 'sd' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                سنڌي
              </button>
            </div>

            {/* Role Switcher Pill Dropdown */}
            <div className="relative">
              <select
                aria-label="Select User Role"
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="super_admin">Role: Super Admin</option>
                <option value="inspector">Role: Inspector (INS-7K2Q)</option>
                <option value="teacher">Role: Teacher (GBPS Luqman)</option>
                <option value="school_head">Role: School Head</option>
                <option value="parent">Role: Parent / Public</option>
              </select>
            </div>

            {/* Dark mode */}
            <button
              onClick={onToggleDarkMode}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Privacy Modal */}
            <button
              onClick={onOpenPrivacyModal}
              title="Child Biometric Privacy Policy"
              aria-label="Biometric privacy notice"
              className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* Export Zip CTA */}
            <button
              onClick={onOpenZipModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shadow-xs transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export ZIP</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

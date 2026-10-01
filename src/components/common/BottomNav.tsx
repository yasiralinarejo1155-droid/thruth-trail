import React from 'react';
import { UserRole } from '../../types';
import { 
  LayoutDashboard, 
  School as SchoolIcon, 
  Layers, 
  Camera, 
  Users, 
  UserCheck, 
  ClipboardCheck, 
  MessageSquare,
  ShieldAlert
} from 'lucide-react';

interface BottomNavProps {
  currentRole: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRole,
  activeTab,
  onTabChange,
}) => {
  const getTabs = () => {
    if (currentRole === 'super_admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'schools', label: 'Schools', icon: SchoolIcon },
        { id: 'batches', label: 'Batches', icon: Layers },
        { id: 'inbox', label: 'Whistleblower', icon: ShieldAlert },
      ];
    } else if (currentRole === 'inspector') {
      return [
        { id: 'inspector-assignments', label: 'Assignments', icon: ClipboardCheck },
        { id: 'inspector-audit-form', label: 'Audit Form', icon: Camera },
        { id: 'inspector-history', label: 'History', icon: Layers },
      ];
    } else if (currentRole === 'teacher' || currentRole === 'school_head') {
      return [
        { id: 'teacher-checkin', label: 'Check-in', icon: Camera },
        { id: 'student-attendance', label: 'Roll Call', icon: Users },
        { id: 'student-enrollment', label: 'Enroll Child', icon: UserCheck },
        { id: 'school-stats', label: 'Ledger', icon: SchoolIcon },
      ];
    } else {
      return [
        { id: 'parent-verify', label: 'Verify Child', icon: UserCheck },
        { id: 'community-report', label: 'Report Ghost', icon: MessageSquare },
      ];
    }
  };

  const tabs = getTabs();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden safe-area-pb">
      <div className={`grid grid-cols-${tabs.length} items-center h-16 px-1`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-colors focus-visible:outline-none"
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 scale-110'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

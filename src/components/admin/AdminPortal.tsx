import React, { useState } from 'react';
import { School, Teacher, Student, AttendanceRecord, TeacherCheckInRecord, InspectionRequest, InspectorProfile } from '../../types';
import { truthTrailStore } from '../../services/storage';
import { 
  Building2, 
  Users, 
  ClipboardCheck, 
  Plus, 
  History, 
  UserCheck, 
  LogOut, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Send,
  Video,
  FileCheck,
  Search,
  Check,
  X,
  Shield,
  ShieldCheck,
  Compass,
  ArrowRight,
  ShieldAlert,
  Fingerprint,
  Radio,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface AdminPortalProps {
  onBackToSchool: () => void;
  onNavigateToInspector: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onBackToSchool,
  onNavigateToInspector
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('admin@khairpur.edu.pk');
  const [password, setPassword] = useState<string>('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sub-tab: Dashboard (3 Divs) vs Attendance History vs Student Approvals
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance_history' | 'student_approvals'>('dashboard');

  // Add School Modal State
  const [isAddSchoolOpen, setIsAddSchoolOpen] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolSemis, setNewSchoolSemis] = useState('');
  const [newSchoolTaluka, setNewSchoolTaluka] = useState<School['taluka']>('Khairpur');
  const [newSchoolVillage, setNewSchoolVillage] = useState('');
  const [newSchoolLat, setNewSchoolLat] = useState('27.5295');
  const [newSchoolLng, setNewSchoolLng] = useState('68.7592');
  const [newSchoolBudget, setNewSchoolBudget] = useState('1800000');
  const [addSchoolSuccess, setAddSchoolSuccess] = useState<string | null>(null);

  // Send Inspection Request Modal State
  const [isSendInspectionOpen, setIsSendInspectionOpen] = useState(false);
  const [targetSchoolId, setTargetSchoolId] = useState('');
  const [targetInspectorId, setTargetInspectorId] = useState('');
  const [inspectionMode, setInspectionMode] = useState<'physical' | 'online'>('online');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [inspectionSentSuccess, setInspectionSentSuccess] = useState<string | null>(null);

  // Attendance History Filter State
  const [historyFilter, setHistoryFilter] = useState<'all' | 'teachers' | 'students'>('all');
  const [historySearch, setHistorySearch] = useState('');

  // Store data
  const schools = truthTrailStore.schools;
  // "admin can see 3 schools for now and can add another school if want"
  const displaySchools = schools; 

  const teachers = truthTrailStore.teachers;
  const teacherCheckIns = truthTrailStore.teacherCheckIns;
  const attendanceRecords = truthTrailStore.attendanceRecords;
  const inspectionRequests = truthTrailStore.inspectionRequests;
  const inspectors = truthTrailStore.inspectors;
  const pendingStudents = truthTrailStore.students.filter(s => s.verificationStatus === 'pending_admin_approval');

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsAuthenticated(true);
      setLoginError(null);
    } else {
      setLoginError('Please enter valid administrative credentials.');
    }
  };

  const handleQuickLogin = () => {
    setEmail('admin@khairpur.edu.pk');
    setPassword('admin123');
    setIsAuthenticated(true);
  };

  // Handle Add School
  const handleAddSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newSchoolSemis) return;

    truthTrailStore.addSchool({
      semisCode: newSchoolSemis.trim(),
      name: newSchoolName.trim(),
      taluka: newSchoolTaluka,
      unionCouncil: 'Central Union Council',
      villageName: newSchoolVillage.trim() || 'Rural Deh Cluster',
      villageEstimatedPopulation: 2500,
      coordinates: {
        latitude: parseFloat(newSchoolLat) || 27.5295,
        longitude: parseFloat(newSchoolLng) || 68.7592
      },
      geofenceRadiusMeters: 150,
      enrolledStudentsCount: 0,
      assignedTeachersCount: 2,
      status: 'active',
      establishedYear: 2026,
      hasElectricity: true,
      hasCleanWater: true,
      hasBoundaryWall: true,
      functionalToilets: 2,
      classroomCount: 4,
      budgetAllocatedPKR: parseFloat(newSchoolBudget) || 1800000
    });

    setAddSchoolSuccess(`School "${newSchoolName}" registered successfully with SEMIS ${newSchoolSemis}!`);
    setIsAddSchoolOpen(false);
    setNewSchoolName('');
    setNewSchoolSemis('');
    setNewSchoolVillage('');
    setTimeout(() => setAddSchoolSuccess(null), 5000);
  };

  // Handle Send Inspection Request
  const handleSendInspectionRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const schoolId = targetSchoolId || schools[0]?.id;
    const inspId = targetInspectorId || inspectors[0]?.id;

    truthTrailStore.createInspectionRequest({
      schoolId,
      inspectorId: inspId,
      mode: inspectionMode,
      notes: inspectionNotes || `Formal inspection dispatched by District Admin.`
    });

    const targetSchool = schools.find(s => s.id === schoolId);
    const targetInsp = inspectors.find(i => i.id === inspId);
    setInspectionSentSuccess(
      `Inspection call dispatched for ${targetSchool?.name || 'School'} assigned to ${targetInsp?.pseudonym || 'Inspector'} (${inspectionMode.toUpperCase()})!`
    );

    setIsSendInspectionOpen(false);
    setInspectionNotes('');
    setTimeout(() => setInspectionSentSuccess(null), 5000);
  };

  // Handle Verify Student
  const handleVerifyStudent = (studentId: string, status: 'approved' | 'rejected') => {
    truthTrailStore.verifyStudentRequest(studentId, status);
  };

  // 1. IF NOT LOGGED IN -> HIGH-ELEGANCE OFFICIAL ADMIN LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 bg-radial from-slate-100 via-slate-50 to-slate-200/60 dark:from-[#0B101B] dark:via-[#090D16] dark:to-[#05070C]">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl shadow-slate-200/50 dark:shadow-black/40 space-y-6 relative overflow-hidden">
          
          {/* Subtle top decorative accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700"></div>

          {/* Header */}
          <div className="text-center space-y-2 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-700/20 ring-4 ring-emerald-50 dark:ring-emerald-950/40">
              <ShieldCheck className="w-7 h-7" />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                District Admin Directorate
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                School Education & Literacy Department · Khairpur Mirs
              </p>
            </div>
          </div>

          {/* Notice box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Restricted portal for District Education Officers (DEO) & Central Auditors. Authorizes school creation, inspector dispatch, and biometric roll oversight.
            </span>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Official Government Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@khairpur.edu.pk"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Security Password / Passcode
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Authenticate & Sign In</span>
            </button>
          </form>

          {/* 1-Click Fast Demo Login */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <button
              onClick={handleQuickLogin}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Fingerprint className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>1-Click Demo Login (Admin Access)</span>
            </button>

            <button
              onClick={onBackToSchool}
              className="w-full text-center text-xs text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              &larr; Switch to Open School Terminal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN ADMIN PORTAL
  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col font-sans">
      {/* Admin Secondary Sub-Bar */}
      <nav aria-label="Admin Sub Navigation" className="border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#0D131F]/80 backdrop-blur-md sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Khairpur District Directorate</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              DEO Administrative Console
            </span>
          </div>

          {/* Sub-Tabs: Dashboard (3 Divs) | Attendance History | Student Approvals */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              3 Core Divisions
            </button>

            <button
              onClick={() => setActiveTab('attendance_history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'attendance_history'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Attendance History</span>
            </button>

            <button
              onClick={() => setActiveTab('student_approvals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'student_approvals'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Student Verification</span>
              {pendingStudents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white font-bold text-[9px]">
                  {pendingStudents.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToSchool}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-xs font-semibold transition-colors"
            >
              School Kiosk
            </button>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        
        {/* Banner Alert Feedback */}
        {addSchoolSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs rounded-2xl flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">{addSchoolSuccess}</span>
            </div>
            <button onClick={() => setAddSchoolSuccess(null)} className="text-emerald-700 dark:text-emerald-400 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {inspectionSentSuccess && (
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 text-xs rounded-2xl flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
              <span className="font-medium">{inspectionSentSuccess}</span>
            </div>
            <button onClick={() => setInspectionSentSuccess(null)} className="text-blue-700 dark:text-blue-400 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: 3 DEDICATED DIVS (SCHOOLS, TEACHERS IN/OUT, INSPECTIONS OCCUR) */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top Overview Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  District Oversight Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time synchronization across Schools, Faculty In/Out Telemetry, and Independent Field Audits.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddSchoolOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another School</span>
                </button>
                <button
                  onClick={() => setIsSendInspectionOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Inspection Request</span>
                </button>
              </div>
            </div>

            {/* DIV 1: SCHOOLS SECTION (ADMIN CAN SEE 3 SCHOOLS FOR NOW & CAN ADD ANOTHER) */}
            <section className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Division 1: Schools Registry</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({displaySchools.slice(0, 3).length} of {displaySchools.length} registered schools shown)
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">Institutional profiles, SEMIS identifiers, geofence radius & risk scoring</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddSchoolOpen(true)}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Add School</span>
                </button>
              </div>

              {/* 3 Schools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displaySchools.slice(0, 3).map((school, index) => {
                  const isHighRisk = school.riskScore >= 70;
                  const isMediumRisk = school.riskScore >= 35 && school.riskScore < 70;

                  return (
                    <div
                      key={school.id}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Header line */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-semibold text-slate-400">School 0{index + 1}</span>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                              {school.name}
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              SEMIS: <span className="font-mono font-semibold">{school.semisCode}</span> · {school.taluka}
                            </p>
                          </div>

                          <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono shrink-0 ${
                            isHighRisk
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900'
                              : isMediumRisk
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                          }`}>
                            Risk: {school.riskScore}/100
                          </div>
                        </div>

                        {/* Visual Risk Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isHighRisk ? 'bg-red-600' : isMediumRisk ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${Math.max(8, school.riskScore)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Village: {school.villageName}</span>
                            <span>{school.establishedYear} Est.</span>
                          </div>
                        </div>

                        {/* Metric Tiles */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="p-2 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Enrolled Students</span>
                            <span className="font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                              {school.enrolledStudentsCount}
                            </span>
                          </div>
                          <div className="p-2 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Assigned Teachers</span>
                            <span className="font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                              {school.assignedTeachersCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="text-[11px] text-slate-500 flex justify-between items-center pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>&le; {school.geofenceRadiusMeters}m Geofence</span>
                        </span>
                        <span className={`font-semibold capitalize text-[10px] px-2 py-0.5 rounded-md ${
                          school.status === 'confirmed_ghost'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/40'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                        }`}>
                          {school.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* DIV 2: TEACHERS SECTION (RECORD OF ATTENDANCE AND TEACHER IN / OUT) */}
            <section className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Division 2: Teachers Division (Record of Teacher IN / OUT)
                    </h2>
                    <p className="text-xs text-slate-500">Live attendance status, GPS geofence checks, and facial liveness telemetry</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-mono">
                    {teachers.filter(t => (t.status || 'in') === 'in').length} On-Duty (IN) / {teachers.length} Assigned
                  </span>
                </div>
              </div>

              {/* Teachers Telemetry Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/70 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Teacher Name & CNIC</th>
                      <th className="py-2.5 px-3">Assigned School</th>
                      <th className="py-2.5 px-3 text-center">Status (IN / OUT)</th>
                      <th className="py-2.5 px-3">Last Action Recorded</th>
                      <th className="py-2.5 px-3 text-right">Geofence Distance</th>
                      <th className="py-2.5 px-3 text-right">Liveness Scan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-transparent">
                    {teachers.map(teacher => {
                      const school = schools.find(s => s.id === teacher.schoolId);
                      const isTeacherIn = (teacher.status || 'in') === 'in';
                      return (
                        <tr key={teacher.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 dark:text-white block">{teacher.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">CNIC: {teacher.cnic}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                            <span className="font-medium">{school?.name || 'Assigned School'}</span>
                            <span className="text-[10px] block text-slate-400 font-mono">SEMIS: {school?.semisCode}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              isTeacherIn 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300' 
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isTeacherIn ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}></span>
                              <span>{isTeacherIn ? 'IN (Checked In)' : 'OUT (Checked Out)'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                            {teacher.lastCheckIn ? (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{new Date(teacher.lastCheckIn.timestamp).toLocaleTimeString()}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">No action logged today</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {teacher.lastCheckIn ? (
                              <span className={`font-mono font-bold text-xs ${
                                teacher.lastCheckIn.withinGeofence 
                                  ? 'text-emerald-700 dark:text-emerald-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {teacher.lastCheckIn.distanceMeters}m ({teacher.lastCheckIn.withinGeofence ? 'Verified Inside' : 'BREACH OUTSIDE'})
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {teacher.lastCheckIn?.livenessPassed ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Liveness Verified</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Unverified Manual</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* DIV 3: INSPECTIONS OCCUR SECTION */}
            <section className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Division 3: Inspections Occur Division
                    </h2>
                    <p className="text-xs text-slate-500">Audits dispatched, inspector assignment tracking & live school head acceptance</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSendInspectionOpen(true)}
                  className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request to Inspector</span>
                </button>
              </div>

              {/* Inspection Requests Timeline / Cards */}
              <div className="space-y-3">
                {inspectionRequests.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl text-xs">
                    No inspection requests have been created yet. Click "Send Request to Inspector" to dispatch an audit call.
                  </div>
                ) : (
                  inspectionRequests.map(req => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{req.schoolName}</span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="font-mono text-emerald-800 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                            Auditor: {req.inspectorPseudonym}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="capitalize font-bold text-slate-700 dark:text-slate-300">
                            Mode: {req.mode === 'online' ? 'Surprise Online Video' : 'Physical On-Site'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{req.notes}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'accepted_by_head'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : req.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}>
                          {req.status === 'accepted_by_head' ? 'Accepted by School Head' : req.status.replace('_', ' ')}
                        </span>

                        {req.mode === 'online' && req.status === 'accepted_by_head' && (
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <Video className="w-3.5 h-3.5 animate-pulse" />
                            <span>Live Video Roll Room Active</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CENTRAL ATTENDANCE LEDGER / HISTORY */}
        {/* ========================================================================= */}
        {activeTab === 'attendance_history' && (
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Central Attendance Ledger & Historical Roll Call</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Tamper-resistant audit trail with timestamps, biometric confidence scores, and GPS geofence distances.
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      historyFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    All Records
                  </button>
                  <button
                    onClick={() => setHistoryFilter('teachers')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      historyFilter === 'teachers' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Teachers Only
                  </button>
                  <button
                    onClick={() => setHistoryFilter('students')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      historyFilter === 'students' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Students Only
                  </button>
                </div>
              </div>
            </div>

            {/* Filtered Attendance Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Entity Type</th>
                    <th className="py-2.5 px-3">Name / ID</th>
                    <th className="py-2.5 px-3">School Name</th>
                    <th className="py-2.5 px-3">Verification Method</th>
                    <th className="py-2.5 px-3 text-right">Geofence Distance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-transparent">
                  {/* Teacher Check-ins */}
                  {(historyFilter === 'all' || historyFilter === 'teachers') &&
                    teacherCheckIns.map(tc => {
                      const sc = schools.find(s => s.id === tc.schoolId);
                      return (
                        <tr key={tc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            {new Date(tc.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-semibold text-emerald-800 dark:text-emerald-400">
                            Teacher ({String(tc?.type || 'IN').toUpperCase()})
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            {tc.teacherName}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                            {sc?.name || 'School'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                              Facial Liveness Verified (98%)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            <span className={tc.withinGeofence ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                              {tc.distanceMeters}m
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                  {/* Student Records */}
                  {(historyFilter === 'all' || historyFilter === 'students') &&
                    attendanceRecords.map(ar => {
                      const sc = schools.find(s => s.id === ar.schoolId);
                      return (
                        <tr key={ar.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            {new Date(ar.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-semibold text-purple-700 dark:text-purple-400">
                            Student Roll
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            {ar.studentName} <span className="font-mono text-[10px] text-slate-400">({ar.studentId})</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                            {sc?.name || 'School'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 font-bold text-[10px]">
                              Facial Matched (96%)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {ar.distanceFromSchool}m
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: STUDENT APPROVALS (REQUESTED BY SCHOOL -> VERIFIED BY ADMIN) */}
        {/* ========================================================================= */}
        {activeTab === 'student_approvals' && (
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Pending Student Enrollment Verification Queue</span>
              </h2>
              <p className="text-xs text-slate-500">
                School kiosks submit admission requests. District Admin verifies NADRA B-Form data before the child is eligible to record attendance.
              </p>
            </div>

            {pendingStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 border border-dashed rounded-2xl text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto opacity-60" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Queue is completely clear!</p>
                <p className="text-slate-500">No pending student enrollment verification requests from school kiosks.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                {pendingStudents.map(student => {
                  const school = schools.find(s => s.id === student.schoolId);
                  return (
                    <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{student.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-200/60 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                            {student.studentId}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-[10px]">
                            Grade {student.grade} · {student.gender === 'boy' ? 'Male' : 'Female'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">
                          School: <strong className="text-slate-700 dark:text-slate-300">{school?.name}</strong> · Guardian: {student.guardianName} ({student.guardianPhone})
                        </p>
                        {student.requestNote && (
                          <p className="text-slate-600 dark:text-slate-400 italic text-[11px]">
                            Note from School Kiosk: "{student.requestNote}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleVerifyStudent(student.id, 'approved')}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Verify & Approve</span>
                        </button>
                        <button
                          onClick={() => handleVerifyStudent(student.id, 'rejected')}
                          className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-600 hover:text-white font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: ADD ANOTHER SCHOOL */}
      {isAddSchoolOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsAddSchoolOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Register New School</h3>
                <p className="text-[11px] text-slate-500">Add an institutional record to the Khairpur District Registry</p>
              </div>
            </div>

            <form onSubmit={handleAddSchoolSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Official School Name *</label>
                <input
                  type="text"
                  required
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="e.g. GBPS Kot Laloo Central"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">SEMIS Code *</label>
                  <input
                    type="text"
                    required
                    value={newSchoolSemis}
                    onChange={(e) => setNewSchoolSemis(e.target.value)}
                    placeholder="415050123"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Taluka *</label>
                  <select
                    value={newSchoolTaluka}
                    onChange={(e) => setNewSchoolTaluka(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    <option value="Khairpur">Khairpur</option>
                    <option value="Kot Diji">Kot Diji</option>
                    <option value="Kingri">Kingri</option>
                    <option value="Gambat">Gambat</option>
                    <option value="Sobhodero">Sobhodero</option>
                    <option value="Nara">Nara</option>
                    <option value="Faiz Ganj">Faiz Ganj</option>
                    <option value="Thari Mirwah">Thari Mirwah</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Village / Deh Settlement</label>
                <input
                  type="text"
                  value={newSchoolVillage}
                  onChange={(e) => setNewSchoolVillage(e.target.value)}
                  placeholder="Goth Laloo"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Registered Latitude</label>
                  <input
                    type="text"
                    value={newSchoolLat}
                    onChange={(e) => setNewSchoolLat(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Registered Longitude</label>
                  <input
                    type="text"
                    value={newSchoolLng}
                    onChange={(e) => setNewSchoolLng(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSchoolOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                >
                  Save & Register School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND INSPECTION REQUEST */}
      {isSendInspectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsSendInspectionOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Dispatch Inspection Request</h3>
                <p className="text-[11px] text-slate-500">Initiate an independent audit call (Physical On-Site or Online Video)</p>
              </div>
            </div>

            <form onSubmit={handleSendInspectionRequest} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Target School *</label>
                <select
                  value={targetSchoolId}
                  onChange={(e) => setTargetSchoolId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.taluka})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Assign Auditor *</label>
                  <select
                    value={targetInspectorId}
                    onChange={(e) => setTargetInspectorId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    {inspectors.map(i => (
                      <option key={i.id} value={i.id}>{i.pseudonym} (Home: {i.homeTaluka})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Audit Mode *</label>
                  <select
                    value={inspectionMode}
                    onChange={(e) => setInspectionMode(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    <option value="online">Surprise Online Video Roll Call</option>
                    <option value="physical">Physical On-Site Audit</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Audit Directives / Instructions</label>
                <textarea
                  rows={3}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Check student headcount against register and verify padlocked gate..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSendInspectionOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs"
                >
                  Dispatch Inspection Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

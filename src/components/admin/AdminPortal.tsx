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
  Compass
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

  // Store data
  const schools = truthTrailStore.schools;
  // "admin can see 3 schools for now and can add another school if want"
  // If there are more than 3 schools, we default to the first 3 unless user adds more
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
      notes: inspectionNotes || `Urgent audit request dispatched by District Admin.`
    });

    setInspectionSentSuccess(`Inspection request dispatched to inspector for school!`);
    setIsSendInspectionOpen(false);
    setInspectionNotes('');
    setTimeout(() => setInspectionSentSuccess(null), 5000);
  };

  // Handle Verify Student
  const handleVerifyStudent = (studentId: string, status: 'approved' | 'rejected') => {
    truthTrailStore.verifyStudentRequest(studentId, status);
  };

  // 1. IF NOT LOGGED IN -> FORMAL ADMIN LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center mx-auto shadow-md">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              District Admin Portal Login
            </h1>
            <p className="text-xs text-slate-500">
              Directorate of School Education · Khairpur Division
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@khairpur.edu.pk"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-transform active:scale-98 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In to Admin Portal</span>
            </button>
          </form>

          {/* Quick Demo Access Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <button
              onClick={handleQuickLogin}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5"
            >
              <span>1-Click Demo Login as District Admin</span>
            </button>

            <button
              onClick={onBackToSchool}
              className="text-xs text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium block mx-auto mt-2"
            >
              &larr; Return to School Attendance Terminal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN ADMIN PORTAL
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-emerald-800 dark:text-emerald-400">
              TruthTrail Admin Directorate
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 font-medium">Khairpur Division</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              3-Section Dashboard
            </button>

            <button
              onClick={() => setActiveTab('attendance_history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'attendance_history'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Attendance History</span>
            </button>

            <button
              onClick={() => setActiveTab('student_approvals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'student_approvals'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToSchool}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              School Terminal
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="p-2 text-slate-500 hover:text-red-600"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {addSchoolSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{addSchoolSuccess}</span>
          </div>
        )}

        {inspectionSentSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{inspectionSentSuccess}</span>
          </div>
        )}

        {/* TAB 1: 3 DEDICATED DIVS (SCHOOLS, TEACHERS, INSPECTIONS OCCUR) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  District Oversight Dashboard
                </h1>
                <p className="text-xs text-slate-500">
                  Three core divisions: 1. Schools Registry, 2. Teachers In/Out Telemetry, 3. Inspections Occurred
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddSchoolOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another School</span>
                </button>
                <button
                  onClick={() => setIsSendInspectionOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Inspection Request</span>
                </button>
              </div>
            </div>

            {/* DIV 1: SCHOOLS SECTION (ADMIN CAN SEE 3 SCHOOLS FOR NOW & ADD ANOTHER) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      DIV 1: Schools Division ({displaySchools.slice(0, 3).length} Shown · Total: {displaySchools.length})
                    </h2>
                    <p className="text-[11px] text-slate-500">Institutional profiles, SEMIS codes, risk score & enrollment</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddSchoolOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add School</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displaySchools.slice(0, 3).map((school, index) => (
                  <div
                    key={school.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">School #{index + 1}</span>
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                          {school.name}
                        </h3>
                        <p className="text-[11px] text-slate-500">SEMIS: {school.semisCode} · {school.taluka}</p>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        school.riskScore >= 70 ? 'bg-red-100 text-red-700' : school.riskScore >= 35 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Risk: {school.riskScore}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Enrolled Students</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">{school.enrolledStudentsCount}</span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Teachers Count</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">{school.assignedTeachersCount}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <span>Geofence: &le; {school.geofenceRadiusMeters}m</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 capitalize">{school.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DIV 2: TEACHERS SECTION (RECORD OF ATTENDANCE AND TEACHER IN / OUT) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      DIV 2: Teachers Division (Record of Teacher IN / OUT)
                    </h2>
                    <p className="text-[11px] text-slate-500">Live attendance check-in & check-out status with geofence & liveness metrics</p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-slate-500">
                  {teachers.filter(t => (t.status || 'in') === 'in').length} Currently IN / {teachers.length} Total
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-2">Teacher Name & CNIC</th>
                      <th className="pb-2">Assigned School</th>
                      <th className="pb-2 text-center">Current Status</th>
                      <th className="pb-2">Last Action Timestamp</th>
                      <th className="pb-2 text-right">Geofence Distance</th>
                      <th className="pb-2 text-right">Liveness Scan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {teachers.map(teacher => {
                      const school = schools.find(s => s.id === teacher.schoolId);
                      const isTeacherIn = (teacher.status || 'in') === 'in';
                      return (
                        <tr key={teacher.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                          <td className="py-3">
                            <span className="font-bold text-slate-900 dark:text-white block">{teacher.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">CNIC: {teacher.cnic}</span>
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            {school?.name || 'Assigned School'}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isTeacherIn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {isTeacherIn ? 'IN (Checked In)' : 'OUT (Checked Out)'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500 font-mono text-[11px]">
                            {teacher.lastCheckIn ? new Date(teacher.lastCheckIn.timestamp).toLocaleTimeString() : 'No record today'}
                          </td>
                          <td className="py-3 text-right">
                            {teacher.lastCheckIn ? (
                              <span className={`font-mono font-bold ${teacher.lastCheckIn.withinGeofence ? 'text-emerald-700' : 'text-red-600'}`}>
                                {teacher.lastCheckIn.distanceMeters}m ({teacher.lastCheckIn.withinGeofence ? 'Inside' : 'BREACH'})
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-3 text-right">
                            {teacher.lastCheckIn?.livenessPassed ? (
                              <span className="text-emerald-700 font-bold text-[10px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Passed (98%)</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Unverified</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DIV 3: INSPECTIONS OCCUR SECTION */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 flex items-center justify-center">
                    <ClipboardCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      DIV 3: Inspections Occur Division
                    </h2>
                    <p className="text-[11px] text-slate-500">Inspections occurred, dispatched audit requests & live school head acceptance</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSendInspectionOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request to Inspector</span>
                </button>
              </div>

              <div className="space-y-3">
                {inspectionRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{req.schoolName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-emerald-800 dark:text-emerald-400 font-semibold">Auditor: {req.inspectorPseudonym}</span>
                        <span className="text-slate-400">·</span>
                        <span className="capitalize font-bold text-slate-600 dark:text-slate-300">Mode: {req.mode}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{req.notes}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        req.status === 'accepted_by_head'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status === 'accepted_by_head' ? 'Accepted by School Head' : req.status.replace('_', ' ')}
                      </span>

                      {req.mode === 'online' && req.status === 'accepted_by_head' && (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" />
                          <span>Video Room Live</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE HISTORY */}
        {activeTab === 'attendance_history' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-700" />
                <span>Central Attendance Ledger & Historical Roll Call</span>
              </h2>
              <p className="text-xs text-slate-500">Every recorded student attendance and teacher check-in with GPS distance verification</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2.5 font-semibold">Date & Time</th>
                    <th className="pb-2.5 font-semibold">Entity Type</th>
                    <th className="pb-2.5 font-semibold">Name / ID</th>
                    <th className="pb-2.5 font-semibold">School</th>
                    <th className="pb-2.5 font-semibold">Verification Method</th>
                    <th className="pb-2.5 font-semibold text-right">Geofence Distance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Teachers checkins */}
                  {teacherCheckIns.map(tc => {
                    const sc = schools.find(s => s.id === tc.schoolId);
                    return (
                      <tr key={tc.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-mono text-[11px] text-slate-500">
                          {new Date(tc.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 font-semibold text-emerald-800 dark:text-emerald-400">
                          Teacher ({String(tc?.type || 'IN').toUpperCase()})
                        </td>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                          {tc.teacherName}
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300">
                          {sc?.name}
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Facial Liveness Verified (98%)
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold">
                          <span className={tc.withinGeofence ? 'text-emerald-700' : 'text-red-600'}>
                            {tc.distanceMeters}m
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Student Records */}
                  {attendanceRecords.map(ar => {
                    const sc = schools.find(s => s.id === ar.schoolId);
                    return (
                      <tr key={ar.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-mono text-[11px] text-slate-500">
                          {new Date(ar.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 font-semibold text-purple-700">
                          Student Roll
                        </td>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                          {ar.studentName} ({ar.studentId})
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300">
                          {sc?.name}
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                            Facial Matched (96%)
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-700">
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

        {/* TAB 3: STUDENT APPROVALS (REQUESTED BY SCHOOL -> VERIFIED BY ADMIN) */}
        {activeTab === 'student_approvals' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>Pending Student Enrollment Verification Queue</span>
              </h2>
              <p className="text-xs text-slate-500">
                Schools request new students here. Only after District Admin verifies B-Form details does the student appear on the school's attendance terminal.
              </p>
            </div>

            {pendingStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No pending student enrollment verification requests at this time.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-2xl overflow-hidden text-xs">
                {pendingStudents.map(student => {
                  const school = schools.find(s => s.id === student.schoolId);
                  return (
                    <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{student.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{student.studentId}</span>
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                            Grade {student.grade}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          School: <strong className="text-slate-700 dark:text-slate-300">{school?.name}</strong> · Guardian: {student.guardianName} ({student.guardianPhone})
                        </p>
                        {student.requestNote && (
                          <p className="text-slate-600 dark:text-slate-400 italic text-[11px] mt-1">
                            Note from School: "{student.requestNote}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleVerifyStudent(student.id, 'approved')}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsAddSchoolOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b pb-3">
              <Building2 className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Add New Government School</h3>
            </div>

            <form onSubmit={handleAddSchoolSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">School Full Name *</label>
                <input
                  type="text"
                  required
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="e.g. GBPS Kot Laloo Central"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">SEMIS Code *</label>
                  <input
                    type="text"
                    required
                    value={newSchoolSemis}
                    onChange={(e) => setNewSchoolSemis(e.target.value)}
                    placeholder="415050123"
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Taluka *</label>
                  <select
                    value={newSchoolTaluka}
                    onChange={(e) => setNewSchoolTaluka(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800"
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

              <div>
                <label className="block font-semibold mb-1">Village / Deh Settlement</label>
                <input
                  type="text"
                  value={newSchoolVillage}
                  onChange={(e) => setNewSchoolVillage(e.target.value)}
                  placeholder="Goth Laloo"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Latitude</label>
                  <input
                    type="text"
                    value={newSchoolLat}
                    onChange={(e) => setNewSchoolLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Longitude</label>
                  <input
                    type="text"
                    value={newSchoolLng}
                    onChange={(e) => setNewSchoolLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSchoolOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsSendInspectionOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b pb-3">
              <Send className="w-5 h-5 text-blue-700" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Send Inspection Request</h3>
            </div>

            <form onSubmit={handleSendInspectionRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Target School *</label>
                <select
                  value={targetSchoolId}
                  onChange={(e) => setTargetSchoolId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.taluka})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Assign Inspector *</label>
                  <select
                    value={targetInspectorId}
                    onChange={(e) => setTargetInspectorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    {inspectors.map(i => (
                      <option key={i.id} value={i.id}>{i.pseudonym} (Home: {i.homeTaluka})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Audit Mode *</label>
                  <select
                    value={inspectionMode}
                    onChange={(e) => setInspectionMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    <option value="online">Online Surprise Roll Call</option>
                    <option value="physical">Physical On-Site Audit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Instructions / Specific Directives</label>
                <textarea
                  rows={3}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Check student headcount against register and verify padlocked gate..."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSendInspectionOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs"
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

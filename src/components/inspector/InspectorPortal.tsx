import React, { useState } from 'react';
import { 
  InspectorProfile, 
  InspectionAssignment, 
  School, 
  InspectionReport, 
  LocationCoordinates,
  InspectionRequest
} from '../../types';
import { truthTrailStore } from '../../services/storage';
import { isWithinGeofence, createOffsetCoordinate } from '../../services/geofence';
import { LeafletMap } from '../common/LeafletMap';
import { 
  ClipboardCheck, 
  Camera, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  FileCheck, 
  Video, 
  Check, 
  LogOut, 
  ArrowLeft, 
  LogIn, 
  AlertCircle,
  Shield,
  Compass,
  ArrowRight,
  Radio,
  FileSignature
} from 'lucide-react';

interface InspectorPortalProps {
  currentInspector: InspectorProfile;
  assignments: InspectionAssignment[];
  schools: School[];
  reports: InspectionReport[];
  isOffline: boolean;
  onBackToSchool: () => void;
}

export const InspectorPortal: React.FC<InspectorPortalProps> = ({
  currentInspector,
  assignments,
  schools,
  reports,
  isOffline,
  onBackToSchool
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inspectorCode, setInspectorCode] = useState<string>('INS-7K2Q');
  const [inspectorPin, setInspectorPin] = useState<string>('1234');
  const [authError, setAuthError] = useState<string | null>(null);

  // Inspector's requests & assignments
  const inspectionRequests = truthTrailStore.inspectionRequests.filter(
    r => r.inspectorPseudonym === currentInspector.pseudonym || r.inspectorId === currentInspector.id
  );

  const myAssignments = assignments.filter(a => a.inspectorId === currentInspector.id);
  const activeAssignment = myAssignments.find(a => a.status !== 'submitted') || myAssignments[0];
  const assignedSchool = activeAssignment ? schools.find(s => s.id === activeAssignment.schoolId) : null;

  // Visit scheduling
  const [selectedVisitDate, setSelectedVisitDate] = useState(
    activeAssignment?.scheduledVisitDate || new Date().toISOString().split('T')[0]
  );
  const [visitScheduledSuccess, setVisitScheduledSuccess] = useState(false);

  // Active step
  const [activeStep, setActiveStep] = useState<'requests' | 'schedule' | 'geofence' | 'audit_checklist'>('requests');

  // GPS Simulation
  const [gpsSimMode, setGpsSimMode] = useState<'at_school' | 'outside'>('at_school');
  const inspectorCoordinates: LocationCoordinates = assignedSchool
    ? gpsSimMode === 'at_school'
      ? createOffsetCoordinate(assignedSchool.coordinates, 8, -5)
      : createOffsetCoordinate(assignedSchool.coordinates, 2800, 1500)
    : { latitude: 27.5295, longitude: 68.7592 };

  const geofenceResult = assignedSchool
    ? isWithinGeofence(inspectorCoordinates, assignedSchool.coordinates, assignedSchool.geofenceRadiusMeters)
    : { within: true, distanceMeters: 10 };

  // Physical Audit Checklist Fields
  const [gateStatus, setGateStatus] = useState<'open' | 'locked' | 'dilapidated' | 'abandoned'>('open');
  const [studentsCounted, setStudentsCounted] = useState<number>(assignedSchool?.enrolledStudentsCount || 0);
  const [teacherPresent, setTeacherPresent] = useState<boolean>(true);
  const [teacherNameObserved, setTeacherNameObserved] = useState<string>('Rasheed Ahmed Abbasi');
  const [facilityWater, setFacilityWater] = useState<boolean>(true);
  const [facilityElectricity, setFacilityElectricity] = useState<boolean>(true);
  const [facilityToilets, setFacilityToilets] = useState<boolean>(true);
  const [facilityTextbooks, setFacilityTextbooks] = useState<boolean>(true);
  const [facilityMeals, setFacilityMeals] = useState<boolean>(true);
  const [inspectorNotes, setInspectorNotes] = useState<string>('');
  const [verdict, setVerdict] = useState<InspectionReport['verdict']>('fully_functional');

  // Online Audit Fields
  const [onlineResponseTime, setOnlineResponseTime] = useState<number>(3.5);
  const [onlineCallAnswered, setOnlineCallAnswered] = useState<boolean>(true);
  const [onlineStudentsShown, setOnlineStudentsShown] = useState<number>(24);

  const [submittedReport, setSubmittedReport] = useState<InspectionReport | null>(null);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inspectorCode && inspectorPin) {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Please enter inspector pseudonym and PIN.');
    }
  };

  const handleQuickLogin = () => {
    setInspectorCode('INS-7K2Q');
    setInspectorPin('1234');
    setIsAuthenticated(true);
  };

  // Schedule visit handler
  const handleSaveVisitSchedule = () => {
    if (!activeAssignment) return;
    truthTrailStore.setInspectorVisitDate(activeAssignment.id, selectedVisitDate);
    setVisitScheduledSuccess(true);
    setTimeout(() => setVisitScheduledSuccess(false), 4000);
  };

  // Submit Final Report
  const handleSubmitAudit = () => {
    if (!activeAssignment || !assignedSchool) return;

    const discrepancy = assignedSchool.enrolledStudentsCount > 0
      ? Math.round(((assignedSchool.enrolledStudentsCount - studentsCounted) / assignedSchool.enrolledStudentsCount) * 100)
      : 0;

    const report = truthTrailStore.submitInspectionReport(activeAssignment.id, {
      batchId: activeAssignment.batchId,
      schoolId: assignedSchool.id,
      schoolName: assignedSchool.name,
      inspectorPseudonym: currentInspector.pseudonym,
      inspectionMode: activeAssignment.mode,
      gpsCheckIn: {
        coordinates: inspectorCoordinates,
        distanceMeters: geofenceResult.distanceMeters,
        withinGeofence: geofenceResult.within,
        timestamp: new Date().toISOString()
      },
      physicalFindings: activeAssignment.mode === 'physical' ? {
        gateStatus,
        studentsCountedPhysically: studentsCounted,
        studentsEnrolledOnRegister: assignedSchool.enrolledStudentsCount,
        discrepancyPercent: discrepancy,
        teacherPresent,
        teacherNameObserved,
        infrastructureScore: (facilityWater ? 20 : 0) + (facilityElectricity ? 20 : 0) + (facilityToilets ? 20 : 0) + (facilityTextbooks ? 20 : 0) + (facilityMeals ? 20 : 0),
        facilitiesWorking: {
          drinkingWater: facilityWater,
          electricity: facilityElectricity,
          toiletsFunctional: facilityToilets,
          textbooksDistributed: facilityTextbooks,
          middayMealRunning: facilityMeals
        },
        photoEvidenceHashes: ['hash_evidence_gate_' + Date.now().toString(16), 'hash_evidence_class_' + Date.now().toString(16)],
        inspectorNotes: inspectorNotes || 'Physical surprise inspection executed. Gate checked, roll call audited.'
      } : undefined,
      onlineFindings: activeAssignment.mode === 'online_surprise' ? {
        responseTimeMinutes: onlineResponseTime,
        callAnswered: onlineCallAnswered,
        gpsVerifiedAtCallTime: true,
        studentsShownOnCamera: onlineStudentsShown,
        inspectorNotes: inspectorNotes || 'Surprise online video roll call conducted. Headcount verified on screen.'
      } : undefined,
      verdict
    });

    setSubmittedReport(report);
  };

  // 1. IF NOT LOGGED IN -> HIGH-ELEGANCE INSPECTOR LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 bg-radial from-slate-100 via-slate-50 to-slate-200/60 dark:from-[#0B101B] dark:via-[#090D16] dark:to-[#05070C]">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl shadow-slate-200/50 dark:shadow-black/40 space-y-6 relative overflow-hidden">
          
          {/* Subtle top decorative accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-700"></div>

          {/* Header */}
          <div className="text-center space-y-2 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-700/20 ring-4 ring-blue-50 dark:ring-blue-950/40">
              <ShieldCheck className="w-7 h-7" />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Field Inspector Portal
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pseudonymous Auditor Terminal · Khairpur Anti-Ghost Directorate
              </p>
            </div>
          </div>

          {/* Notice box */}
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/60 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              Zero-knowledge blind assignment: Inspectors are issued pseudonyms (e.g. INS-7K2Q) so District Admin cannot leak target visits to schools.
            </span>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Inspector Pseudonym Identifier *
              </label>
              <input
                type="text"
                required
                value={inspectorCode}
                onChange={(e) => setInspectorCode(e.target.value)}
                placeholder="e.g. INS-7K2Q"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Security PIN Code *
              </label>
              <input
                type="password"
                required
                value={inspectorPin}
                onChange={(e) => setInspectorPin(e.target.value)}
                placeholder="••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Enter Inspector Terminal</span>
            </button>
          </form>

          {/* 1-Click Fast Demo Login */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <button
              onClick={handleQuickLogin}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>1-Click Demo Login as INS-7K2Q</span>
            </button>

            <button
              onClick={onBackToSchool}
              className="w-full text-center text-xs text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium transition-colors"
            >
              &larr; Switch to Open School Terminal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN INSPECTOR PORTAL
  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col font-sans">
      
      {/* Inspector Secondary Sub-Bar */}
      <nav aria-label="Inspector Sub Navigation" className="border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#0D131F]/80 backdrop-blur-md sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          
          {/* Identity lockup */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Inspector Auditor Console
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
              {currentInspector.pseudonym}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToSchool}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold transition-colors"
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        
        {/* Banner with Veiled Assignment Safeguards */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographically Isolated Inspector Terminal</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Field Integrity Auditor: {currentInspector.pseudonym}
            </h1>
            <p className="text-xs text-slate-500">
              Assigned Home Taluka: <strong className="text-slate-700 dark:text-slate-300">{currentInspector.homeTaluka}</strong> (Anti-collusion rule active: Never assigned to home Taluka)
            </p>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl text-xs text-blue-950 dark:text-blue-300 shrink-0">
            <span className="font-bold block">Anonymous Protocol:</span>
            Your real identity is hidden from District Admin & school staff.
          </div>
        </div>

        {/* Section: Inspection Requests sent by Admin */}
        <section className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                <span>Inspection Requests Dispatched by District Admin ({inspectionRequests.length})</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Formal audit calls assigned directly to your pseudonym code
              </p>
            </div>
          </div>

          {inspectionRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl text-xs">
              No active inspection requests dispatched by admin at this time.
            </div>
          ) : (
            <div className="space-y-3">
              {inspectionRequests.map(req => {
                const isOnline = req.mode === 'online';
                const isHeadAccepted = req.status === 'accepted_by_head';
                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{req.schoolName}</span>
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 capitalize">
                          {req.mode === 'online' ? 'Online Video Roll' : 'Physical On-Site'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">{req.notes}</p>
                      {isOnline && (
                        <div className="pt-1 flex items-center gap-2 text-[11px]">
                          <span className="text-slate-400">School Head Status:</span>
                          {isHeadAccepted ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>School Head Accepted (Video Ready)</span>
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              Awaiting School Head Acceptance on School Portal
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveStep('audit_checklist')}
                      className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs shrink-0 transition-colors"
                    >
                      Conduct Inspection Now &rarr;
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ACTIVE INSPECTION WORKFLOW */}
        {submittedReport ? (
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Inspection Report Sealed & Lodged
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your audit findings have been cryptographically signed and stored in the central tamper-evident registry.
            </p>
            <div className="max-w-md mx-auto p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-left text-xs font-mono space-y-1.5">
              <div><strong>School:</strong> {submittedReport.schoolName}</div>
              <div><strong>Verdict:</strong> <span className="uppercase text-emerald-700 dark:text-emerald-400 font-bold">{submittedReport.verdict}</span></div>
              <div><strong>Seal Hash:</strong> {submittedReport.tamperSealHash.slice(0, 24)}...</div>
            </div>
            <button
              onClick={() => setSubmittedReport(null)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs"
            >
              Back to Overview
            </button>
          </div>
        ) : assignedSchool ? (
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Target Audit Station</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{assignedSchool.name}</h2>
                <p className="text-xs text-slate-500">SEMIS: {assignedSchool.semisCode} · Taluka: {assignedSchool.taluka}</p>
              </div>

              {/* Step Segmented Navigation */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setActiveStep('schedule')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeStep === 'schedule' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500'
                  }`}
                >
                  Schedule Date
                </button>
                <button
                  onClick={() => setActiveStep('geofence')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeStep === 'geofence' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500'
                  }`}
                >
                  GPS Check-In
                </button>
                <button
                  onClick={() => setActiveStep('audit_checklist')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeStep === 'audit_checklist' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500'
                  }`}
                >
                  Audit Checklist
                </button>
              </div>
            </div>

            {/* STEP 1: SCHEDULE */}
            {activeStep === 'schedule' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border space-y-1.5">
                  <h3 className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <Lock className="w-3.5 h-3.5 text-blue-700" />
                    <span>Private Inspection Date Chooser</span>
                  </h3>
                  <p className="text-slate-500">
                    Choose your unannounced visit date. This is held strictly confidential on your client device and is never revealed to the school.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={selectedVisitDate}
                    onChange={(e) => setSelectedVisitDate(e.target.value)}
                    className="px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 font-medium"
                  />
                  <button
                    onClick={handleSaveVisitSchedule}
                    className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold transition-colors"
                  >
                    Save Private Schedule
                  </button>
                  {visitScheduledSuccess && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Saved Confidentially!</span>
                    </span>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveStep('geofence')}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                  >
                    Proceed to GPS Check-In &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: GEOFENCE CHECKIN */}
            {activeStep === 'geofence' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <span className="font-semibold">GPS Location Simulation:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setGpsSimMode('at_school')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold ${gpsSimMode === 'at_school' ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      At School (8m)
                    </button>
                    <button
                      onClick={() => setGpsSimMode('outside')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold ${gpsSimMode === 'outside' ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      Outside (2.8km)
                    </button>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${geofenceResult.within ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:text-red-200'}`}>
                  <strong>{geofenceResult.within ? 'GPS Geofence Verified: On School Site' : 'Geofence Breach Alert'}</strong>
                  <p className="mt-1 text-[11px]">Distance from registered gate: {geofenceResult.distanceMeters}m (Allowed: &le; 150m)</p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
                  <LeafletMap
                    selectedSchool={assignedSchool}
                    showGeofence={true}
                    geofenceRadiusMeters={assignedSchool.geofenceRadiusMeters}
                    deviceLocation={inspectorCoordinates}
                    deviceLabel="Inspector GPS"
                    height="220px"
                    zoom={15}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveStep('audit_checklist')}
                    className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold"
                  >
                    Proceed to Audit Findings &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: AUDIT CHECKLIST */}
            {activeStep === 'audit_checklist' && (
              <div className="space-y-5 text-xs">
                {activeAssignment.mode === 'physical' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-bold mb-2">1. School Gate Condition</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'open', label: 'Open & Functional' },
                          { id: 'locked', label: 'Padlocked Rusted' },
                          { id: 'dilapidated', label: 'Dilapidated Ruins' },
                          { id: 'abandoned', label: 'Cattle Shed / Abandoned' }
                        ].map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setGateStatus(item.id as any)}
                            className={`p-3 rounded-xl border font-bold text-left transition-colors ${
                              gateStatus === item.id ? 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-950/70 dark:text-blue-200' : 'bg-slate-50 dark:bg-slate-800'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold mb-1">2. Physical Student Headcount</label>
                        <input
                          type="number"
                          value={studentsCounted}
                          onChange={(e) => setStudentsCounted(Number(e.target.value))}
                          className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                        />
                        <span className="text-[10px] text-slate-400">Paper Register claims: {assignedSchool.enrolledStudentsCount}</span>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Teacher Present</label>
                        <input
                          type="text"
                          value={teacherNameObserved}
                          onChange={(e) => setTeacherNameObserved(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 rounded-2xl space-y-1">
                      <strong className="flex items-center gap-1.5 text-blue-900 dark:text-blue-200">
                        <Video className="w-4 h-4" />
                        <span>Live Surprise Video Roll Call Findings</span>
                      </strong>
                      <p className="text-[11px] text-blue-800 dark:text-blue-300">
                        Verify teacher response time and children counted on camera screen.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-1">Response Time (Minutes)</label>
                        <input
                          type="number"
                          value={onlineResponseTime}
                          onChange={(e) => setOnlineResponseTime(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border font-mono font-bold bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Students Counted on Video</label>
                        <input
                          type="number"
                          value={onlineStudentsShown}
                          onChange={(e) => setOnlineStudentsShown(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border font-mono font-bold bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold mb-1">Auditor Field Notes</label>
                  <textarea
                    rows={3}
                    value={inspectorNotes}
                    onChange={(e) => setInspectorNotes(e.target.value)}
                    placeholder="Document padlocked locks, community witness testimonies, or facilities..."
                    className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Final Audit Verdict</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'fully_functional', label: 'Fully Functional' },
                      { id: 'needs_improvement', label: 'Needs Improvement' },
                      { id: 'partially_ghost', label: 'Partially Ghost' },
                      { id: 'confirmed_ghost', label: 'Confirmed Ghost' }
                    ].map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVerdict(v.id as any)}
                        className={`p-3 rounded-xl border font-bold text-left transition-colors ${
                          verdict === v.id ? 'bg-blue-700 text-white' : 'bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleSubmitAudit}
                    className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md transition-colors"
                  >
                    Seal & Submit Immutable Report
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No active assignment available.</p>
        )}
      </main>
    </div>
  );
};

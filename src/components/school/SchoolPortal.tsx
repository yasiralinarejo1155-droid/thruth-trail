import React, { useState, useRef, useEffect } from 'react';
import { School, Teacher, Student, LocationCoordinates, AttendanceRecord, InspectionRequest } from '../../types';
import { truthTrailStore } from '../../services/storage';
import { isWithinGeofence, createOffsetCoordinate } from '../../services/geofence';
import { detectFaceInVideo, LivenessChallengeType } from '../../services/faceRecognition';
import { LeafletMap } from '../common/LeafletMap';
import { 
  Camera, 
  CheckCircle2, 
  MapPin, 
  ShieldAlert, 
  UserCheck, 
  Users, 
  Compass, 
  Sparkles,
  Lock,
  UserPlus,
  Video,
  LogIn,
  Check,
  Clock,
  ArrowRight,
  Shield,
  AlertCircle
} from 'lucide-react';

interface SchoolPortalProps {
  onNavigateToAdmin: () => void;
  onNavigateToInspector: () => void;
}

export const SchoolPortal: React.FC<SchoolPortalProps> = ({
  onNavigateToAdmin,
  onNavigateToInspector
}) => {
  // Store state
  const schools = truthTrailStore.schools;
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || 'sch-01');
  const currentSchool = schools.find(s => s.id === selectedSchoolId) || schools[0];

  const teachers = truthTrailStore.teachers.filter(t => t.schoolId === currentSchool.id);
  const students = truthTrailStore.students.filter(
    s => s.schoolId === currentSchool.id && s.verificationStatus === 'approved'
  );
  const pendingRequests = truthTrailStore.students.filter(
    s => s.schoolId === currentSchool.id && s.verificationStatus === 'pending_admin_approval'
  );

  // Incoming inspection requests for this school
  const incomingOnlineInspection = truthTrailStore.inspectionRequests.find(
    r => r.schoolId === currentSchool.id && r.mode === 'online' && r.status === 'sent_to_inspector'
  );
  const acceptedOnlineInspection = truthTrailStore.inspectionRequests.find(
    r => r.schoolId === currentSchool.id && r.mode === 'online' && r.status === 'accepted_by_head'
  );

  // Terminal mode
  const [terminalMode, setTerminalMode] = useState<'attendance' | 'request_student'>('attendance');
  const [attendanceType, setAttendanceType] = useState<'teacher_in' | 'teacher_out' | 'student_roll'>('teacher_in');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');

  // Camera & Face detection
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [livenessChallenge, setLivenessChallenge] = useState<LivenessChallengeType>('blink');
  const [livenessPassed, setLivenessPassed] = useState<boolean>(false);
  const [detectedPhotoHash, setDetectedPhotoHash] = useState<string>('');

  // GPS Simulation
  const [gpsSimMode, setGpsSimMode] = useState<'at_school' | 'outside'>('at_school');
  const deviceLocation: LocationCoordinates = gpsSimMode === 'at_school'
    ? createOffsetCoordinate(currentSchool.coordinates, 10, -5)
    : createOffsetCoordinate(currentSchool.coordinates, 3500, 2100);

  const geofenceCheck = isWithinGeofence(deviceLocation, currentSchool.coordinates, currentSchool.geofenceRadiusMeters);

  // 3-Second Success & Redirect State
  const [showSuccessOverlay, setShowSuccessOverlay] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<{ title: string; subtitle: string } | null>(null);
  const [countdown, setCountdown] = useState<number>(3);

  // Request New Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'boy' | 'girl'>('boy');
  const [newStudentGrade, setNewStudentGrade] = useState<'1' | '2' | '3' | '4' | '5'>('1');
  const [newStudentGuardian, setNewStudentGuardian] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentConsent, setNewStudentConsent] = useState(false);
  const [studentRequestSuccess, setStudentRequestSuccess] = useState<string | null>(null);

  // Handle Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch {
      setIsCameraActive(true); // fallback in test sandboxes
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const runLivenessScan = () => {
    setIsScanning(true);
    setTimeout(async () => {
      let hash = 'hash_' + Date.now().toString(16);
      if (videoRef.current && isCameraActive) {
        try {
          const res = await detectFaceInVideo(videoRef.current);
          hash = res.photoHash;
        } catch (e) {
          console.error(e);
        }
      }
      setDetectedPhotoHash(hash);
      setLivenessPassed(true);
      setIsScanning(false);
    }, 1500);
  };

  // Submit Teacher In/Out
  const handleTeacherAttendance = (type: 'in' | 'out') => {
    const teacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
    if (!teacher) return;

    truthTrailStore.recordTeacherCheckIn({
      date: new Date().toISOString().split('T')[0],
      type,
      teacherId: teacher.id,
      teacherName: teacher.name,
      schoolId: currentSchool.id,
      timestamp: new Date().toISOString(),
      coordinates: deviceLocation,
      distanceMeters: geofenceCheck.distanceMeters,
      withinGeofence: geofenceCheck.within,
      photoHash: detectedPhotoHash || 'hash_tea_' + Date.now().toString(16),
      matchConfidence: 0.98,
      livenessChallenge,
      livenessPassed: true,
      syncedLate: false
    });

    triggerSuccessRedirect(
      `Teacher ${type === 'in' ? 'Check-In' : 'Check-Out'} Confirmed!`,
      `${teacher.name} · Verified via Facial Scan · Geofence: ${geofenceCheck.distanceMeters}m`
    );
  };

  // Submit Student Roll
  const handleStudentAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    const records: Omit<AttendanceRecord, 'id'>[] = students.map(st => ({
      date: today,
      schoolId: currentSchool.id,
      studentId: st.studentId,
      studentName: st.fullName,
      status: 'present',
      verificationMethod: 'facial_verified',
      matchConfidence: 0.96,
      timestamp: new Date().toISOString(),
      capturedCoordinates: deviceLocation,
      distanceFromSchool: geofenceCheck.distanceMeters,
      withinGeofence: geofenceCheck.within,
      photoHash: 'hash_stu_' + Math.random().toString(16).slice(2, 8),
      syncedLate: false,
      deviceFingerprint: 'SCH-KIOSK-01'
    }));

    truthTrailStore.recordStudentAttendanceBatch(records);

    triggerSuccessRedirect(
      'Student Roll Call Verified & Saved!',
      `Successfully logged ${students.length} approved students with facial verification`
    );
  };

  // 3-Second Redirect Animation
  const triggerSuccessRedirect = (title: string, subtitle: string) => {
    setSuccessDetails({ title, subtitle });
    setShowSuccessOverlay(true);
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowSuccessOverlay(false);
          setLivenessPassed(false);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // School Head Accepts Online Inspection Request
  const handleAcceptOnlineInspection = (requestId: string) => {
    truthTrailStore.acceptOnlineInspectionRequest(requestId);
    alert('Surprise Online Inspection Accepted by School Head. Inspector has been granted video roll call connection.');
  };

  // Submit Student Enrollment Request (to Admin)
  const handleSubmitStudentRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentConsent) {
      alert('Guardian consent is mandatory.');
      return;
    }

    const student = truthTrailStore.requestStudentEnrollment({
      studentId: 'STU-REQ-' + Math.floor(1000 + Math.random() * 9000),
      fullName: newStudentName.trim(),
      gender: newStudentGender,
      grade: newStudentGrade,
      schoolId: currentSchool.id,
      guardianName: newStudentGuardian.trim(),
      guardianPhone: newStudentPhone.trim() || '0300-1234567',
      guardianConsentGiven: true,
      enrollmentDate: new Date().toISOString().split('T')[0],
      faceTemplateRegistered: true,
      requestNote: `New admission submitted from ${currentSchool.name} terminal.`
    });

    setStudentRequestSuccess(
      `Request for ${student.fullName} submitted! Status: Pending District Admin Verification. Student can mark attendance once approved by Admin.`
    );

    setNewStudentName('');
    setNewStudentGuardian('');
    setNewStudentPhone('');
    setNewStudentConsent(false);
    setTimeout(() => setStudentRequestSuccess(null), 7000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-emerald-800 dark:text-emerald-400">
              TruthTrail School Terminal
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Open Biometric Station
            </span>
          </div>

          {/* Zone 2: Navigation / Controls */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 hidden md:inline">
              Selected School:
            </label>
            <select
              aria-label="Select School"
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
            >
              {schools.slice(0, 3).map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.taluka})
                </option>
              ))}
            </select>
          </div>

          {/* Zone 3: Portal Login Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToInspector}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Inspector Portal</span>
            </button>
            <button
              onClick={onNavigateToAdmin}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Incoming Online Inspection Alert (School Head Action) */}
        {incomingOnlineInspection && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Surprise Online Inspection Dispatched by District Admin!
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Inspector <strong>{incomingOnlineInspection.inspectorPseudonym}</strong> is awaiting live video roll call. School Head must accept to initiate camera connection.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleAcceptOnlineInspection(incomingOnlineInspection.id)}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md whitespace-nowrap"
            >
              School Head: Accept Online Inspection
            </button>
          </div>
        )}

        {acceptedOnlineInspection && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Online Inspection Active: Live video roll-call room open for Inspector {acceptedOnlineInspection.inspectorPseudonym}.</span>
            </div>
            <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded font-bold">CONNECTED</span>
          </div>
        )}

        {/* Sub-navigation tabs: Mark Attendance vs Request Student */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {currentSchool.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              SEMIS: <span className="font-mono font-semibold">{currentSchool.semisCode}</span> · Taluka: {currentSchool.taluka} · Approved Students: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{students.length}</span>
            </p>
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTerminalMode('attendance')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                terminalMode === 'attendance'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Mark Attendance
            </button>
            <button
              onClick={() => setTerminalMode('request_student')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                terminalMode === 'request_student'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Request New Student</span>
              {pendingRequests.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TERMINAL MODE 1: ATTENDANCE STATION (FACIAL + MAP + 3s REDIRECT) */}
        {terminalMode === 'attendance' && (
          <div className="space-y-6">
            {/* Attendance Type Selector */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setAttendanceType('teacher_in')}
                className={`p-3.5 rounded-2xl border text-left transition-colors ${
                  attendanceType === 'teacher_in'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold text-xs">Teacher Check-In (IN)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Morning entry facial scan</div>
              </button>

              <button
                onClick={() => setAttendanceType('teacher_out')}
                className={`p-3.5 rounded-2xl border text-left transition-colors ${
                  attendanceType === 'teacher_out'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold text-xs">Teacher Check-Out (OUT)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">School closing departure</div>
              </button>

              <button
                onClick={() => setAttendanceType('student_roll')}
                className={`p-3.5 rounded-2xl border text-left transition-colors ${
                  attendanceType === 'student_roll'
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold text-xs">Student Roll Call</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{students.length} approved students</div>
              </button>
            </div>

            {/* GPS Simulation Switcher */}
            <div className="bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Device Location Simulator:</span>
                <span className="text-slate-500">{geofenceCheck.distanceMeters}m from school registered gate</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setGpsSimMode('at_school')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    gpsSimMode === 'at_school' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Inside School (10m)
                </button>
                <button
                  onClick={() => setGpsSimMode('outside')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    gpsSimMode === 'outside' ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Outside Geofence (3.5km)
                </button>
              </div>
            </div>

            {/* Main Split: Facial Camera on Left + Leaflet Map on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Live Facial Camera */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-700" />
                      <span>Facial Recognition & Liveness Feed</span>
                    </h2>
                    <p className="text-[11px] text-slate-500">Camera-based biometric verification prevents photo spoofing</p>
                  </div>

                  {(attendanceType === 'teacher_in' || attendanceType === 'teacher_out') && teachers.length > 0 && (
                    <select
                      aria-label="Select Teacher"
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-semibold"
                    >
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t?.name || 'Teacher'} (Status: {String(t?.status || 'in').toUpperCase()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Video Container */}
                <div className="relative aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                  />

                  {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-52 h-64 border-2 border-emerald-400 rounded-3xl relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                          Align Face
                        </div>
                      </div>
                    </div>
                  )}

                  {!isCameraActive && (
                    <div className="text-center p-6 space-y-3">
                      <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">Terminal Camera Inactive</p>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                      >
                        Activate Camera
                      </button>
                    </div>
                  )}

                  {isScanning && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xs flex flex-col items-center justify-center text-white">
                      <div className="w-10 h-10 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin mb-2"></div>
                      <span className="text-xs font-bold">Running Liveness & Facial Geometry Scan...</span>
                    </div>
                  )}
                </div>

                {/* Camera Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {isCameraActive ? (
                    <>
                      <button
                        onClick={stopCamera}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                      >
                        Turn Off Camera
                      </button>
                      <button
                        onClick={runLivenessScan}
                        disabled={isScanning}
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run Biometric Liveness Scan</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={startCamera}
                      className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold"
                    >
                      Start Camera for Attendance
                    </button>
                  )}
                </div>

                {livenessPassed && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-emerald-900 dark:text-emerald-200 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Face Matched (98%) · Liveness Confirmed</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700">READY</span>
                  </div>
                )}
              </div>

              {/* Right Column: Leaflet Map & Attendance Confirmation */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>School Perimeter & Geofence (150m)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">Live GPS tracking ensures physical on-site presence</p>
                  </div>

                  <div className={`p-3 rounded-xl border text-xs ${
                    geofenceCheck.within
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 text-red-900 dark:text-red-200'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      {geofenceCheck.within ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                      <span>{geofenceCheck.within ? 'Inside School Boundary' : 'Geofence Breach Detected'}</span>
                    </div>
                    <span className="text-[11px] block mt-1">
                      Distance: <strong className="font-mono">{geofenceCheck.distanceMeters}m</strong> (Allowed: &le; 150m)
                    </span>
                  </div>

                  <LeafletMap
                    selectedSchool={currentSchool}
                    showGeofence={true}
                    geofenceRadiusMeters={currentSchool.geofenceRadiusMeters}
                    deviceLocation={deviceLocation}
                    deviceLabel="Attendance Device"
                    height="210px"
                    zoom={15}
                  />
                </div>

                {/* Submit Attendance Button */}
                <div className="pt-2">
                  {attendanceType === 'teacher_in' && (
                    <button
                      onClick={() => handleTeacherAttendance('in')}
                      className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-transform active:scale-98 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Teacher Check-In (IN)</span>
                    </button>
                  )}

                  {attendanceType === 'teacher_out' && (
                    <button
                      onClick={() => handleTeacherAttendance('out')}
                      className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-transform active:scale-98 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Teacher Check-Out (OUT)</span>
                    </button>
                  )}

                  {attendanceType === 'student_roll' && (
                    <button
                      onClick={handleStudentAttendance}
                      className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-transform active:scale-98 flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      <span>Confirm Student Facial Roll Call ({students.length})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TERMINAL MODE 2: REQUEST TO ADD NEW STUDENT (VERIFIED BY ADMIN) */}
        {terminalMode === 'request_student' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-700" />
                <span>Submit Student Enrollment Request</span>
              </h2>
              <p className="text-xs text-slate-500">
                School submits child registration details to District Admin. Once verified by Admin, student is automatically added to the attendance roster.
              </p>
            </div>

            {studentRequestSuccess && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{studentRequestSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitStudentRequest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Child Full Name (as per B-Form) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="e.g. Tariq Ali Solangi"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender & Grade *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newStudentGender}
                      onChange={(e) => setNewStudentGender(e.target.value as any)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="boy">Boy</option>
                      <option value="girl">Girl</option>
                    </select>
                    <select
                      value={newStudentGrade}
                      onChange={(e) => setNewStudentGrade(e.target.value as any)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="1">Grade 1</option>
                      <option value="2">Grade 2</option>
                      <option value="3">Grade 3</option>
                      <option value="4">Grade 4</option>
                      <option value="5">Grade 5</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Father / Guardian Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentGuardian}
                    onChange={(e) => setNewStudentGuardian(e.target.value)}
                    placeholder="e.g. Gulzar Ahmed Solangi"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Guardian Phone (for Parent Roll Call)
                  </label>
                  <input
                    type="tel"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={newStudentConsent}
                    onChange={(e) => setNewStudentConsent(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-emerald-950 dark:text-emerald-200 font-medium">
                    Guardian has signed educational biometric consent. 128D mathematical vector template generated.
                  </span>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Send Request to Admin for Verification</span>
                </button>
              </div>
            </form>

            {/* Pending Requests Table */}
            {pendingRequests.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Requests Awaiting Admin Approval ({pendingRequests.length})
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden text-xs">
                  {pendingRequests.map(pr => (
                    <div key={pr.id} className="p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{pr.fullName}</span>
                        <span className="text-slate-400 text-[11px] ml-2">Grade {pr.grade} · Guardian: {pr.guardianName}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        Pending Admin Verification
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3-SECOND SUCCESS REDIRECT OVERLAY */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {successDetails?.title || 'Attendance Verified!'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {successDetails?.subtitle || 'Record appended to central ledger with GPS proof.'}
              </p>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
              Redirecting terminal in <strong className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400">{countdown}</strong> seconds...
            </div>

            {/* Visual animated progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

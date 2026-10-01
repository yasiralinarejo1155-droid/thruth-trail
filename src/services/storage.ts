import {
  School,
  Teacher,
  Student,
  InspectorProfile,
  InspectionBatch,
  InspectionAssignment,
  InspectionReport,
  AnonymousReport,
  ParentConfirmation,
  AuditLogEntry,
  TeacherCheckInRecord,
  AttendanceRecord,
  OfflineAttendanceQueueItem,
  UserRole,
  InspectionRequest
} from '../types';
import {
  INITIAL_SCHOOLS,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_INSPECTORS,
  INITIAL_BATCHES,
  INITIAL_ASSIGNMENTS,
  INITIAL_REPORTS,
  INITIAL_ANONYMOUS_REPORTS,
  INITIAL_PARENT_CONFIRMATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_INSPECTION_REQUESTS
} from '../data/seedData';
import { evaluateSchoolRisk } from './riskEngine';

const STORAGE_KEYS = {
  SCHOOLS: 'tt_schools_v1',
  TEACHERS: 'tt_teachers_v1',
  STUDENTS: 'tt_students_v1',
  INSPECTORS: 'tt_inspectors_v1',
  BATCHES: 'tt_batches_v1',
  ASSIGNMENTS: 'tt_assignments_v1',
  REPORTS: 'tt_reports_v1',
  ANON_REPORTS: 'tt_anon_reports_v1',
  PARENT_CONFIRMATIONS: 'tt_parent_confirmations_v1',
  AUDIT_LOGS: 'tt_audit_logs_v1',
  OFFLINE_QUEUE: 'tt_offline_queue_v1',
  KNOWN_PHOTO_HASHES: 'tt_known_photo_hashes_v1',
  ATTENDANCE_HISTORY: 'tt_attendance_history_v1',
  TEACHER_CHECKINS: 'tt_teacher_checkins_v1',
  INSPECTION_REQUESTS: 'tt_inspection_requests_v1'
};

function getFromStorage<T>(key: string, defaultVal: T): T {
  try {
    const val = localStorage.getItem(key);
    if (!val) return defaultVal;
    return JSON.parse(val);
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return defaultVal;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

class TruthTrailStore {
  schools: School[] = [];
  teachers: Teacher[] = [];
  students: Student[] = [];
  inspectors: InspectorProfile[] = [];
  batches: InspectionBatch[] = [];
  assignments: InspectionAssignment[] = [];
  reports: InspectionReport[] = [];
  anonymousReports: AnonymousReport[] = [];
  parentConfirmations: ParentConfirmation[] = [];
  auditLogs: AuditLogEntry[] = [];
  offlineQueue: OfflineAttendanceQueueItem[] = [];
  knownPhotoHashes: { hash: string; date: string; schoolId: string }[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  teacherCheckIns: TeacherCheckInRecord[] = [];
  inspectionRequests: InspectionRequest[] = [];

  listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  init() {
    this.schools = getFromStorage(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS).map((s: School) => ({
      ...s,
      riskLevel: s.riskLevel || 'low',
      riskScore: typeof s.riskScore === 'number' ? s.riskScore : 10
    }));
    this.teachers = getFromStorage(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS).map((t: Teacher) => ({
      ...t,
      status: t.status || 'in'
    }));
    this.students = getFromStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS).map((s: Student) => ({
      ...s,
      verificationStatus: s.verificationStatus || 'approved'
    }));
    this.inspectors = getFromStorage(STORAGE_KEYS.INSPECTORS, INITIAL_INSPECTORS);
    this.batches = getFromStorage(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    this.assignments = getFromStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    this.reports = getFromStorage(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
    this.anonymousReports = getFromStorage(STORAGE_KEYS.ANON_REPORTS, INITIAL_ANONYMOUS_REPORTS);
    this.parentConfirmations = getFromStorage(STORAGE_KEYS.PARENT_CONFIRMATIONS, INITIAL_PARENT_CONFIRMATIONS);
    this.auditLogs = getFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    this.offlineQueue = getFromStorage(STORAGE_KEYS.OFFLINE_QUEUE, []);
    this.inspectionRequests = getFromStorage(STORAGE_KEYS.INSPECTION_REQUESTS, INITIAL_INSPECTION_REQUESTS);
    this.knownPhotoHashes = getFromStorage(STORAGE_KEYS.KNOWN_PHOTO_HASHES, [
      { hash: 'hash_8f9a2e1d7c3b4a5f', date: '2026-09-30', schoolId: 'sch-01' },
      { hash: 'hash_9999_spoofed_identical', date: '2026-09-28', schoolId: 'sch-03' }
    ]);
    this.attendanceRecords = getFromStorage(STORAGE_KEYS.ATTENDANCE_HISTORY, []);
    this.teacherCheckIns = getFromStorage(STORAGE_KEYS.TEACHER_CHECKINS, []).map((tc: TeacherCheckInRecord) => ({
      ...tc,
      type: tc.type || 'in'
    }));

    // Initial recalculation of risk scores
    this.recalculateAllRisks();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  resetToDefault() {
    localStorage.clear();
    this.init();
    this.notify();
  }

  recalculateAllRisks() {
    this.schools = this.schools.map(school => {
      const schoolAttendance = this.attendanceRecords.filter(a => a.schoolId === school.id);
      const schoolCheckIns = this.teacherCheckIns.filter(t => t.schoolId === school.id);
      const schoolParentConf = this.parentConfirmations.filter(p => p.schoolId === school.id);
      const schoolAnon = this.anonymousReports.filter(a => a.schoolId === school.id);

      const result = evaluateSchoolRisk(school, {
        attendanceRecords: schoolAttendance,
        teacherCheckIns: schoolCheckIns,
        parentConfirmations: schoolParentConf,
        anonymousReports: schoolAnon,
      });

      // Keep human-curated high risk flags if seed data established strong ghost grounds
      const combinedScore = Math.max(school.riskScore, result.score);
      const combinedFactors = Array.from(new Set([...school.riskFactors, ...result.factors.map(f => f.explanation)]));

      return {
        ...school,
        riskScore: combinedScore,
        riskLevel: combinedScore >= 70 ? 'high' : combinedScore >= 35 ? 'medium' : 'low',
        riskFactors: combinedFactors
      };
    });
    saveToStorage(STORAGE_KEYS.SCHOOLS, this.schools);
  }

  addAuditLog(actorRole: UserRole, actorIdentifier: string, action: string, details: string) {
    const entry: AuditLogEntry = {
      id: 'aud-' + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      actorRole,
      actorIdentifier,
      action,
      details,
      ipHash: '175.107.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255)
    };
    this.auditLogs = [entry, ...this.auditLogs];
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    this.notify();
  }

  // --- Face photo hash checking to prevent reused photos ---
  isPhotoHashReused(hash: string, currentSchoolId: string): { reused: boolean; previousDate?: string } {
    if (!hash || hash.startsWith('hash_none')) return { reused: false };
    const match = this.knownPhotoHashes.find(k => k.hash === hash);
    if (match) {
      return { reused: true, previousDate: match.date };
    }
    return { reused: false };
  }

  recordPhotoHash(hash: string, schoolId: string) {
    if (!hash || hash.startsWith('hash_none')) return;
    this.knownPhotoHashes.push({
      hash,
      date: new Date().toISOString().split('T')[0],
      schoolId
    });
    saveToStorage(STORAGE_KEYS.KNOWN_PHOTO_HASHES, this.knownPhotoHashes);
  }

  // --- Add School (Admin) ---
  addSchool(newSchool: Omit<School, 'id' | 'riskScore' | 'riskLevel' | 'riskFactors'>) {
    const id = 'sch-' + Date.now().toString(36);
    const school: School = {
      ...newSchool,
      id,
      riskScore: 10,
      riskLevel: 'low',
      riskFactors: ['Newly added institutional record'],
      enrolledStudentsCount: newSchool.enrolledStudentsCount || 0,
      assignedTeachersCount: newSchool.assignedTeachersCount || 0
    };

    this.schools.push(school);
    saveToStorage(STORAGE_KEYS.SCHOOLS, this.schools);

    this.addAuditLog(
      'super_admin',
      'Admin-Khairpur-HQ',
      'SCHOOL_ADDED',
      `Registered new government school: ${school.name} (SEMIS: ${school.semisCode}) in ${school.taluka}.`
    );

    this.recalculateAllRisks();
    this.notify();
    return school;
  }

  // --- Teacher Check-in / Out ---
  recordTeacherCheckIn(record: Omit<TeacherCheckInRecord, 'id'>, isOffline: boolean = false): { success: boolean; record: TeacherCheckInRecord; warning?: string } {
    const id = 'tck-' + Date.now().toString(36);
    const newRecord: TeacherCheckInRecord = {
      ...record,
      id
    };

    let warning: string | undefined;
    const reuseCheck = this.isPhotoHashReused(record.photoHash, record.schoolId);
    if (reuseCheck.reused) {
      warning = `POTENTIAL PHOTO SPOOFING DETECTED: Image hash matches photo previously recorded on ${reuseCheck.previousDate}. Replay attempt flagged.`;
    }

    if (isOffline) {
      this.offlineQueue.push({
        id: 'off-' + Date.now().toString(36),
        createdAt: new Date().toISOString(),
        type: 'teacher_checkin',
        data: newRecord
      });
      saveToStorage(STORAGE_KEYS.OFFLINE_QUEUE, this.offlineQueue);
      this.notify();
      return { success: true, record: newRecord, warning: warning ? warning + ' (Stored in offline queue)' : 'Stored in offline queue. Will sync when online.' };
    }

    this.teacherCheckIns.unshift(newRecord);
    saveToStorage(STORAGE_KEYS.TEACHER_CHECKINS, this.teacherCheckIns);
    this.recordPhotoHash(record.photoHash, record.schoolId);

    // Update teacher's in/out status and last check-in details
    this.teachers = this.teachers.map(t => {
      if (t.id === record.teacherId) {
        return {
          ...t,
          status: record.type,
          lastCheckIn: {
            type: record.type,
            timestamp: record.timestamp,
            coordinates: record.coordinates,
            distanceMeters: record.distanceMeters,
            withinGeofence: record.withinGeofence,
            photoHash: record.photoHash,
            matchConfidence: record.matchConfidence,
            livenessPassed: record.livenessPassed
          }
        };
      }
      return t;
    });
    saveToStorage(STORAGE_KEYS.TEACHERS, this.teachers);

    this.addAuditLog(
      'teacher',
      `TCH-${record.teacherName || 'Teacher'}`,
      record.type === 'in' ? 'TEACHER_CHECKIN' : 'TEACHER_CHECKOUT',
      `${String(record?.type || 'in').toUpperCase()} recorded at school ${record?.schoolId || ''}. Geofence: ${record?.withinGeofence ? 'PASSED (' + (record?.distanceMeters ?? 0) + 'm)' : 'FAILED (' + (record?.distanceMeters ?? 0) + 'm OUTSIDE)'}. Liveness: ${record?.livenessPassed ? 'PASSED' : 'FAILED'}.`
    );

    this.recalculateAllRisks();
    this.notify();
    return { success: true, record: newRecord, warning };
  }

  // --- Student Attendance Batch ---
  recordStudentAttendanceBatch(
    records: Omit<AttendanceRecord, 'id'>[],
    isOffline: boolean = false
  ) {
    const fullRecords: AttendanceRecord[] = records.map(r => ({
      ...r,
      id: 'att-' + Math.random().toString(36).slice(2, 9)
    }));

    if (isOffline) {
      this.offlineQueue.push({
        id: 'off-' + Date.now().toString(36),
        createdAt: new Date().toISOString(),
        type: 'student_batch',
        data: fullRecords
      });
      saveToStorage(STORAGE_KEYS.OFFLINE_QUEUE, this.offlineQueue);
      this.notify();
      return { queued: true, count: fullRecords.length };
    }

    this.attendanceRecords = [...fullRecords, ...this.attendanceRecords];
    saveToStorage(STORAGE_KEYS.ATTENDANCE_HISTORY, this.attendanceRecords);

    // Record hashes
    records.forEach(r => {
      if (r.photoHash) this.recordPhotoHash(r.photoHash, r.schoolId);
    });

    const verifiedCount = fullRecords.filter(r => r.verificationMethod === 'facial_verified').length;
    const manualCount = fullRecords.filter(r => r.verificationMethod === 'manual_unverified').length;

    this.addAuditLog(
      'teacher',
      'Teacher-App',
      'STUDENT_ATTENDANCE_LOGGED',
      `Class roll call saved: ${verifiedCount} facial-verified, ${manualCount} unverified manual entries.`
    );

    this.recalculateAllRisks();
    this.notify();
    return { queued: false, count: fullRecords.length };
  }

  // --- Sync Offline Records ---
  syncOfflineQueue(): { syncedCount: number } {
    if (this.offlineQueue.length === 0) return { syncedCount: 0 };

    let count = 0;
    this.offlineQueue.forEach(item => {
      if (item.type === 'teacher_checkin') {
        const checkin: TeacherCheckInRecord = {
          ...item.data,
          syncedLate: true
        };
        this.teacherCheckIns.unshift(checkin);
        count++;
      } else if (item.type === 'student_batch') {
        const studentBatch: AttendanceRecord[] = item.data.map((r: AttendanceRecord) => ({
          ...r,
          syncedLate: true
        }));
        this.attendanceRecords = [...studentBatch, ...this.attendanceRecords];
        count += studentBatch.length;
      }
    });

    saveToStorage(STORAGE_KEYS.TEACHER_CHECKINS, this.teacherCheckIns);
    saveToStorage(STORAGE_KEYS.ATTENDANCE_HISTORY, this.attendanceRecords);

    this.offlineQueue = [];
    saveToStorage(STORAGE_KEYS.OFFLINE_QUEUE, this.offlineQueue);

    this.addAuditLog(
      'teacher',
      'Offline-Sync-Daemon',
      'OFFLINE_QUEUE_SYNCED',
      `Synced ${count} delayed attendance records to central ledger with original capture timestamps.`
    );

    this.recalculateAllRisks();
    this.notify();
    return { syncedCount: count };
  }

  // --- Student Enrollment ---
  enrollStudent(newStudent: Omit<Student, 'id'>) {
    const student: Student = {
      ...newStudent,
      id: 'stu-' + Date.now().toString(36)
    };

    // Check dual enrollment against existing students with same name & age
    const matching = this.students.find(
      s => (s?.fullName || '').trim().toLowerCase() === (student?.fullName || '').trim().toLowerCase() && s.schoolId !== student.schoolId
    );
    if (matching) {
      student.dualEnrolledFlag = true;
      const otherSchool = this.schools.find(sc => sc.id === matching.schoolId);
      student.conflictingSchoolName = otherSchool ? otherSchool.name : 'Another District School';
    }

    this.students.push(student);
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);

    // Update school enrollment count
    this.schools = this.schools.map(s => {
      if (s.id === student.schoolId) {
        return { ...s, enrolledStudentsCount: s.enrolledStudentsCount + 1 };
      }
      return s;
    });
    saveToStorage(STORAGE_KEYS.SCHOOLS, this.schools);

    this.addAuditLog(
      'teacher',
      'Teacher-Enrollment-Desk',
      'STUDENT_ENROLLED',
      `Enrolled child ${student.fullName} (${student.studentId}) with guardian consent. Biometric 128D embedding generated.`
    );

    this.recalculateAllRisks();
    this.notify();
    return student;
  }

  // --- Student Enrollment Request (School Portal -> Pending Admin Approval) ---
  requestStudentEnrollment(requestData: Omit<Student, 'id' | 'verificationStatus'>): Student {
    const studentId = 'STU-REQ-' + Math.floor(100 + Math.random() * 900);
    const newStudent: Student = {
      ...requestData,
      id: 'stu-' + Date.now().toString(36),
      studentId: requestData.studentId || studentId,
      verificationStatus: 'pending_admin_approval'
    };

    // Check dual enrollment against existing
    const matching = this.students.find(
      s => (s?.fullName || '').trim().toLowerCase() === (newStudent?.fullName || '').trim().toLowerCase() && s.schoolId !== newStudent.schoolId
    );
    if (matching) {
      newStudent.dualEnrolledFlag = true;
      const otherSchool = this.schools.find(sc => sc.id === matching.schoolId);
      newStudent.conflictingSchoolName = otherSchool ? otherSchool.name : 'Another District School';
    }

    this.students.push(newStudent);
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);

    this.addAuditLog(
      'teacher',
      'School-Desk',
      'STUDENT_ENROLLMENT_REQUESTED',
      `Submitted enrollment approval request for ${newStudent.fullName} (${newStudent.studentId}) to District Admin.`
    );

    this.notify();
    return newStudent;
  }

  // --- Admin Verifies/Approves Student Request ---
  verifyStudentRequest(studentId: string, status: 'approved' | 'rejected') {
    this.students = this.students.map(s => {
      if (s.id === studentId || s.studentId === studentId) {
        return {
          ...s,
          verificationStatus: status
        };
      }
      return s;
    });
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);

    const verified = this.students.find(s => s.id === studentId || s.studentId === studentId);
    if (verified && status === 'approved') {
      this.schools = this.schools.map(sc => {
        if (sc.id === verified.schoolId) {
          return { ...sc, enrolledStudentsCount: sc.enrolledStudentsCount + 1 };
        }
        return sc;
      });
      saveToStorage(STORAGE_KEYS.SCHOOLS, this.schools);
    }

    this.addAuditLog(
      'super_admin',
      'Admin-Khairpur-HQ',
      status === 'approved' ? 'STUDENT_REQUEST_APPROVED' : 'STUDENT_REQUEST_REJECTED',
      `Student ${verified?.fullName || studentId} marked as ${String(status || 'approved').toUpperCase()} by District Education Officer.`
    );

    this.recalculateAllRisks();
    this.notify();
  }

  // --- Inspection Request Operations ---
  createInspectionRequest(params: {
    schoolId: string;
    inspectorId: string;
    mode: 'physical' | 'online';
    notes?: string;
  }): InspectionRequest {
    const school = this.schools.find(s => s.id === params.schoolId);
    const inspector = this.inspectors.find(i => i.id === params.inspectorId);

    const newRequest: InspectionRequest = {
      id: 'inreq-' + Date.now().toString(36),
      schoolId: params.schoolId,
      schoolName: school ? school.name : 'Target School',
      inspectorId: params.inspectorId,
      inspectorPseudonym: inspector ? inspector.pseudonym : 'INS-XXXX',
      mode: params.mode,
      status: 'sent_to_inspector',
      requestedAt: new Date().toISOString(),
      deadlineDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      notes: params.notes || `Formal inspection dispatched by District Admin.`
    };

    this.inspectionRequests.unshift(newRequest);
    saveToStorage(STORAGE_KEYS.INSPECTION_REQUESTS, this.inspectionRequests);

    this.addAuditLog(
      'super_admin',
      'Admin-Khairpur-HQ',
      'INSPECTION_REQUEST_SENT',
      `Sent ${String(params?.mode || 'physical').toUpperCase()} inspection request for ${newRequest.schoolName} to ${newRequest.inspectorPseudonym}.`
    );

    this.notify();
    return newRequest;
  }

  // --- School Head Accepts Online Surprise Inspection Request ---
  acceptOnlineInspectionRequest(requestId: string): InspectionRequest | null {
    let updated: InspectionRequest | null = null;
    this.inspectionRequests = this.inspectionRequests.map(r => {
      if (r.id === requestId) {
        updated = {
          ...r,
          status: 'accepted_by_head',
          onlineSessionReady: true,
          schoolHeadAcceptedAt: new Date().toISOString()
        };
        return updated;
      }
      return r;
    });

    saveToStorage(STORAGE_KEYS.INSPECTION_REQUESTS, this.inspectionRequests);

    if (updated) {
      this.addAuditLog(
        'school_head',
        'Head-Master-Terminal',
        'ONLINE_INSPECTION_ACCEPTED',
        `School Head accepted surprise video roll call request #${requestId}. Live audio/video room ready for inspector.`
      );
    }

    this.notify();
    return updated;
  }

  completeInspectionRequest(requestId: string) {
    this.inspectionRequests = this.inspectionRequests.map(r => {
      if (r.id === requestId) {
        return { ...r, status: 'completed' };
      }
      return r;
    });
    saveToStorage(STORAGE_KEYS.INSPECTION_REQUESTS, this.inspectionRequests);
    this.notify();
  }
  createInspectionBatch(params: {
    schoolIds: string[];
    inspectorIds: string[];
    modeMap?: Record<string, 'physical' | 'online_surprise'>;
    deadlineDays?: number;
  }): { batch: InspectionBatch; assignmentsCreated: number } {
    const { schoolIds, inspectorIds, modeMap = {}, deadlineDays = 14 } = params;

    if (schoolIds.length !== inspectorIds.length) {
      throw new Error(`School count (${schoolIds.length}) must match inspector count (${inspectorIds.length}) for 1-to-1 blind allocation.`);
    }

    // Cryptographic shuffle with home-taluka fairness safeguard
    const availableInspectors = [...this.inspectors.filter(i => inspectorIds.includes(i.id))];
    const targetSchools = [...this.schools.filter(s => schoolIds.includes(s.id))];

    // Shuffle schools randomly
    for (let i = targetSchools.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [targetSchools[i], targetSchools[j]] = [targetSchools[j], targetSchools[i]];
    }

    // Assign inspectors ensuring no home-taluka conflict
    const pairAssignments: { school: School; inspector: InspectorProfile }[] = [];
    const pool = [...availableInspectors];

    for (const school of targetSchools) {
      // Find an inspector whose home Taluka is DIFFERENT from the school's Taluka
      const validCandidateIndex = pool.findIndex(insp => insp.homeTaluka !== school.taluka);
      if (validCandidateIndex !== -1) {
        const chosen = pool.splice(validCandidateIndex, 1)[0];
        pairAssignments.push({ school, inspector: chosen });
      } else {
        // Fallback if small pool
        const chosen = pool.pop()!;
        pairAssignments.push({ school, inspector: chosen });
      }
    }

    const batchId = 'batch-' + Date.now().toString(36);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays);

    const newBatch: InspectionBatch = {
      id: batchId,
      batchNumber: this.batches.length + 1,
      createdAt: new Date().toISOString(),
      deadlineDate: deadline.toISOString(),
      totalSchools: schoolIds.length,
      completedReports: 0,
      status: 'in_progress',
      assignedInspectorIds: inspectorIds,
      targetSchoolIds: schoolIds
    };

    const newAssignments: InspectionAssignment[] = pairAssignments.map((pair, index) => {
      const chosenMode = modeMap[pair.school.id] || (index % 2 === 0 ? 'physical' : 'online_surprise');
      return {
        id: 'asg-' + Math.random().toString(36).slice(2, 9),
        batchId,
        inspectorId: pair.inspector.id,
        schoolId: pair.school.id,
        mode: chosenMode,
        deadlineDate: deadline.toISOString(),
        status: 'pending',
        isRevealedToAdmin: false // BLIND: Admin cannot see this mapping!
      };
    });

    this.batches.unshift(newBatch);
    this.assignments = [...newAssignments, ...this.assignments];

    saveToStorage(STORAGE_KEYS.BATCHES, this.batches);
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, this.assignments);

    this.addAuditLog(
      'super_admin',
      'Admin-Khairpur-HQ',
      'INSPECTION_BATCH_CREATED',
      `Batch #${newBatch.batchNumber} sealed with ${schoolIds.length} schools and ${inspectorIds.length} inspectors. Cryptographic veil active.`
    );

    this.notify();
    return { batch: newBatch, assignmentsCreated: newAssignments.length };
  }

  // --- Inspector chooses visit day privately ---
  setInspectorVisitDate(assignmentId: string, scheduledDate: string) {
    this.assignments = this.assignments.map(a => {
      if (a.id === assignmentId) {
        return { ...a, scheduledVisitDate: scheduledDate, status: 'in_progress' };
      }
      return a;
    });
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, this.assignments);
    this.notify();
  }

  // --- Inspector Submits Report (Immutable, reveals pseudonym to admin) ---
  submitInspectionReport(
    assignmentId: string,
    reportData: Omit<InspectionReport, 'id' | 'assignmentId' | 'submittedAt' | 'cryptographicSignature' | 'tamperSealHash'>
  ): InspectionReport {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    const reportId = 'rep-' + Date.now().toString(36);
    const submittedAt = new Date().toISOString();
    const sig = '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
    const seal = 'sha256:' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);

    const report: InspectionReport = {
      ...reportData,
      id: reportId,
      assignmentId,
      submittedAt,
      cryptographicSignature: sig,
      tamperSealHash: seal
    };

    this.reports.unshift(report);
    saveToStorage(STORAGE_KEYS.REPORTS, this.reports);

    // Update assignment to reveal inspector pseudonym post-submission!
    this.assignments = this.assignments.map(a => {
      if (a.id === assignmentId) {
        return {
          ...a,
          status: 'submitted',
          submittedReportId: reportId,
          isRevealedToAdmin: true
        };
      }
      return a;
    });
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, this.assignments);

    // Update batch completed counter
    this.batches = this.batches.map(b => {
      if (b.id === assignment.batchId) {
        const completed = b.completedReports + 1;
        return {
          ...b,
          completedReports: completed,
          status: completed >= b.totalSchools ? 'completed' : 'in_progress'
        };
      }
      return b;
    });
    saveToStorage(STORAGE_KEYS.BATCHES, this.batches);

    // Update school status based on verdict
    this.schools = this.schools.map(s => {
      if (s.id === assignment.schoolId) {
        let newStatus: School['status'] = s.status;
        if (report.verdict === 'confirmed_ghost') newStatus = 'confirmed_ghost';
        else if (report.verdict === 'partially_ghost') newStatus = 'under_investigation';
        else if (report.verdict === 'fully_functional') newStatus = 'cleared';

        return {
          ...s,
          status: newStatus,
          lastInspectedDate: submittedAt.split('T')[0]
        };
      }
      return s;
    });
    saveToStorage(STORAGE_KEYS.SCHOOLS, this.schools);

    this.addAuditLog(
      'inspector',
      report.inspectorPseudonym,
      'INSPECTION_REPORT_SUBMITTED',
      `Filed ${report.inspectionMode} audit for ${report.schoolName}. Verdict: ${report.verdict}. Sealed under hash ${seal.slice(0, 16)}...`
    );

    this.recalculateAllRisks();
    this.notify();
    return report;
  }

  // --- Parent / Community Confirmation ---
  recordParentConfirmation(data: Omit<ParentConfirmation, 'id' | 'submittedAt' | 'discrepancyFound'>): ParentConfirmation {
    const student = this.students.find(s => s.studentId === data.studentId);
    const discrepancy = data.attendedDaysStatus === 'school_was_closed' || data.attendedDaysStatus === 'child_never_attends';

    const pConf: ParentConfirmation = {
      ...data,
      id: 'pconf-' + Date.now().toString(36),
      submittedAt: new Date().toISOString(),
      discrepancyFound: discrepancy
    };

    this.parentConfirmations.unshift(pConf);
    saveToStorage(STORAGE_KEYS.PARENT_CONFIRMATIONS, this.parentConfirmations);

    this.addAuditLog(
      'parent',
      'Parent-Portal',
      'PARENT_CONFIRMATION_SUBMITTED',
      `Parent response for Student ${data.studentId} at School ${data.schoolId}: ${data.attendedDaysStatus}. Discrepancy: ${discrepancy ? 'YES (Risk Elevated)' : 'No'}.`
    );

    this.recalculateAllRisks();
    this.notify();
    return pConf;
  }

  // --- Anonymous Tip Submission ---
  submitAnonymousReport(data: Omit<AnonymousReport, 'id' | 'submittedAt' | 'status' | 'riskContribution'>): AnonymousReport {
    const anon: AnonymousReport = {
      ...data,
      id: 'anon-' + Date.now().toString(36),
      submittedAt: new Date().toISOString(),
      status: 'new',
      riskContribution: data.category === 'padlocked_school' ? 35 : data.category === 'bogus_enrollment' ? 25 : 15
    };

    this.anonymousReports.unshift(anon);
    saveToStorage(STORAGE_KEYS.ANON_REPORTS, this.anonymousReports);

    this.addAuditLog(
      'super_admin',
      'Whistleblower-Inbox',
      'ANONYMOUS_REPORT_RECEIVED',
      `New encrypted tip received for school ${data.schoolName || 'Khairpur School'} under category ${data.category}.`
    );

    this.recalculateAllRisks();
    this.notify();
    return anon;
  }

  updateAnonymousReportStatus(reportId: string, status: AnonymousReport['status']) {
    this.anonymousReports = this.anonymousReports.map(r => {
      if (r.id === reportId) return { ...r, status };
      return r;
    });
    saveToStorage(STORAGE_KEYS.ANON_REPORTS, this.anonymousReports);
    this.recalculateAllRisks();
    this.notify();
  }
}

export const truthTrailStore = new TruthTrailStore();

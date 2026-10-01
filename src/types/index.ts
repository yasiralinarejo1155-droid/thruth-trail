export type UserRole = 'super_admin' | 'inspector' | 'teacher' | 'school_head' | 'parent';
export type PortalType = 'school' | 'admin' | 'inspector';

export type Language = 'en' | 'ur' | 'sd';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface School {
  id: string;
  semisCode: string; // Sindh Education Management Information System code
  name: string;
  nameUrdu?: string;
  nameSindhi?: string;
  taluka: 'Khairpur' | 'Kot Diji' | 'Kingri' | 'Gambat' | 'Sobhodero' | 'Nara' | 'Faiz Ganj' | 'Thari Mirwah';
  unionCouncil: string;
  villageName: string;
  villageEstimatedPopulation: number;
  coordinates: LocationCoordinates;
  geofenceRadiusMeters: number; // default 150m
  enrolledStudentsCount: number;
  assignedTeachersCount: number;
  status: 'active' | 'under_investigation' | 'confirmed_ghost' | 'cleared';
  riskScore: number; // 0 - 100
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  lastInspectedDate?: string;
  establishedYear: number;
  hasElectricity: boolean;
  hasCleanWater: boolean;
  hasBoundaryWall: boolean;
  functionalToilets: number;
  classroomCount: number;
  budgetAllocatedPKR: number;
}

export interface Teacher {
  id: string;
  name: string;
  cnic: string;
  schoolId: string;
  role: 'head_master' | 'primary_teacher' | 'subject_teacher';
  faceTemplateRegistered: boolean;
  faceEmbedding?: number[]; // 128D vector
  phone: string;
  status: 'in' | 'out';
  lastCheckIn?: {
    type: 'in' | 'out';
    timestamp: string;
    coordinates: LocationCoordinates;
    distanceMeters: number;
    withinGeofence: boolean;
    photoHash: string;
    matchConfidence: number;
    livenessPassed: boolean;
  };
}

export interface Student {
  id: string;
  studentId: string; // STU-KHP-XXX
  fullName: string;
  gender: 'boy' | 'girl';
  grade: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
  schoolId: string;
  guardianName: string;
  guardianPhone: string;
  guardianConsentGiven: boolean;
  enrollmentDate: string;
  faceTemplateRegistered: boolean;
  faceEmbedding?: number[];
  dualEnrolledFlag?: boolean; // detected in another school
  conflictingSchoolName?: string;
  verificationStatus: 'approved' | 'pending_admin_approval' | 'rejected';
  requestNote?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  schoolId: string;
  studentId: string;
  studentName: string;
  status: 'present' | 'absent';
  verificationMethod: 'facial_verified' | 'manual_unverified';
  matchConfidence?: number; // e.g. 0.94
  timestamp: string;
  capturedCoordinates: LocationCoordinates;
  distanceFromSchool: number;
  withinGeofence: boolean;
  photoHash: string;
  syncedLate: boolean;
  deviceFingerprint: string;
}

export interface TeacherCheckInRecord {
  id: string;
  date: string;
  type: 'in' | 'out';
  teacherId: string;
  teacherName: string;
  schoolId: string;
  timestamp: string;
  coordinates: LocationCoordinates;
  distanceMeters: number;
  withinGeofence: boolean;
  photoHash: string;
  matchConfidence: number;
  livenessChallenge: 'blink' | 'head_turn' | 'smile';
  livenessPassed: boolean;
  syncedLate: boolean;
}

export interface InspectorProfile {
  id: string;
  pseudonym: string; // e.g. "INS-7K2Q"
  homeTaluka: string; // to enforce home area conflict prevention
  inspectionsCompleted: number;
  integrityScore: number;
  activeBatchId?: string;
  code: string; // login identifier e.g. "INS-7K2Q"
}

export interface InspectionRequest {
  id: string;
  schoolId: string;
  schoolName: string;
  inspectorId: string;
  inspectorPseudonym: string;
  mode: 'physical' | 'online';
  status: 'sent_to_inspector' | 'accepted_by_head' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: string;
  deadlineDate: string;
  onlineSessionReady?: boolean;
  schoolHeadAcceptedAt?: string;
  notes?: string;
}

export interface InspectionBatch {
  id: string;
  batchNumber: number;
  createdAt: string;
  deadlineDate: string;
  totalSchools: number;
  completedReports: number;
  status: 'in_progress' | 'completed' | 'expired';
  // Note: the individual school-to-inspector mapping is cryptographically masked until report submission
  assignedInspectorIds: string[];
  targetSchoolIds: string[];
}

export interface InspectionAssignment {
  id: string;
  batchId: string;
  inspectorId: string; // Pseudonymous ID
  schoolId: string; // Decrypted only by the assigned inspector or after report is filed
  mode: 'physical' | 'online_surprise';
  deadlineDate: string;
  scheduledVisitDate?: string; // Selected privately by inspector
  status: 'pending' | 'in_progress' | 'submitted';
  submittedReportId?: string;
  isRevealedToAdmin: boolean; // Only true AFTER submission
}

export interface InspectionReport {
  id: string;
  assignmentId: string;
  batchId: string;
  schoolId: string;
  schoolName: string;
  inspectorPseudonym: string;
  submittedAt: string;
  inspectionMode: 'physical' | 'online_surprise';
  gpsCheckIn: {
    coordinates: LocationCoordinates;
    distanceMeters: number;
    withinGeofence: boolean;
    timestamp: string;
  };
  physicalFindings?: {
    gateStatus: 'open' | 'locked' | 'dilapidated' | 'abandoned';
    studentsCountedPhysically: number;
    studentsEnrolledOnRegister: number;
    discrepancyPercent: number;
    teacherPresent: boolean;
    teacherNameObserved?: string;
    infrastructureScore: number; // 0-100
    facilitiesWorking: {
      drinkingWater: boolean;
      electricity: boolean;
      toiletsFunctional: boolean;
      textbooksDistributed: boolean;
      middayMealRunning: boolean;
    };
    photoEvidenceHashes: string[];
    inspectorNotes: string;
  };
  onlineFindings?: {
    responseTimeMinutes: number;
    callAnswered: boolean;
    gpsVerifiedAtCallTime: boolean;
    studentsShownOnCamera: number;
    inspectorNotes: string;
  };
  verdict: 'fully_functional' | 'needs_improvement' | 'partially_ghost' | 'confirmed_ghost';
  cryptographicSignature: string;
  tamperSealHash: string;
}

export interface AnonymousReport {
  id: string;
  schoolId?: string;
  schoolName?: string;
  submittedAt: string;
  category: 'padlocked_school' | 'absent_teacher' | 'bogus_enrollment' | 'bribe_demanded' | 'infrastructure_fraud';
  description: string;
  evidencePhotoCount: number;
  status: 'new' | 'under_investigation' | 'corroborated' | 'dismissed';
  reporterType: 'anonymous_villager' | 'parent' | 'whistleblower_teacher';
  riskContribution: number;
}

export interface ParentConfirmation {
  id: string;
  studentId: string;
  schoolId: string;
  submittedAt: string;
  weekEndingDate: string;
  attendedDaysStatus: 'full_week' | 'few_days' | 'school_was_closed' | 'child_never_attends';
  discrepancyFound: boolean;
  guardianPhoneHash: string; // hashed for privacy
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: UserRole;
  actorIdentifier: string; // e.g. "INS-7K2Q" or "Admin-Khairpur-HQ"
  action: string;
  details: string;
  ipHash: string;
}

export interface OfflineAttendanceQueueItem {
  id: string;
  createdAt: string;
  type: 'teacher_checkin' | 'student_batch';
  data: any;
}

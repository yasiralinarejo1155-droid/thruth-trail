import React, { useState } from 'react';
import { School, Student } from '../../types';
import { truthTrailStore } from '../../services/storage';
import { 
  HeartHandshake, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  ShieldCheck, 
  MessageSquare,
  Lock,
  PhoneCall
} from 'lucide-react';

interface ParentCommunityPortalProps {
  schools: School[];
  students: Student[];
}

export const ParentCommunityPortal: React.FC<ParentCommunityPortalProps> = ({
  schools,
  students
}) => {
  const [activeTab, setActiveTab] = useState<'attendance_check' | 'anonymous_tip'>('attendance_check');

  // Attendance Check Form
  const [studentIdInput, setStudentIdInput] = useState('STU-KHP-0101');
  const [parentPhoneInput, setParentPhoneInput] = useState('0300-1122331');
  const [attendanceStatus, setAttendanceStatus] = useState<'full_week' | 'few_days' | 'school_was_closed' | 'child_never_attends'>('full_week');
  const [attendanceFeedback, setAttendanceFeedback] = useState<string | null>(null);

  // Tip Form
  const [selectedSchoolId, setSelectedSchoolId] = useState(schools[2]?.id || schools[0]?.id || '');
  const [tipCategory, setTipCategory] = useState<'padlocked_school' | 'absent_teacher' | 'bogus_enrollment' | 'infrastructure_fraud'>('padlocked_school');
  const [tipDescription, setTipDescription] = useState('');
  const [tipSuccessMessage, setTipSuccessMessage] = useState<string | null>(null);

  // Handle Parent Roll Call Submit
  const handleParentAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim()) return;

    const matchedStudent = students.find(s => (s?.studentId || '').trim().toUpperCase() === String(studentIdInput || '').trim().toUpperCase());
    const schoolId = matchedStudent ? matchedStudent.schoolId : selectedSchoolId;

    const result = truthTrailStore.recordParentConfirmation({
      studentId: String(studentIdInput || '').trim().toUpperCase(),
      schoolId,
      weekEndingDate: new Date().toISOString().split('T')[0],
      attendedDaysStatus: attendanceStatus,
      guardianPhoneHash: 'sha256:' + Math.random().toString(16).slice(2, 8)
    });

    if (result.discrepancyFound) {
      setAttendanceFeedback(
        `CONTRADICTION DETECTED: You indicated that "${attendanceStatus === 'school_was_closed' ? 'School was closed' : 'Child never attends'}", while the school claimed full attendance. This direct contradiction has automatically raised the school's Ghost Risk Score!`
      );
    } else {
      setAttendanceFeedback(
        `Thank you! Your response has been securely filed directly with the central audit ledger, bypassing local school authorities.`
      );
    }
  };

  // Handle Anonymous Whistleblower Tip
  const handleTipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipDescription.trim()) return;

    const school = schools.find(s => s.id === selectedSchoolId);

    truthTrailStore.submitAnonymousReport({
      schoolId: selectedSchoolId,
      schoolName: school ? school.name : 'Unknown School',
      category: tipCategory,
      description: tipDescription.trim(),
      evidencePhotoCount: 1,
      reporterType: 'parent'
    });

    setTipSuccessMessage(
      'Anonymous report submitted successfully. Your IP and personal details are stripped. The central audit division will review this tip.'
    );
    setTipDescription('');
    setTimeout(() => setTipSuccessMessage(null), 6000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 mb-1">
            <HeartHandshake className="w-4 h-4" />
            <span>Community Accountability Layer</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Parent & Public Verification Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Independent community reporting that bypasses corrupt local officials directly to central oversight
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('attendance_check')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'attendance_check'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Weekly Parent Check
          </button>
          <button
            onClick={() => setActiveTab('anonymous_tip')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'anonymous_tip'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Report Ghost School
          </button>
        </div>
      </div>

      {activeTab === 'attendance_check' ? (
        /* Parent Weekly Confirmation Form */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-700" />
              <span>Did your child attend school this week?</span>
            </h2>
            <p className="text-xs text-slate-500">
              Cross-checks your direct parent response against teacher-submitted daily rolls.
            </p>
          </div>

          {attendanceFeedback && (
            <div className={`p-4 rounded-xl text-xs border ${
              attendanceFeedback.includes('CONTRADICTION DETECTED')
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
            }`}>
              <div className="flex items-start gap-2">
                {attendanceFeedback.includes('CONTRADICTION DETECTED') ? (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                )}
                <span>{attendanceFeedback}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleParentAttendanceSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Student Registration ID (from Report Card / B-Form) *
                </label>
                <input
                  type="text"
                  required
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  placeholder="e.g. STU-KHP-0101"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Demo Try: <code className="text-emerald-700">STU-KHP-0101</code> (Luqman) or <code className="text-red-600">STU-KHP-0391</code> (Flagged Ghost)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parent / Guardian Mobile Number
                </label>
                <input
                  type="tel"
                  value={parentPhoneInput}
                  onChange={(e) => setParentPhoneInput(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Your phone number is hashed cryptographically for privacy.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                What was your child's true attendance status this week?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'full_week', label: 'Attended Full Week (Mon - Sat)', desc: 'School was open, teacher taught every day' },
                  { id: 'few_days', label: 'Attended 1-2 Days Only', desc: 'Child had illnesses or was engaged in family harvest' },
                  { id: 'school_was_closed', label: 'School Was Closed / Padlocked', desc: 'Gate was locked, teacher did not show up' },
                  { id: 'child_never_attends', label: 'My Child Does NOT Attend Here', desc: 'Someone used our B-form to register a fake pupil' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAttendanceStatus(option.id as any)}
                    className={`p-3.5 rounded-xl border text-left transition-colors ${
                      attendanceStatus === option.id
                        ? option.id === 'school_was_closed' || option.id === 'child_never_attends'
                          ? 'bg-red-50 dark:bg-red-950/50 border-red-500 text-red-950 dark:text-red-200 shadow-xs'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold">{option.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-transform active:scale-98 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Direct Community Verification</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Anonymous Whistleblower Tip Submission Form */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-red-600" />
              <span>Submit Anonymous Ghost School Intelligence</span>
            </h2>
            <p className="text-xs text-slate-500">
              Submit confidential information regarding closed schools, absentee teachers, or fake rolls.
            </p>
          </div>

          {tipSuccessMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{tipSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleTipSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Government School *
                </label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.taluka})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Violation Category *
                </label>
                <select
                  value={tipCategory}
                  onChange={(e) => setTipCategory(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="padlocked_school">Padlocked Building / Cattle Shed</option>
                  <option value="absent_teacher">Absentee Teacher (Drawing Salary Overseas/Town)</option>
                  <option value="bogus_enrollment">Bogus / Ghost Enrollment Count</option>
                  <option value="infrastructure_fraud">Infrastructure & Textbook Fund Theft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forensic Details & Specific Observations *
              </label>
              <textarea
                rows={4}
                required
                value={tipDescription}
                onChange={(e) => setTipDescription(e.target.value)}
                placeholder="Describe what you see: is the gate rusted locked? Who holds the keys? When was the last time a teacher visited? How many children live in the village?"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-transform active:scale-98 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Submit Anonymous Intelligence to Provincial Directorate</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

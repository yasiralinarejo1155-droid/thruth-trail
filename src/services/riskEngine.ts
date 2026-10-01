import { School, AttendanceRecord, TeacherCheckInRecord, ParentConfirmation, AnonymousReport } from '../types';

export interface RiskAnalysisResult {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: {
    ruleId: string;
    title: string;
    points: number;
    severity: 'info' | 'warning' | 'critical';
    explanation: string;
  }[];
}

/**
 * Calculates explainable risk score for a government school based on independent audit signals
 */
export function evaluateSchoolRisk(
  school: School,
  context: {
    attendanceRecords?: AttendanceRecord[];
    teacherCheckIns?: TeacherCheckInRecord[];
    parentConfirmations?: ParentConfirmation[];
    anonymousReports?: AnonymousReport[];
    recentPhotoHashes?: string[];
  }
): RiskAnalysisResult {
  let score = 0;
  const factors: RiskAnalysisResult['factors'] = [];

  // 1. Unnatural / Suspiciously Round Enrollment Rule
  const enrolled = school.enrolledStudentsCount;
  const isSuspiciouslyRound = enrolled > 0 && enrolled % 50 === 0;
  const isDecimalRound = enrolled > 0 && enrolled % 10 === 0 && (enrolled === 100 || enrolled === 120 || enrolled === 200);

  if (isDecimalRound || isSuspiciouslyRound) {
    const pts = 15;
    score += pts;
    factors.push({
      ruleId: 'ROUND_ENROLLMENT_ANOMALY',
      title: 'Suspiciously Round Enrollment',
      points: pts,
      severity: 'warning',
      explanation: `Enrollment count of exactly ${enrolled} is statistically unnatural for rural Deh clusters and matches ghost school budget fabrication patterns.`
    });
  }

  // 2. Demographic Feasibility Rule (Enrollment vs Village Population)
  if (school.villageEstimatedPopulation > 0) {
    const ratio = enrolled / school.villageEstimatedPopulation;
    // In primary school age (5-10 yrs), children are typically ~12-15% of the total village census
    if (ratio > 0.4) {
      const pts = 30;
      score += pts;
      factors.push({
        ruleId: 'DEMOGRAPHIC_IMPOSSIBILITY',
        title: 'Demographic Feasibility Breach',
        points: pts,
        severity: 'critical',
        explanation: `Claimed enrollment (${enrolled}) constitutes ${(ratio * 100).toFixed(0)}% of the entire village population (${school.villageEstimatedPopulation}). Normal primary age demographic is at most 15%.`
      });
    } else if (ratio > 0.25) {
      const pts = 15;
      score += pts;
      factors.push({
        ruleId: 'DEMOGRAPHIC_SKEW',
        title: 'High Population Skew',
        points: pts,
        severity: 'warning',
        explanation: `Claimed enrollment represents ${(ratio * 100).toFixed(0)}% of village population, exceeding expected primary cohorts.`
      });
    }
  }

  // 3. Teacher Check-in Geofence Anomaly Rule
  if (context.teacherCheckIns && context.teacherCheckIns.length > 0) {
    const outOfGeofence = context.teacherCheckIns.filter(c => !c.withinGeofence);
    if (outOfGeofence.length > 0) {
      const breachRate = outOfGeofence.length / context.teacherCheckIns.length;
      const pts = Math.min(35, Math.round(breachRate * 35));
      score += pts;
      const maxDist = Math.max(...outOfGeofence.map(c => c.distanceMeters));
      factors.push({
        ruleId: 'GEOFENCE_BREACH',
        title: 'Out-of-Geofence Teacher Check-ins',
        points: pts,
        severity: 'critical',
        explanation: `${(breachRate * 100).toFixed(0)}% of recent teacher check-ins were registered outside the 150m perimeter (max deviation: ${maxDist}m away).`
      });
    }

    // Check odd check-in hours (< 07:00 AM or > 15:00 PM)
    const oddHours = context.teacherCheckIns.filter(c => {
      const hour = new Date(c.timestamp).getUTCHours() + 5; // Pakistan Standard Time UTC+5
      return hour < 7 || hour > 15;
    });

    if (oddHours.length > 0) {
      const pts = 10;
      score += pts;
      factors.push({
        ruleId: 'ODD_HOURS_CHECKIN',
        title: 'Irregular Instructional Hour Check-ins',
        points: pts,
        severity: 'info',
        explanation: `Teacher biometric check-in timestamps recorded outside normal school hours (07:00 AM - 03:00 PM).`
      });
    }
  }

  // 4. Attendance Method (Manual Unverified Ratio)
  if (context.attendanceRecords && context.attendanceRecords.length > 0) {
    const unverified = context.attendanceRecords.filter(a => a.verificationMethod === 'manual_unverified');
    const unverifiedRate = unverified.length / context.attendanceRecords.length;
    if (unverifiedRate > 0.4) {
      const pts = 25;
      score += pts;
      factors.push({
        ruleId: 'HIGH_MANUAL_ATTENDANCE',
        title: 'High Manual Unverified Entries',
        points: pts,
        severity: 'warning',
        explanation: `${(unverifiedRate * 100).toFixed(0)}% of attendance entries bypassed facial recognition and were logged manually without photo verification.`
      });
    }
  }

  // 5. Parent / Community Contradiction Rule
  if (context.parentConfirmations && context.parentConfirmations.length > 0) {
    const contradictions = context.parentConfirmations.filter(p => p.discrepancyFound);
    if (contradictions.length > 0) {
      const pts = Math.min(30, contradictions.length * 15);
      score += pts;
      factors.push({
        ruleId: 'COMMUNITY_CONTRADICTION',
        title: 'Parent Roll-Call Contradiction',
        points: pts,
        severity: 'critical',
        explanation: `${contradictions.length} independent guardian responses reported the school was padlocked/closed or their registered child does not attend.`
      });
    }
  }

  // 6. Anonymous Whistleblower / Field Reports
  if (context.anonymousReports && context.anonymousReports.length > 0) {
    const activeReports = context.anonymousReports.filter(r => r.status !== 'dismissed');
    if (activeReports.length > 0) {
      const pts = Math.min(30, activeReports.reduce((acc, r) => acc + (r.riskContribution || 15), 0));
      score += pts;
      factors.push({
        ruleId: 'WHISTLEBLOWER_ALLEGATION',
        title: 'Corroborated Whistleblower Reports',
        points: pts,
        severity: activeReports.some(r => r.status === 'corroborated') ? 'critical' : 'warning',
        explanation: `${activeReports.length} anonymous whistleblower tip(s) logged regarding padlocked premises or ghost staff.`
      });
    }
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));
  let level: 'low' | 'medium' | 'high' = 'low';
  if (finalScore >= 70) level = 'high';
  else if (finalScore >= 35) level = 'medium';

  return {
    score: finalScore,
    level,
    factors
  };
}

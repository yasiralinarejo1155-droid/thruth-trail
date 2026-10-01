import React, { useState } from 'react';
import { School, Teacher, Student, InspectionBatch, AnonymousReport } from '../../types';
import { LeafletMap } from '../common/LeafletMap';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  School as SchoolIcon,
  Users,
  UserCheck,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface AdminDashboardProps {
  schools: School[];
  teachers: Teacher[];
  students: Student[];
  batches: InspectionBatch[];
  anonymousReports: AnonymousReport[];
  onSelectSchool: (school: School) => void;
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  schools,
  teachers,
  students,
  batches,
  anonymousReports,
  onSelectSchool,
  onNavigateTab
}) => {
  const [selectedTaluka, setSelectedTaluka] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Filtered Schools
  const filteredSchools = schools.filter(s => {
    if (selectedTaluka !== 'all' && s.taluka !== selectedTaluka) return false;
    if (riskFilter !== 'all' && s.riskLevel !== riskFilter) return false;
    return true;
  });

  // KPI Calculations
  const totalSchools = schools.length;
  const totalTeachers = teachers.length;
  const totalStudents = students.length;
  const highRiskSchools = schools.filter(s => s.riskLevel === 'high');
  const mediumRiskSchools = schools.filter(s => s.riskLevel === 'medium');
  const lowRiskSchools = schools.filter(s => s.riskLevel === 'low');
  
  const pendingInspections = batches.reduce(
    (acc, b) => acc + (b.totalSchools - b.completedReports),
    0
  );
  const completedInspections = batches.reduce(
    (acc, b) => acc + b.completedReports,
    0
  );

  // Mock attendance trend data (last 7 days across Khairpur)
  const attendanceTrendData = [
    { day: 'Mon', verified: 78, unverifiedManual: 14, absent: 8 },
    { day: 'Tue', verified: 81, unverifiedManual: 12, absent: 7 },
    { day: 'Wed', verified: 79, unverifiedManual: 13, absent: 8 },
    { day: 'Thu', verified: 83, unverifiedManual: 10, absent: 7 },
    { day: 'Fri', verified: 84, unverifiedManual: 9, absent: 7 },
    { day: 'Sat', verified: 75, unverifiedManual: 15, absent: 10 },
  ];

  // Risk Distribution Data
  const riskPieData = [
    { name: 'Low Risk (Normal)', value: lowRiskSchools.length, color: '#059669' },
    { name: 'Medium Risk (Irregular)', value: mediumRiskSchools.length, color: '#d97706' },
    { name: 'High Risk (Suspected Ghost)', value: highRiskSchools.length, color: '#dc2626' },
  ];

  // Enrolled vs Estimated Actually Present for High Risk vs Normal
  const enrollmentComparisonData = [
    { category: 'Luqman (Low)', claimed: 142, present: 135 },
    { category: 'Kot Diji (Low)', claimed: 195, present: 172 },
    { category: 'Qadir Bux (Ghost)', claimed: 120, present: 0 },
    { category: 'G. Rasool (Ghost)', claimed: 240, present: 28 },
    { category: 'Dargah Machi', claimed: 88, present: 28 },
    { category: 'Akri Chodaho', claimed: 130, present: 12 },
  ];

  // Check-in Hours Distribution
  const checkInHeatmapData = [
    { hour: '06:00 - 07:00 (Pre-School)', count: 3 },
    { hour: '07:00 - 08:00 (Morning Roll)', count: 48 },
    { hour: '08:00 - 09:00 (Standard Check)', count: 62 },
    { hour: '09:00 - 10:00 (Late Arrival)', count: 14 },
    { hour: '11:00+ (Suspicious Fluke)', count: 6 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
            <span>Directorate of School Education · Khairpur Division</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            District Audit Control & Anti-Ghost Command
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Independent, tamper-resistant biometric telemetry & anonymous inspection oversight
          </p>
        </div>

        {/* Filter Controls (Segmented Tabs complying with zero-pill rule) */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            aria-label="Filter by Taluka"
            value={selectedTaluka}
            onChange={(e) => setSelectedTaluka(e.target.value)}
            className="text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Talukas (Khairpur)</option>
            <option value="Khairpur">Taluka Khairpur</option>
            <option value="Kot Diji">Taluka Kot Diji</option>
            <option value="Kingri">Taluka Kingri</option>
            <option value="Gambat">Taluka Gambat</option>
            <option value="Sobhodero">Taluka Sobhodero</option>
            <option value="Nara">Taluka Nara Desert</option>
            <option value="Faiz Ganj">Taluka Faiz Ganj</option>
            <option value="Thari Mirwah">Taluka Thari Mirwah</option>
          </select>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setRiskFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                riskFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRiskFilter('high')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                riskFilter === 'high' ? 'bg-red-600 text-white shadow-xs font-semibold' : 'text-slate-500 hover:text-red-600'
              }`}
            >
              Ghost Risk ({highRiskSchools.length})
            </button>
            <button
              onClick={() => setRiskFilter('medium')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                riskFilter === 'medium' ? 'bg-amber-600 text-white shadow-xs font-semibold' : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              Medium ({mediumRiskSchools.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Schools */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Schools</span>
            <SchoolIcon className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {totalSchools}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Khairpur Registered</span>
        </div>

        {/* Assigned Teachers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Teachers</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {totalTeachers}
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 block">82% Daily Active</span>
        </div>

        {/* Enrolled Students */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Students</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {totalStudents}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">B-Form Verified</span>
        </div>

        {/* Verified Attendance % */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Verified Roll</span>
            <CheckCircle className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
            81.4%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Face Biometric Logged</span>
        </div>

        {/* Flagged Ghost Schools */}
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 shadow-xs bg-red-50/20 dark:bg-red-950/10">
          <div className="flex items-center justify-between text-red-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">High Risk Ghost</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 tabular-nums">
            {highRiskSchools.length}
          </div>
          <span className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1 block">Severe Collusion Indicators</span>
        </div>

        {/* Inspections Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Audits Active</span>
            <ClipboardCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {pendingInspections}
            <span className="text-xs font-normal text-slate-400 ml-1">/ {completedInspections + pendingInspections}</span>
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 block">Blind Sealed Batches</span>
        </div>
      </div>

      {/* Main Interactive Map & Top Ghost Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Section (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Khairpur District Territorial Risk Map</span>
              </h2>
              <p className="text-xs text-slate-500">
                Colored by Risk Engine Score: Green (&lt;35), Yellow (35-70), Red (&gt;70 Ghost School Alert).
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span> Normal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Suspicious
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Ghost Anomaly
              </span>
            </div>
          </div>

          <LeafletMap
            schools={filteredSchools}
            onSelectSchool={onSelectSchool}
            height="400px"
            zoom={10}
          />
        </div>

        {/* Priority Ghost School Action List (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Flagged Ghost School Anomalies</span>
              </h2>
              <p className="text-xs text-slate-500">Independent signals require urgent blind inspection</p>
            </div>

            <div className="space-y-3">
              {highRiskSchools.slice(0, 3).map((school) => (
                <div
                  key={school.id}
                  onClick={() => onSelectSchool(school)}
                  className="p-3 bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl hover:border-red-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[200px]">
                      {school.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-red-600 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded">
                      Score: {school.riskScore}/100
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-2">
                    SEMIS: {school.semisCode} · {school.taluka} · Enrolled: {school.enrolledStudentsCount}
                  </p>

                  <div className="text-[11px] text-red-700 dark:text-red-300 space-y-1">
                    {school.riskFactors.slice(0, 2).map((factor, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-red-500 shrink-0 font-bold">·</span>
                        <span className="line-clamp-2 leading-tight">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button
              onClick={() => onNavigateTab('batches')}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Dispatch Anonymous Inspection Batch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics & Audit Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance Verification Trends */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>Weekly Attendance Breakdown (%)</span>
            </h3>
            <p className="text-[11px] text-slate-500">Face Verified vs Manual Unverified vs Absent</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Bar dataKey="verified" stackId="a" fill="#059669" name="Verified Face Scan" />
                <Bar dataKey="unverifiedManual" stackId="a" fill="#d97706" name="Unverified Manual" />
                <Bar dataKey="absent" stackId="a" fill="#cbd5e1" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Claimed Enrolled vs Physical Headcount Gap */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Enrolled Paper vs. Actual Present Gap</span>
            </h3>
            <p className="text-[11px] text-slate-500">Discrepancy observed at audit inspection</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Bar dataKey="claimed" fill="#94a3b8" name="Paper Roster Enrolled" />
                <Bar dataKey="present" fill="#059669" name="Physically Present" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-700" />
              <span>District Risk Engine Profile</span>
            </h3>
            <p className="text-[11px] text-slate-500">Distribution across 18 audited schools</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

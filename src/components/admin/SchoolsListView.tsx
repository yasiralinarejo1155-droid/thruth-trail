import React, { useState } from 'react';
import { School, Teacher, Student, InspectionReport, ParentConfirmation } from '../../types';
import { LeafletMap } from '../common/LeafletMap';
import { 
  School as SchoolIcon, 
  Search, 
  Filter, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  UserCheck, 
  MapPin, 
  FileText, 
  Lock, 
  Info,
  Calendar,
  Building,
  Zap,
  Droplet
} from 'lucide-react';

interface SchoolsListViewProps {
  schools: School[];
  teachers: Teacher[];
  students: Student[];
  reports: InspectionReport[];
  parentConfirmations: ParentConfirmation[];
  selectedSchool: School | null;
  onSelectSchool: (school: School | null) => void;
}

export const SchoolsListView: React.FC<SchoolsListViewProps> = ({
  schools,
  teachers,
  students,
  reports,
  parentConfirmations,
  selectedSchool,
  onSelectSchool
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [talukaFilter, setTalukaFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  // Filtered List
  const filteredSchools = schools.filter(school => {
    const matchesSearch = 
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.semisCode.includes(searchTerm) ||
      school.villageName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTaluka = talukaFilter === 'all' || school.taluka === talukaFilter;
    const matchesRisk = riskFilter === 'all' || school.riskLevel === riskFilter;

    return matchesSearch && matchesTaluka && matchesRisk;
  });

  // Selected school related data
  const schoolTeachers = selectedSchool ? teachers.filter(t => t.schoolId === selectedSchool.id) : [];
  const schoolStudents = selectedSchool ? students.filter(s => s.schoolId === selectedSchool.id) : [];
  const schoolReports = selectedSchool ? reports.filter(r => r.schoolId === selectedSchool.id) : [];
  const schoolParentResponses = selectedSchool ? parentConfirmations.filter(p => p.schoolId === selectedSchool.id) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            District Schools Registry & Risk Radar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            18 audited government institutions across 8 talukas of Khairpur District
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search school name or SEMIS..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-52 sm:w-64"
            />
          </div>

          <select
            aria-label="Filter by Taluka"
            value={talukaFilter}
            onChange={(e) => setTalukaFilter(e.target.value)}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Talukas</option>
            <option value="Khairpur">Khairpur</option>
            <option value="Kot Diji">Kot Diji</option>
            <option value="Kingri">Kingri</option>
            <option value="Gambat">Gambat</option>
            <option value="Sobhodero">Sobhodero</option>
            <option value="Nara">Nara</option>
            <option value="Faiz Ganj">Faiz Ganj</option>
            <option value="Thari Mirwah">Thari Mirwah</option>
          </select>

          <select
            aria-label="Filter by Risk Score"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk (&gt;70)</option>
            <option value="medium">Medium Risk (35-70)</option>
            <option value="low">Low Risk (&lt;35)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4 font-semibold">SEMIS & School Name</th>
                <th className="py-3 px-4 font-semibold">Taluka & Deh</th>
                <th className="py-3 px-4 font-semibold text-right">Village Pop.</th>
                <th className="py-3 px-4 font-semibold text-right">Enrolled</th>
                <th className="py-3 px-4 font-semibold text-right">Teachers</th>
                <th className="py-3 px-4 font-semibold text-center">Risk Score</th>
                <th className="py-3 px-4 font-semibold">Audit Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSchools.map((school) => {
                const isHigh = school.riskLevel === 'high';
                const isMed = school.riskLevel === 'medium';
                return (
                  <tr
                    key={school.id}
                    onClick={() => onSelectSchool(school)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {school.name}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        SEMIS: {school.semisCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{school.taluka}</div>
                      <span className="text-[10px] text-slate-400">{school.villageName}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {school.villageEstimatedPopulation.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {school.enrolledStudentsCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {school.assignedTeachersCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                          isHigh
                            ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                            : isMed
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {school.riskScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">
                        {school.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSchool(school);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                      >
                        Audit Dossier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* School Deep-Dive Slide-Over Dossier Modal */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full shadow-2xl p-6 overflow-y-auto space-y-6 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  <span>School Forensic Profile</span>
                  <span>·</span>
                  <span>SEMIS: {selectedSchool.semisCode}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedSchool.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Taluka {selectedSchool.taluka} · Union Council {selectedSchool.unionCouncil} · Village: {selectedSchool.villageName}
                </p>
              </div>
              <button
                onClick={() => onSelectSchool(null)}
                aria-label="Close details"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Risk Engine Breakdown Box */}
            <div className={`p-4 rounded-xl border ${
              selectedSchool.riskLevel === 'high'
                ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                : selectedSchool.riskLevel === 'medium'
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <ShieldAlert className="w-4 h-4 text-emerald-700" />
                  <span>Explainable Risk Engine Audit Rationale</span>
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border">
                  Score: {selectedSchool?.riskScore ?? 0} / 100 ({String(selectedSchool?.riskLevel || 'low').toUpperCase()})
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {selectedSchool.riskFactors.map((rf, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-700 shrink-0 font-bold">·</span>
                    <span className="leading-relaxed">{rf}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaflet Mini Map of School with Geofence */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Registered Location & 150m Geofence Perimeter</span>
              </h3>
              <LeafletMap
                selectedSchool={selectedSchool}
                showGeofence={true}
                geofenceRadiusMeters={selectedSchool.geofenceRadiusMeters}
                height="190px"
                zoom={14}
              />
            </div>

            {/* Infrastructure Snapshot */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Electricity</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedSchool.hasElectricity ? 'Connected' : 'No Grid Power'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Clean Water</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedSchool.hasCleanWater ? 'Available' : 'Deficient'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Annual Budget</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  PKR {(selectedSchool.budgetAllocatedPKR / 100000).toFixed(1)} Lakh
                </span>
              </div>
            </div>

            {/* Assigned Teachers */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Assigned Teachers ({schoolTeachers.length})</span>
              </h3>
              {schoolTeachers.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  {schoolTeachers.map(t => (
                    <div key={t.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{t.name}</div>
                        <div className="text-[10px] text-slate-400">CNIC: {t.cnic} · {t.role.replace('_', ' ')}</div>
                      </div>
                      <div className="text-right">
                        {t.lastCheckIn ? (
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              t.lastCheckIn.withinGeofence
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {t.lastCheckIn.withinGeofence ? 'Geofence OK' : `Breach (${t.lastCheckIn.distanceMeters}m)`}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">Conf: {(t.lastCheckIn.matchConfidence * 100).toFixed(0)}%</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No recent check-in</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No teachers officially mapped.</p>
              )}
            </div>

            {/* Inspection Reports History */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Independent Inspection History ({schoolReports.length})</span>
              </h3>
              {schoolReports.length > 0 ? (
                <div className="space-y-2">
                  {schoolReports.map(r => (
                    <div key={r.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white capitalize">
                          {r.inspectionMode.replace('_', ' ')} Audit
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold uppercase">
                          Verdict: {r.verdict.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                        {r.physicalFindings?.inspectorNotes || r.onlineFindings?.inspectorNotes}
                      </p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Auditor: {r.inspectorPseudonym} · Sealed: {r.tamperSealHash.slice(0, 22)}...
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No completed inspection filed yet for this school.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

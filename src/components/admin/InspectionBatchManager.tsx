import React, { useState } from 'react';
import { School, InspectorProfile, InspectionBatch, InspectionAssignment, InspectionReport } from '../../types';
import { truthTrailStore } from '../../services/storage';
import { 
  ShieldCheck, 
  Lock, 
  Layers, 
  Plus, 
  EyeOff, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Compass, 
  Sparkles,
  Shuffle
} from 'lucide-react';

interface InspectionBatchManagerProps {
  batches: InspectionBatch[];
  assignments: InspectionAssignment[];
  reports: InspectionReport[];
  schools: School[];
  inspectors: InspectorProfile[];
  onOpenReportModal?: (report: InspectionReport) => void;
}

export const InspectionBatchManager: React.FC<InspectionBatchManagerProps> = ({
  batches,
  assignments,
  reports,
  schools,
  inspectors,
  onOpenReportModal
}) => {
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [selectedInspectorIds, setSelectedInspectorIds] = useState<string[]>([]);
  const [modeMap, setModeMap] = useState<Record<string, 'physical' | 'online_surprise'>>({});
  const [deadlineDays, setDeadlineDays] = useState(14);
  const [creationSuccessMessage, setCreationSuccessMessage] = useState<string | null>(null);

  // Auto-select Top 4 High Risk Schools
  const handleAutoSelectTopRisk = () => {
    const topRisk = [...schools]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 4)
      .map(s => s.id);
    setSelectedSchoolIds(topRisk);

    const defaultInspectors = inspectors.slice(0, 4).map(i => i.id);
    setSelectedInspectorIds(defaultInspectors);

    const initialModes: Record<string, 'physical' | 'online_surprise'> = {};
    topRisk.forEach((id, idx) => {
      initialModes[id] = idx % 2 === 0 ? 'physical' : 'online_surprise';
    });
    setModeMap(initialModes);
  };

  const handleToggleSchool = (schoolId: string) => {
    setSelectedSchoolIds(prev => {
      if (prev.includes(schoolId)) {
        return prev.filter(id => id !== schoolId);
      } else {
        return [...prev, schoolId];
      }
    });
  };

  const handleToggleInspector = (inspId: string) => {
    setSelectedInspectorIds(prev => {
      if (prev.includes(inspId)) {
        return prev.filter(id => id !== inspId);
      } else {
        return [...prev, inspId];
      }
    });
  };

  const handleExecuteBatchCreation = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSchoolIds.length === 0 || selectedInspectorIds.length === 0) {
      alert('Please select schools and inspectors.');
      return;
    }
    if (selectedSchoolIds.length !== selectedInspectorIds.length) {
      alert(`The number of schools (${selectedSchoolIds.length}) must equal the number of inspectors (${selectedInspectorIds.length}) for 1-to-1 blind allocation.`);
      return;
    }

    try {
      const res = truthTrailStore.createInspectionBatch({
        schoolIds: selectedSchoolIds,
        inspectorIds: selectedInspectorIds,
        modeMap,
        deadlineDays
      });

      setCreationSuccessMessage(
        `Batch #${res.batch.batchNumber} created! Cryptographic blind shuffle executed. Assignments are veiled from District Admin to prevent leaks.`
      );
      setIsCreatingBatch(false);
      setSelectedSchoolIds([]);
      setSelectedInspectorIds([]);

      setTimeout(() => setCreationSuccessMessage(null), 8000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Anti-Collusion Audit Architecture</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Anonymous Inspection Batches
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Blind randomized allocation veiled from Super Admin & local education officers until post-submission
          </p>
        </div>

        <button
          onClick={() => setIsCreatingBatch(!isCreatingBatch)}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Inspection Batch</span>
        </button>
      </div>

      {creationSuccessMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span className="font-medium">{creationSuccessMessage}</span>
        </div>
      )}

      {/* Visual Architectural Explanation Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Leakage Integrity Guarantee</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Why the District Admin cannot see Inspector Assignments in advance
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            In rural education administration, leakages occur when school heads or district clerks obtain advance notice of which official is visiting their school. TruthTrail uses a cryptographic veil: the server randomly pairs inspectors to schools, enforces home-Taluka conflict avoidance, and strictly forbids the admin portal from querying the pairing until the final, immutable, GPS-sealed audit report is logged.
          </p>
        </div>
      </div>

      {/* Create Batch Modal / Drawer */}
      {isCreatingBatch && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-emerald-700" />
                <span>Configure New Blind Inspection Batch</span>
              </h2>
              <p className="text-xs text-slate-500">
                Select an equal number of schools and inspectors. The system handles blind pairing.
              </p>
            </div>
            <button
              onClick={handleAutoSelectTopRisk}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Select Top 4 High Risk Schools</span>
            </button>
          </div>

          <form onSubmit={handleExecuteBatchCreation} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Select Schools Pool */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    1. Target Schools Pool ({selectedSchoolIds.length} Selected)
                  </span>
                  <span className="text-[11px] text-slate-400">Select schools to audit</span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/30">
                  {schools.map(school => {
                    const isSelected = selectedSchoolIds.includes(school.id);
                    return (
                      <div
                        key={school.id}
                        onClick={() => handleToggleSchool(school.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{school.name}</span>
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            school.riskScore >= 70 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            Score: {school.riskScore}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                          <span>SEMIS: {school.semisCode} · {school.taluka}</span>
                          {isSelected && (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[10px]">Mode:</span>
                              <select
                                aria-label="Inspection mode"
                                value={modeMap[school.id] || 'physical'}
                                onChange={(e) => setModeMap({ ...modeMap, [school.id]: e.target.value as any })}
                                className="bg-white dark:bg-slate-900 border text-[10px] rounded px-1 py-0.5"
                              >
                                <option value="physical">Physical</option>
                                <option value="online_surprise">Online Roll Call</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Select Inspector Pool */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    2. Inspector Pool ({selectedInspectorIds.length} Selected)
                  </span>
                  <span className="text-[11px] text-slate-400">Pseudonymous civil servants</span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/30">
                  {inspectors.map(insp => {
                    const isSelected = selectedInspectorIds.includes(insp.id);
                    return (
                      <div
                        key={insp.id}
                        onClick={() => handleToggleInspector(insp.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{insp.pseudonym}</span>
                          <span className="text-[10px] text-slate-400">Integrity Score: {insp.integrityScore}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Home Taluka: <span className="font-semibold text-slate-600 dark:text-slate-300">{insp.homeTaluka}</span> (Protected from home area conflict)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Deadline & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Completion Window:</span>
                <select
                  aria-label="Completion window in days"
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(Number(e.target.value))}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold"
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days (Standard)</option>
                  <option value="21">21 Days</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingBatch(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedSchoolIds.length === 0 || selectedSchoolIds.length !== selectedInspectorIds.length}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm disabled:opacity-40 transition-transform active:scale-95"
                >
                  Seal & Execute Blind Batch Call
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Existing Batches List */}
      <div className="space-y-4">
        {batches.map((batch) => {
          const batchAssignments = assignments.filter(a => a.batchId === batch.id);
          const isComplete = batch.completedReports >= batch.totalSchools;

          return (
            <div
              key={batch.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs rounded">
                      Batch #{batch.batchNumber}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      Created: {new Date(batch.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      Deadline: {new Date(batch.deadlineDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isComplete
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  }`}>
                    {batch.completedReports} of {batch.totalSchools} Reports Sealed
                  </span>
                </div>
              </div>

              {/* Assignments Grid with Cryptographic Masking */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {batchAssignments.map((assignment, idx) => {
                  const targetSchool = schools.find(s => s.id === assignment.schoolId);
                  const isSubmitted = assignment.status === 'submitted';
                  const associatedReport = reports.find(r => r.id === assignment.submittedReportId);

                  return (
                    <div
                      key={assignment.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                        isSubmitted
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                          : 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                          {targetSchool?.name || 'School Target'}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 capitalize">
                          {assignment.mode.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        SEMIS: {targetSchool?.semisCode} · {targetSchool?.taluka}
                      </div>

                      {/* Cryptographic Masking Visualization */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        {isSubmitted ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">Auditor (Revealed):</span>
                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                {associatedReport?.inspectorPseudonym || 'INS-XXXX'}
                              </span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 capitalize">
                              Verdict: {associatedReport?.verdict.replace('_', ' ')}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono truncate">
                              Seal: {associatedReport?.tamperSealHash.slice(0, 16)}...
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 text-center space-y-1 bg-white/60 dark:bg-slate-900/60 rounded-lg p-2 border border-dashed border-emerald-300 dark:border-emerald-800">
                            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Veiled from Admin</span>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-tight">
                              Inspector mapping encrypted on server. Revealed only after report submission.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

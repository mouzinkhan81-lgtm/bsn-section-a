import React, { useState, useMemo } from 'react';
import {
  Activity,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Layers,
  Sparkles,
  HelpCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Users
} from 'lucide-react';
import { Student, Subject, AttendanceRecord } from '../types';
import { KMU_ACADEMIC_MONTHS } from '../data/initialData';

interface AttendanceHeatmapProps {
  students: Student[];
  subjects: Subject[];
  onNavigateToAttendance?: (date: string, subjectCode: string) => void;
  onPopulateSampleAttendance?: () => void;
}

interface CellData {
  date: string;
  subjectCode: string;
  subjectName: string;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  totalLogged: number;
  totalStudents: number;
  rate: number; // 0 to 100
  hasData: boolean;
}

export const AttendanceHeatmap: React.FC<AttendanceHeatmapProps> = ({
  students,
  subjects,
  onNavigateToAttendance,
  onPopulateSampleAttendance
}) => {
  // Filters
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'subject-matrix' | 'calendar-grid' | 'student-matrix'>('subject-matrix');
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?._id || '');

  // 1. Gather all recorded dates across all students
  const allRecordedDates = useMemo(() => {
    const datesSet = new Set<string>();
    students.forEach(std => {
      std.attendance?.forEach(rec => {
        if (rec.date) datesSet.add(rec.date);
      });
    });

    const dates = Array.from(datesSet).sort();
    return dates;
  }, [students]);

  // Determine active date list based on selectedMonthFilter
  const activeDates = useMemo(() => {
    if (allRecordedDates.length === 0) return [];
    if (selectedMonthFilter === 'all') return allRecordedDates;
    return allRecordedDates.filter(d => d.startsWith(selectedMonthFilter));
  }, [allRecordedDates, selectedMonthFilter]);

  // 2. Build complete map: [date_subjectCode] -> CellData
  const heatmapDataMap = useMemo(() => {
    const map = new Map<string, CellData>();
    const totalStudents = students.length;

    // Initialize map
    subjects.forEach(sub => {
      allRecordedDates.forEach(date => {
        const key = `${date}_${sub.code}`;
        map.set(key, {
          date,
          subjectCode: sub.code,
          subjectName: sub.name,
          presentCount: 0,
          absentCount: 0,
          leaveCount: 0,
          totalLogged: 0,
          totalStudents,
          rate: 0,
          hasData: false
        });
      });
    });

    // Populate with actual records
    students.forEach(std => {
      std.attendance?.forEach(rec => {
        const key = `${rec.date}_${rec.subjectCode}`;
        const existing = map.get(key);
        if (existing) {
          existing.hasData = true;
          existing.totalLogged += 1;
          if (rec.status === 'Present') existing.presentCount += 1;
          else if (rec.status === 'Absent') existing.absentCount += 1;
          else if (rec.status === 'Leave') existing.leaveCount += 1;
        }
      });
    });

    // Calculate percentages
    map.forEach(cell => {
      if (cell.totalLogged > 0) {
        // Attendance Rate: % of logged students who were Present (or Present + half leave)
        cell.rate = Math.round((cell.presentCount / cell.totalLogged) * 100);
      }
    });

    return map;
  }, [students, subjects, allRecordedDates]);

  // 3. Subject-level overall statistics across the entire semester
  const subjectStats = useMemo(() => {
    return subjects.map(sub => {
      let totalP = 0;
      let totalA = 0;
      let totalL = 0;
      let totalRecs = 0;
      let sessionsCount = 0;

      allRecordedDates.forEach(date => {
        const key = `${date}_${sub.code}`;
        const cell = heatmapDataMap.get(key);
        if (cell && cell.hasData) {
          sessionsCount += 1;
          totalP += cell.presentCount;
          totalA += cell.absentCount;
          totalL += cell.leaveCount;
          totalRecs += cell.totalLogged;
        }
      });

      const overallRate = totalRecs > 0 ? Math.round((totalP / totalRecs) * 100) : 0;
      return {
        subject: sub,
        sessionsCount,
        totalP,
        totalA,
        totalL,
        totalRecs,
        overallRate,
        status: overallRate >= 85 ? 'Excellent' : overallRate >= 75 ? 'Good' : overallRate >= 65 ? 'Warning' : 'Critical'
      };
    });
  }, [subjects, allRecordedDates, heatmapDataMap]);

  // 4. Overall Semester Metrics
  const overallMetrics = useMemo(() => {
    let grandP = 0;
    let grandTotal = 0;
    let totalSessions = 0;

    subjectStats.forEach(s => {
      grandP += s.totalP;
      grandTotal += s.totalRecs;
      totalSessions += s.sessionsCount;
    });

    const averageRate = grandTotal > 0 ? Math.round((grandP / grandTotal) * 100) : 0;

    // Best & Worst Subject
    const activeStats = subjectStats.filter(s => s.sessionsCount > 0);
    let bestSubject = activeStats.length > 0
      ? [...activeStats].sort((a, b) => b.overallRate - a.overallRate)[0]
      : null;
    let lowestSubject = activeStats.length > 0
      ? [...activeStats].sort((a, b) => a.overallRate - b.overallRate)[0]
      : null;

    return {
      averageRate,
      totalSessions,
      distinctDates: allRecordedDates.length,
      bestSubject,
      lowestSubject
    };
  }, [subjectStats, allRecordedDates]);

  // Color mapper function: returns precise Tailwind styling for the heatmap cell based on rate
  const getHeatmapColor = (rate: number, hasData: boolean) => {
    if (!hasData) {
      return {
        bg: 'bg-slate-100 border-dashed border-slate-200 text-slate-300 hover:bg-slate-200/60',
        badge: 'No Lecture Recorded',
        category: 'none',
        textColor: 'text-slate-400'
      };
    }
    // Deep Red for < 50%
    if (rate < 50) {
      return {
        bg: 'bg-rose-700 text-white font-bold hover:bg-rose-800 shadow-2xs border-rose-800',
        badge: 'Critical (<50%)',
        category: 'critical',
        textColor: 'text-rose-700'
      };
    }
    // Rose/Light Red for 50% - 64%
    if (rate < 65) {
      return {
        bg: 'bg-rose-400 text-rose-950 font-bold hover:bg-rose-500 shadow-2xs border-rose-400',
        badge: 'Poor (50-64%)',
        category: 'poor',
        textColor: 'text-rose-500'
      };
    }
    // Amber/Yellow for 65% - 74% (Borderline below KMU 75% cutoff)
    if (rate < 75) {
      return {
        bg: 'bg-amber-300 text-amber-950 font-bold hover:bg-amber-400 shadow-2xs border-amber-400',
        badge: 'Borderline (65-74%)',
        category: 'borderline',
        textColor: 'text-amber-600'
      };
    }
    // Soft Light Green for 75% - 84% (Meets KMU 75% cutoff)
    if (rate < 85) {
      return {
        bg: 'bg-emerald-300 text-emerald-950 font-bold hover:bg-emerald-400 shadow-2xs border-emerald-400',
        badge: 'Good (75-84%)',
        category: 'good',
        textColor: 'text-emerald-600'
      };
    }
    // Vibrant Emerald for 85% - 94%
    if (rate < 95) {
      return {
        bg: 'bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-2xs border-emerald-600',
        badge: 'Strong (85-94%)',
        category: 'strong',
        textColor: 'text-emerald-700'
      };
    }
    // Deep Forest Green for 95% - 100%
    return {
      bg: 'bg-emerald-700 text-white font-bold hover:bg-emerald-800 shadow-2xs border-emerald-800',
      badge: 'Outstanding (95-100%)',
      category: 'outstanding',
      textColor: 'text-emerald-800'
    };
  };

  // Filtered list of subjects for matrix view
  const visibleSubjects = useMemo(() => {
    if (selectedSubjectFilter === 'all') return subjects;
    return subjects.filter(s => s.code === selectedSubjectFilter);
  }, [subjects, selectedSubjectFilter]);

  // Selected student for student-matrix view
  const selectedStudent = useMemo(() => {
    return students.find(s => s._id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-red-800 flex items-center justify-center text-white shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Semester Attendance Heatmap & Trend Matrix</span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                  BSN 2nd Semester
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Visual gradient representation of subject-specific attendance performance across time
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('subject-matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'subject-matrix'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-red-800" />
              <span>Subject Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('student-matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'student-matrix'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-red-800" />
              <span>Individual Student Heatmap</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Semester Avg Attendance</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-black font-mono ${overallMetrics.averageRate >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {overallMetrics.averageRate}%
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {overallMetrics.averageRate >= 75 ? '✓ Passing Mandate' : '⚠ Below KMU 75%'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Across {overallMetrics.totalSessions} recorded subject lectures
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Total Lecture Dates</span>
            <Calendar className="w-3.5 h-3.5 text-red-800" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {overallMetrics.distinctDates}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Distinct calendar sessions logged
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Top Performing Subject</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1 truncate">
            {overallMetrics.bestSubject ? overallMetrics.bestSubject.subject.name : 'N/A'}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1 font-mono">
            {overallMetrics.bestSubject ? `${overallMetrics.bestSubject.overallRate}% Attendance Rate` : 'No data recorded'}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Attention Subject</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1 truncate">
            {overallMetrics.lowestSubject ? overallMetrics.lowestSubject.subject.name : 'N/A'}
          </div>
          <div className={`text-[10px] font-bold mt-1 font-mono ${(overallMetrics.lowestSubject?.overallRate || 100) < 75 ? 'text-rose-700' : 'text-slate-600'}`}>
            {overallMetrics.lowestSubject ? `${overallMetrics.lowestSubject.overallRate}% Attendance Rate` : 'No data recorded'}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-semibold">Subject:</span>
            <select
              id="select-heatmap-subject-filter"
              value={selectedSubjectFilter}
              onChange={e => setSelectedSubjectFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-red-800 shadow-2xs"
            >
              <option value="all">All 7 BSN Subjects</option>
              {subjects.map(s => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-semibold">Month:</span>
            <select
              id="select-heatmap-month-filter"
              value={selectedMonthFilter}
              onChange={e => setSelectedMonthFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-red-800 shadow-2xs"
            >
              <option value="all">Entire Semester (All Dates)</option>
              {KMU_ACADEMIC_MONTHS.filter(m => m.value !== 'all').map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* If Student Matrix View: Student Selector */}
          {viewMode === 'student-matrix' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-semibold">Student:</span>
              <select
                id="select-heatmap-student-filter"
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-red-800 shadow-2xs max-w-[200px] truncate"
              >
                {students.map(std => (
                  <option key={std._id} value={std._id}>
                    {std.rollNo} - {std.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Legend Scale */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto text-[11px] font-semibold text-slate-600">
          <span className="text-slate-500 mr-1">Intensity Scale:</span>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-rose-700 inline-block shadow-2xs" title="Critical: < 50%" />
            <span className="text-[10px] text-slate-500">&lt;50%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-rose-400 inline-block shadow-2xs" title="Poor: 50% - 64%" />
            <span className="text-[10px] text-slate-500">50-64%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-amber-300 inline-block shadow-2xs" title="Borderline: 65% - 74%" />
            <span className="text-[10px] text-slate-500">65-74%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-emerald-300 inline-block shadow-2xs" title="Good: 75% - 84% (KMU Passing)" />
            <span className="text-[10px] text-slate-500">75-84%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block shadow-2xs" title="Strong: 85% - 94%" />
            <span className="text-[10px] text-slate-500">85-94%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-emerald-700 inline-block shadow-2xs" title="Outstanding: 95% - 100%" />
            <span className="text-[10px] text-slate-500">95-100%</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Container */}
      {activeDates.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Lecture Attendance Records for this Filter</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Attendance records have not yet been marked for the selected time range. As faculty records daily attendance in the Attendance tab, this heatmap will automatically populate with live color gradients.
          </p>
          {onPopulateSampleAttendance && (
            <div className="pt-2">
              <button
                id="btn-heatmap-populate-sample"
                onClick={onPopulateSampleAttendance}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-800 to-rose-700 hover:from-red-900 hover:to-rose-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-red-900/10 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Populate Realistic Semester Attendance Heatmap Data</span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'subject-matrix' ? (
        /* SUBJECT MATRIX VIEW */
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[760px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-2.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 w-56 sticky left-0 z-20 shadow-xs">
                    Subject / Course
                  </th>
                  {activeDates.map(date => {
                    let formatted = date;
                    let dayAbbr = '';
                    try {
                      const d = new Date(date + 'T00:00:00');
                      formatted = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                      dayAbbr = d.toLocaleDateString('en-US', { weekday: 'narrow' });
                    } catch {
                      formatted = date;
                    }
                    return (
                      <th
                        key={date}
                        className="p-1.5 text-center text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 min-w-[42px]"
                      >
                        <div className="text-[9px] text-slate-400 font-mono">{dayAbbr}</div>
                        <div className="font-mono text-slate-700">{formatted}</div>
                      </th>
                    );
                  })}
                  <th className="p-2.5 text-center text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 w-24">
                    Avg Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleSubjects.map((sub, sIdx) => {
                  const sStat = subjectStats.find(s => s.subject.code === sub.code);
                  return (
                    <tr key={sub.code} className="hover:bg-slate-50/50 transition-colors">
                      {/* Subject Name Fixed Column */}
                      <td className="p-2.5 text-xs font-bold text-slate-900 border border-slate-200 bg-white sticky left-0 z-10 shadow-xs">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate" title={sub.name}>{sub.name}</span>
                          <span className="text-[9px] font-mono font-normal text-slate-400 shrink-0">
                            {sub.code}
                          </span>
                        </div>
                      </td>

                      {/* Heatmap Cells for each date */}
                      {activeDates.map(date => {
                        const key = `${date}_${sub.code}`;
                        const cell = heatmapDataMap.get(key) || {
                          date,
                          subjectCode: sub.code,
                          subjectName: sub.name,
                          presentCount: 0,
                          absentCount: 0,
                          leaveCount: 0,
                          totalLogged: 0,
                          totalStudents: students.length,
                          rate: 0,
                          hasData: false
                        };
                        const colorMeta = getHeatmapColor(cell.rate, cell.hasData);

                        return (
                          <td
                            key={date}
                            className="p-1 text-center border border-slate-200 align-middle"
                            onMouseEnter={() => setHoveredCell(cell)}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <button
                              onClick={() => {
                                if (onNavigateToAttendance) {
                                  onNavigateToAttendance(date, sub.code);
                                }
                              }}
                              className={`w-full h-8 rounded-lg flex items-center justify-center text-[10px] transition-all cursor-pointer ${colorMeta.bg}`}
                              title={`${sub.name} on ${date}: ${cell.hasData ? `${cell.rate}% Present (${cell.presentCount}/${cell.totalLogged})` : 'No lecture recorded'}`}
                            >
                              {cell.hasData ? `${cell.rate}%` : '—'}
                            </button>
                          </td>
                        );
                      })}

                      {/* Summary Average Column */}
                      <td className="p-2 text-center border border-slate-200 bg-slate-50">
                        <div className="flex flex-col items-center">
                          <span className={`text-xs font-black font-mono ${(sStat?.overallRate || 0) >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {sStat?.overallRate || 0}%
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {sStat?.sessionsCount || 0} lectures
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* INDIVIDUAL STUDENT MATRIX VIEW */
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {selectedStudent?.name.charAt(0) || 'S'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedStudent?.name}</h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  Roll No: {selectedStudent?.rollNo} • Phone: {selectedStudent?.phone}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500">Student Attendance Ledger</span>
              <div className="text-xs font-bold text-slate-800">
                {selectedStudent?.attendance?.filter(r => r.status === 'Present').length || 0} Present / {selectedStudent?.attendance?.length || 0} Total Sessions
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="min-w-[760px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-2.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 w-56 sticky left-0 z-20 shadow-xs">
                      Subject / Course
                    </th>
                    {activeDates.map(date => {
                      let formatted = date;
                      let dayAbbr = '';
                      try {
                        const d = new Date(date + 'T00:00:00');
                        formatted = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                        dayAbbr = d.toLocaleDateString('en-US', { weekday: 'narrow' });
                      } catch {
                        formatted = date;
                      }
                      return (
                        <th
                          key={date}
                          className="p-1.5 text-center text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 min-w-[42px]"
                        >
                          <div className="text-[9px] text-slate-400 font-mono">{dayAbbr}</div>
                          <div className="font-mono text-slate-700">{formatted}</div>
                        </th>
                      );
                    })}
                    <th className="p-2.5 text-center text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 w-24">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSubjects.map(sub => {
                    const studentSubRecs = selectedStudent?.attendance?.filter(r => r.subjectCode === sub.code) || [];
                    const presentCount = studentSubRecs.filter(r => r.status === 'Present').length;
                    const subRate = studentSubRecs.length > 0 ? Math.round((presentCount / studentSubRecs.length) * 100) : 0;

                    return (
                      <tr key={sub.code} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-2.5 text-xs font-bold text-slate-900 border border-slate-200 bg-white sticky left-0 z-10 shadow-xs">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{sub.name}</span>
                            <span className="text-[9px] font-mono font-normal text-slate-400 shrink-0">
                              {sub.code}
                            </span>
                          </div>
                        </td>

                        {activeDates.map(date => {
                          const record = selectedStudent?.attendance?.find(
                            r => r.date === date && r.subjectCode === sub.code
                          );
                          const status = record?.status;

                          return (
                            <td key={date} className="p-1 text-center border border-slate-200 align-middle">
                              {status === 'Present' ? (
                                <div
                                  className="w-full h-8 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-2xs"
                                  title={`${selectedStudent?.name} was PRESENT for ${sub.name} on ${date}`}
                                >
                                  P
                                </div>
                              ) : status === 'Absent' ? (
                                <div
                                  className="w-full h-8 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-2xs"
                                  title={`${selectedStudent?.name} was ABSENT for ${sub.name} on ${date}`}
                                >
                                  A
                                </div>
                              ) : status === 'Leave' ? (
                                <div
                                  className="w-full h-8 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-2xs"
                                  title={`${selectedStudent?.name} was on APPROVED LEAVE for ${sub.name} on ${date}`}
                                >
                                  L
                                </div>
                              ) : (
                                <div className="w-full h-8 rounded-lg bg-slate-100 text-slate-300 text-[10px] flex items-center justify-center">
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}

                        <td className="p-2 text-center border border-slate-200 bg-slate-50">
                          <span className={`text-xs font-black font-mono ${subRate >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {studentSubRecs.length > 0 ? `${subRate}%` : 'N/A'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Floating / Active Hover Details Card */}
      {hoveredCell && hoveredCell.hasData && (
        <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
              hoveredCell.rate >= 75 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              {hoveredCell.rate}%
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>{hoveredCell.subjectName}</span>
                <span className="text-[10px] text-slate-400 font-mono">({hoveredCell.subjectCode})</span>
              </div>
              <div className="text-slate-300 text-[11px]">
                Lecture Date: <span className="font-mono text-white font-bold">{hoveredCell.date}</span> • Class Attendance:{' '}
                <span className="font-bold text-emerald-400">{hoveredCell.presentCount} Present</span>,{' '}
                <span className="font-bold text-rose-400">{hoveredCell.absentCount} Absent</span>,{' '}
                <span className="font-bold text-amber-400">{hoveredCell.leaveCount} Leave</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
              hoveredCell.rate >= 75 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}>
              {hoveredCell.rate >= 75 ? '✓ Meets KMU Standard' : '⚠ Below 75% Cutoff'}
            </span>
          </div>
        </div>
      )}

      {/* Footer Info Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-red-800 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">
            How to interpret the Khyber Medical University Attendance Heatmap:
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            The color gradient maps the class-wide or individual student attendance intensity over the academic term. Green tones (<strong className="text-emerald-700">75%–100%</strong>) indicate full compliance with KMU examination eligibility criteria. Yellow and Red tones (<strong className="text-rose-700">&lt;75%</strong>) highlight lecture sessions or subjects with elevated absenteeism that may require academic faculty intervention.
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  GraduationCap,
  BookOpen,
  Filter,
  Check,
  AlertTriangle,
  Info,
  CalendarDays,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { Student, Subject, AttendanceRecord } from '../types';
import { KMU_ACADEMIC_MONTHS } from '../data/initialData';
import { KMUSwabiLogo } from './KMUSwabiLogo';
import { exportAttendanceReportPDF, exportMasterFilePDF } from '../utils/pdfExport';

interface StudentAttendanceCalendarModalProps {
  student: Student;
  allStudents?: Student[];
  allSubjects: Subject[];
  initialMonth?: string;
  onClose: () => void;
  onSelectStudent?: (student: Student) => void;
  onOpenPortal?: (student: Student) => void;
  showAlert?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const StudentAttendanceCalendarModal: React.FC<StudentAttendanceCalendarModalProps> = ({
  student,
  allStudents = [],
  allSubjects,
  initialMonth = '2026-09',
  onClose,
  onSelectStudent,
  onOpenPortal,
  showAlert
}) => {
  // Calendar month state (YYYY-MM)
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(() => {
    if (initialMonth && initialMonth !== 'all') return initialMonth;
    // If student has attendance, default to latest recorded month
    if (student.attendance && student.attendance.length > 0) {
      const dates = student.attendance.map(a => a.date).sort();
      const latest = dates[dates.length - 1];
      return latest.substring(0, 7);
    }
    return '2026-09';
  });

  // Filter by subject ('all' or subject code)
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('all');
  
  // Selected day detail inspector
  const [selectedDateString, setSelectedDateString] = useState<string | null>(null);

  // View mode: 'calendar' | 'semester-timeline'
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');

  // Parse current year & month
  const [yearNum, monthNum] = useMemo(() => {
    const parts = currentYearMonth.split('-');
    const y = parseInt(parts[0], 10) || 2026;
    const m = parseInt(parts[1], 10) || 9;
    return [y, m];
  }, [currentYearMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    let nextY = yearNum;
    let nextM = monthNum - 1;
    if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    }
    setCurrentYearMonth(`${nextY}-${String(nextM).padStart(2, '0')}`);
    setSelectedDateString(null);
  };

  const handleNextMonth = () => {
    let nextY = yearNum;
    let nextM = monthNum + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setCurrentYearMonth(`${nextY}-${String(nextM).padStart(2, '0')}`);
    setSelectedDateString(null);
  };

  // Month metadata
  const monthName = useMemo(() => {
    const d = new Date(yearNum, monthNum - 1, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [yearNum, monthNum]);

  // Student Index in directory for Prev / Next switching
  const currentIndex = allStudents.findIndex(s => s._id === student._id);
  const prevStudent = currentIndex > 0 ? allStudents[currentIndex - 1] : null;
  const nextStudent = currentIndex >= 0 && currentIndex < allStudents.length - 1 ? allStudents[currentIndex + 1] : null;

  // Filter attendance records by subject
  const studentAttendance = useMemo(() => {
    let records = student.attendance || [];
    if (selectedSubjectCode !== 'all') {
      records = records.filter(r => r.subjectCode === selectedSubjectCode);
    }
    return records;
  }, [student.attendance, selectedSubjectCode]);

  // Attendance in current selected month
  const currentMonthRecords = useMemo(() => {
    return studentAttendance.filter(r => r.date.startsWith(currentYearMonth));
  }, [studentAttendance, currentYearMonth]);

  // Group records by date (YYYY-MM-DD -> AttendanceRecord[])
  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    studentAttendance.forEach(rec => {
      const existing = map.get(rec.date) || [];
      existing.push(rec);
      map.set(rec.date, existing);
    });
    return map;
  }, [studentAttendance]);

  // Overall semester stats for this student
  const semesterStats = useMemo(() => {
    const total = studentAttendance.length;
    const present = studentAttendance.filter(r => r.status === 'Present').length;
    const absent = studentAttendance.filter(r => r.status === 'Absent').length;
    const leave = studentAttendance.filter(r => r.status === 'Leave').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { total, present, absent, leave, rate };
  }, [studentAttendance]);

  // Current month stats
  const monthStats = useMemo(() => {
    const total = currentMonthRecords.length;
    const present = currentMonthRecords.filter(r => r.status === 'Present').length;
    const absent = currentMonthRecords.filter(r => r.status === 'Absent').length;
    const leave = currentMonthRecords.filter(r => r.status === 'Leave').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { total, present, absent, leave, rate };
  }, [currentMonthRecords]);

  // Subject-wise Breakdown stats
  const subjectBreakdowns = useMemo(() => {
    return allSubjects.map(sub => {
      const subRecords = (student.attendance || []).filter(a => a.subjectCode === sub.code);
      const total = subRecords.length;
      const present = subRecords.filter(a => a.status === 'Present').length;
      const absent = subRecords.filter(a => a.status === 'Absent').length;
      const leave = subRecords.filter(a => a.status === 'Leave').length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 100;
      return { subject: sub, total, present, absent, leave, rate };
    });
  }, [allSubjects, student.attendance]);

  // Calendar matrix calculations (Mon to Sun)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(yearNum, monthNum - 1, 1);
    const daysInCurrentMonth = new Date(yearNum, monthNum, 0).getDate();
    
    // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    // Convert so Monday is 0, Sunday is 6
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInPrevMonth = new Date(yearNum, monthNum - 1, 0).getDate();

    const cells: Array<{
      dateString: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      records: AttendanceRecord[];
      isWeekend: boolean;
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonthNum = monthNum === 1 ? 12 : monthNum - 1;
      const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
      const dateStr = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(prevYear, prevMonthNum - 1, day).getDay();
      
      cells.push({
        dateString: dateStr,
        dayNum: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        records: recordsByDate.get(dateStr) || [],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(yearNum, monthNum - 1, d).getDay();
      
      cells.push({
        dateString: dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        records: recordsByDate.get(dateStr) || [],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    // Next month padding to fill complete weeks (up to multiple of 7)
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
      const nextYear = monthNum === 12 ? yearNum + 1 : yearNum;
      const dateStr = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(nextYear, nextMonthNum - 1, d).getDay();

      cells.push({
        dateString: dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        records: recordsByDate.get(dateStr) || [],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    return cells;
  }, [yearNum, monthNum, recordsByDate]);

  // Selected Day's sessions
  const selectedDaySessions = useMemo(() => {
    if (!selectedDateString) return [];
    return recordsByDate.get(selectedDateString) || [];
  }, [selectedDateString, recordsByDate]);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      id="modal-student-attendance-calendar"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-950 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-base shrink-0 shadow-inner">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">{student.name}</h2>
                <span className="bg-white/20 backdrop-blur-md text-white font-mono text-xs font-bold px-2.5 py-0.5 rounded-md">
                  {student.rollNo}
                </span>
                <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-bold px-2 py-0.5 rounded">
                  BSN 2nd Sem (Sec A)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-red-100/80 mt-1 flex-wrap">
                <span>Father: <strong className="text-white font-medium">{student.fatherName || 'Official Verified'}</strong></span>
                <span>•</span>
                <span>Reg: <strong className="text-white font-mono">{student.registrationNo || 'KMU-SWB-2025'}</strong></span>
                <span>•</span>
                <span>Contact: <strong className="text-white font-mono">{student.phone}</strong></span>
              </div>
            </div>
          </div>

          {/* Header Controls & Quick Switcher */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            {/* Prev/Next Student Cycler */}
            {allStudents.length > 1 && onSelectStudent && (
              <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-white/10 text-xs">
                <button
                  id="btn-cal-prev-student"
                  onClick={() => prevStudent && onSelectStudent(prevStudent)}
                  disabled={!prevStudent}
                  className="px-2 py-1 rounded text-white disabled:opacity-40 hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  title={prevStudent ? `Previous: ${prevStudent.name} (${prevStudent.rollNo})` : 'No previous student'}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Prev</span>
                </button>
                <span className="text-[10px] font-mono text-red-200 px-1.5">
                  {currentIndex + 1}/{allStudents.length}
                </span>
                <button
                  id="btn-cal-next-student"
                  onClick={() => nextStudent && onSelectStudent(nextStudent)}
                  disabled={!nextStudent}
                  className="px-2 py-1 rounded text-white disabled:opacity-40 hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  title={nextStudent ? `Next: ${nextStudent.name} (${nextStudent.rollNo})` : 'No next student'}
                >
                  <span className="hidden sm:inline text-[11px]">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Student Portal Switcher */}
            {onOpenPortal && (
              <button
                id="btn-cal-open-portal"
                onClick={() => onOpenPortal(student)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Open Student Portal for this candidate"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Student Portal</span>
              </button>
            )}

            {/* Close Modal */}
            <button
              id="btn-close-attendance-calendar"
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Close (Esc)"
              aria-label="Close modal"
            >
              <span className="text-base font-bold leading-none px-1">✕</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* TOP METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Semester Attendance
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className={`text-2xl font-black font-mono ${semesterStats.rate >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {semesterStats.total > 0 ? `${semesterStats.rate}%` : '100%'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  semesterStats.rate >= 75
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {semesterStats.rate >= 75 ? '✓ Exam Eligible' : '⚠ Shortage'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {semesterStats.present} of {semesterStats.total} Sessions Attended
              </p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Present Lectures
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-700 font-mono">{semesterStats.present}</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded">
                  Regular
                </span>
              </div>
              <p className="text-[11px] text-emerald-700/80 mt-1">
                In-Class Biometric Verified
              </p>
            </div>

            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                Unexcused Absents
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-700 font-mono">{semesterStats.absent}</span>
                <span className="text-[10px] font-bold text-rose-800 bg-rose-100/60 px-2 py-0.5 rounded">
                  Missed
                </span>
              </div>
              <p className="text-[11px] text-rose-700/80 mt-1">
                {semesterStats.absent === 0 ? 'Zero unexcused absences' : 'Needs official justification'}
              </p>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Official Leaves
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-700 font-mono">{semesterStats.leave}</span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded">
                  Excused
                </span>
              </div>
              <p className="text-[11px] text-amber-700/80 mt-1">
                Approved Medical / Duty
              </p>
            </div>
          </div>

          {/* CONTROLS BAR: MONTH SELECTOR, SUBJECT FILTER & VIEW TOGGLE */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Month Navigator */}
            <div className="flex items-center gap-2">
              <button
                id="btn-cal-prev-month"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-red-800" />
                <span className="font-bold text-sm text-slate-900 min-w-32">{monthName}</span>
              </div>

              <button
                id="btn-cal-next-month"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <select
                id="select-calendar-quick-month"
                value={currentYearMonth}
                onChange={e => {
                  setCurrentYearMonth(e.target.value);
                  setSelectedDateString(null);
                }}
                className="bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-800 cursor-pointer ml-1"
              >
                {KMU_ACADEMIC_MONTHS.filter(m => m.value !== 'all').map(m => (
                  <option key={m.value} value={m.value}>
                    {m.shortLabel}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter & View Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  id="select-calendar-subject-filter"
                  value={selectedSubjectCode}
                  onChange={e => setSelectedSubjectCode(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-800 cursor-pointer"
                >
                  <option value="all">All 7 KMU Subjects</option>
                  {allSubjects.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.code}: {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  id="btn-view-calendar-grid"
                  onClick={() => setViewMode('calendar')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'calendar'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Calendar Grid</span>
                </button>
                <button
                  id="btn-view-timeline-ledger"
                  onClick={() => setViewMode('timeline')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'timeline'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Timeline Ledger</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAIN VIEW: CALENDAR GRID OR TIMELINE */}
          {viewMode === 'calendar' ? (
            <div className="space-y-4">
              {/* CALENDAR MATRIX */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 bg-slate-100 text-slate-700 border-b border-slate-200 text-center font-bold text-xs py-2.5">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span className="text-slate-400">Sat</span>
                  <span className="text-slate-400">Sun</span>
                </div>

                {/* Calendar Grid Cells */}
                <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
                  {calendarDays.map((cell, idx) => {
                    const isSelected = selectedDateString === cell.dateString;
                    const hasRecords = cell.records.length > 0;
                    const presentCount = cell.records.filter(r => r.status === 'Present').length;
                    const absentCount = cell.records.filter(r => r.status === 'Absent').length;
                    const leaveCount = cell.records.filter(r => r.status === 'Leave').length;

                    return (
                      <div
                        key={idx}
                        onClick={() => hasRecords && setSelectedDateString(cell.dateString)}
                        className={`min-h-[85px] p-2 flex flex-col justify-between transition-all relative ${
                          !cell.isCurrentMonth
                            ? 'bg-slate-50/40 text-slate-400'
                            : cell.isWeekend
                            ? 'bg-slate-50/70 text-slate-700'
                            : 'bg-white text-slate-800'
                        } ${
                          isSelected
                            ? 'ring-2 ring-red-800 bg-red-50/40 z-10'
                            : hasRecords
                            ? 'hover:bg-slate-50 cursor-pointer'
                            : ''
                        }`}
                      >
                        {/* Day Number and Badges */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold inline-flex items-center justify-center h-6 w-6 rounded-full ${
                              cell.isToday
                                ? 'bg-red-800 text-white font-black'
                                : isSelected
                                ? 'bg-slate-900 text-white'
                                : cell.isCurrentMonth
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {cell.dayNum}
                          </span>

                          {hasRecords && (
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1 rounded">
                              {cell.records.length} {cell.records.length === 1 ? 'class' : 'classes'}
                            </span>
                          )}
                        </div>

                        {/* Attendance Status Indicators for this day */}
                        <div className="mt-1.5 space-y-1">
                          {hasRecords ? (
                            cell.records.slice(0, 2).map((rec, rIdx) => {
                              const isPresent = rec.status === 'Present';
                              const isAbsent = rec.status === 'Absent';
                              return (
                                <div
                                  key={rIdx}
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center justify-between border ${
                                    isPresent
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : isAbsent
                                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                  title={`${rec.subjectCode}: ${rec.status}`}
                                >
                                  <span className="font-mono truncate">{rec.subjectCode}</span>
                                  <span>{isPresent ? '✓' : isAbsent ? '✗' : '○'}</span>
                                </div>
                              );
                            })
                          ) : cell.isCurrentMonth && !cell.isWeekend ? (
                            <span className="text-[9px] text-slate-300 italic block text-center py-1">
                              No Session
                            </span>
                          ) : null}

                          {cell.records.length > 2 && (
                            <span className="text-[9px] font-bold text-red-800 block text-center">
                              +{cell.records.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CALENDAR LEGEND */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-bold text-slate-600">Legend:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-700 font-medium">Present (Attended)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500"></span>
                    <span className="text-slate-700 font-medium">Absent (Unexcused)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                    <span className="text-slate-700 font-medium">Leave (Excused)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-800"></span>
                    <span className="text-slate-700 font-medium">Today</span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 italic">
                  Tip: Click on any active date cell to inspect all lecture sessions
                </span>
              </div>
            </div>
          ) : (
            /* SEMESTER TIMELINE / LEDGER VIEW */
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-800" />
                  <span>Chronological Lecture Sessions History ({studentAttendance.length} Recorded)</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Showing sessions for {selectedSubjectCode === 'all' ? 'All Subjects' : selectedSubjectCode}
                </span>
              </div>

              {studentAttendance.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No lecture sessions recorded yet for this student.</p>
                  <p className="text-xs text-slate-400 mt-1">Use the Attendance Register tab to lock daily classes.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                  {[...studentAttendance]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((rec, idx) => {
                      const isPresent = rec.status === 'Present';
                      const isAbsent = rec.status === 'Absent';
                      const subObj = allSubjects.find(s => s.code === rec.subjectCode);

                      return (
                        <div
                          key={idx}
                          className="py-3 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                                isPresent
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : isAbsent
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {isPresent ? '✓' : isAbsent ? '✗' : '○'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">
                                  {rec.subjectCode} — {subObj?.name || 'BSN 2nd Semester Course'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 border border-slate-200 px-1.5 rounded">
                                  {subObj?.creditHours || '3+0'} CR
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span className="font-mono font-medium text-slate-700">{rec.date}</span>
                                <span>•</span>
                                <span>Academic Session 2026</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                isPresent
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : isAbsent
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* DAY DETAIL INSPECTOR PANEL (IF DAY CLICKED) */}
          {selectedDateString && (
            <div className="bg-red-50/60 border border-red-200 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-red-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-red-800" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Day Lecture Audit: <span className="text-red-900 font-mono font-black">{selectedDateString}</span>
                  </h3>
                  <span className="bg-red-100 text-red-900 text-[10px] font-bold px-2 py-0.5 rounded">
                    {selectedDaySessions.length} {selectedDaySessions.length === 1 ? 'Session' : 'Sessions'} Recorded
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDateString(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
                >
                  ✕ Close Day View
                </button>
              </div>

              {selectedDaySessions.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No lecture sessions registered on this date.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedDaySessions.map((ses, idx) => {
                    const subObj = allSubjects.find(s => s.code === ses.subjectCode);
                    const isPresent = ses.status === 'Present';
                    const isAbsent = ses.status === 'Absent';

                    return (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">
                            {ses.subjectCode}: {subObj?.name || 'BSN Course'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Credit Hours: {subObj?.creditHours || '3+0'} • Swabi Campus INS
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            isPresent
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isAbsent
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {ses.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUBJECT-WISE ATTENDANCE PROGRESS BARS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-800" />
                <span>7 KMU BSN 2nd Semester Subject Performance Breakdown</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Minimum Exam Threshold: 75%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subjectBreakdowns.map((item, idx) => {
                const isShortage = item.total > 0 && item.rate < 75;

                return (
                  <div key={idx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-900 truncate mr-2">
                        <span className="text-red-900 font-mono mr-1.5">{item.subject.code}</span>
                        <span>{item.subject.name}</span>
                      </div>
                      <span className={`font-mono font-bold ${isShortage ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {item.total > 0 ? `${item.rate}%` : 'N/A'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.total === 0
                            ? 'bg-slate-300 w-0'
                            : isShortage
                            ? 'bg-rose-600'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${item.total > 0 ? item.rate : 0}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Total: {item.total}</span>
                      <span className="text-emerald-700 font-bold">P: {item.present}</span>
                      <span className="text-rose-700 font-bold">A: {item.absent}</span>
                      <span className="text-amber-700 font-bold">L: {item.leave}</span>
                      <span className={`font-bold ${isShortage ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {item.total === 0 ? 'Fresh Record' : isShortage ? '⚠ Shortage' : '✓ OK'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER WITH PDF EXPORTS */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Official University Ledger • Khyber Medical University Swabi Campus</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-cal-export-attendance-pdf"
              onClick={() => {
                try {
                  exportAttendanceReportPDF(student, allSubjects, selectedSubjectCode === 'all' ? undefined : selectedSubjectCode, currentYearMonth);
                  if (showAlert) showAlert(`Official Attendance PDF for ${student.name} downloaded!`, 'success');
                } catch (e) {
                  console.error(e);
                  if (showAlert) showAlert('Failed to export Attendance PDF', 'error');
                }
              }}
              className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Download formatted Official KMU Attendance Report (PDF)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Attendance PDF</span>
            </button>

            <button
              id="btn-cal-export-master-pdf"
              onClick={() => {
                try {
                  exportMasterFilePDF(student, allSubjects, currentYearMonth);
                  if (showAlert) showAlert(`Master File PDF for ${student.name} downloaded!`, 'success');
                } catch (e) {
                  console.error(e);
                  if (showAlert) showAlert('Failed to export Master File PDF', 'error');
                }
              }}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Download complete Student Master Dossier (PDF)"
            >
              <Download className="w-3.5 h-3.5 text-red-800" />
              <span>Master Dossier PDF</span>
            </button>

            <button
              id="btn-cal-close-bottom"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

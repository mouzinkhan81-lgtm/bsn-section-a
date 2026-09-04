import React, { useMemo } from 'react';
import {
  Flame,
  Zap,
  Trophy,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Sparkles,
  TrendingUp,
  Target,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { Student, Subject, AttendanceRecord } from '../types';

interface AttendanceStreakWidgetProps {
  student: Student;
  allSubjects?: Subject[];
  onOpenCalendar?: () => void;
  compact?: boolean;
}

export interface DayAttendanceSummary {
  date: string;
  formattedDate: string;
  dayName: string;
  records: AttendanceRecord[];
  totalLectures: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  status: 'Present' | 'Absent' | 'Leave' | 'Mixed';
  isConsecutivePresent: boolean;
}

export const AttendanceStreakWidget: React.FC<AttendanceStreakWidgetProps> = ({
  student,
  allSubjects = [],
  onOpenCalendar,
  compact = false
}) => {
  // Calculate attendance streak and stats
  const {
    currentStreak,
    longestStreak,
    totalDaysAttended,
    totalLectureDays,
    recentDays,
    nextMilestone,
    milestoneProgress,
    milestoneTier,
    motivationalMessage,
    streakColorClass
  } = useMemo(() => {
    const attendance = student.attendance || [];

    // Group records by calendar date
    const dateMap = new Map<string, AttendanceRecord[]>();
    attendance.forEach(rec => {
      if (!rec.date) return;
      const existing = dateMap.get(rec.date) || [];
      existing.push(rec);
      dateMap.set(rec.date, existing);
    });

    // Sort distinct dates chronologically
    const sortedDates = Array.from(dateMap.keys()).sort();

    // Summarize each day
    const daySummaries: DayAttendanceSummary[] = sortedDates.map(dateStr => {
      const recs = dateMap.get(dateStr) || [];
      const presentCount = recs.filter(r => r.status === 'Present').length;
      const absentCount = recs.filter(r => r.status === 'Absent').length;
      const leaveCount = recs.filter(r => r.status === 'Leave').length;
      const totalLectures = recs.length;

      let status: 'Present' | 'Absent' | 'Leave' | 'Mixed' = 'Present';
      if (absentCount > 0 && presentCount === 0) {
        status = 'Absent';
      } else if (leaveCount > 0 && presentCount === 0 && absentCount === 0) {
        status = 'Leave';
      } else if (absentCount > 0 && presentCount > 0) {
        status = 'Mixed';
      } else if (presentCount > 0 && absentCount === 0) {
        status = 'Present';
      }

      // A day counts as consecutive present if present > 0 and absent === 0
      const isConsecutivePresent = presentCount > 0 && absentCount === 0;

      // Date formatting
      let formattedDate = dateStr;
      let dayName = '';
      try {
        const d = new Date(dateStr + 'T00:00:00');
        formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      } catch {
        formattedDate = dateStr;
      }

      return {
        date: dateStr,
        formattedDate,
        dayName,
        records: recs,
        totalLectures,
        presentCount,
        absentCount,
        leaveCount,
        status,
        isConsecutivePresent
      };
    });

    // 1. Calculate Longest Streak in full semester history
    let maxStreak = 0;
    let tempStreak = 0;
    daySummaries.forEach(day => {
      if (day.isConsecutivePresent) {
        tempStreak += 1;
        if (tempStreak > maxStreak) {
          maxStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    });

    // 2. Calculate Current Active Streak (from most recent date backwards)
    let curStreak = 0;
    for (let i = daySummaries.length - 1; i >= 0; i--) {
      if (daySummaries[i].isConsecutivePresent) {
        curStreak += 1;
      } else {
        break;
      }
    }

    const totalDaysAttended = daySummaries.filter(d => d.isConsecutivePresent).length;
    const totalLectureDays = daySummaries.length;

    // Recent 7 days trail (last 7 recorded days in chronological order)
    const recentDays = daySummaries.slice(-7);

    // Milestone calculation
    // Milestones: 3 days (Bronze), 5 days (Silver), 10 days (Gold), 15 days (Diamond), 30 days (KMU Legend)
    let nextMilestone = 3;
    let milestoneTier = 'Beginner';
    if (curStreak < 3) {
      nextMilestone = 3;
      milestoneTier = 'Bronze Starter';
    } else if (curStreak < 5) {
      nextMilestone = 5;
      milestoneTier = 'Bronze Achiever';
    } else if (curStreak < 10) {
      nextMilestone = 10;
      milestoneTier = 'Silver Scholar';
    } else if (curStreak < 15) {
      nextMilestone = 15;
      milestoneTier = 'Gold Honor';
    } else {
      nextMilestone = Math.ceil((curStreak + 1) / 10) * 10;
      milestoneTier = 'KMU Diamond Legend';
    }

    const prevMilestoneBase = curStreak < 3 ? 0 : curStreak < 5 ? 3 : curStreak < 10 ? 5 : curStreak < 15 ? 10 : 15;
    const milestoneProgress = Math.min(
      100,
      Math.max(0, Math.round(((curStreak - prevMilestoneBase) / (nextMilestone - prevMilestoneBase)) * 100))
    );

    // Motivational messaging
    let motivationalMessage = 'Attend all lectures today to start your consecutive present streak!';
    let streakColorClass = 'text-slate-700 from-slate-500 to-slate-700';

    if (curStreak === 0) {
      motivationalMessage = totalLectureDays > 0
        ? 'Your streak is currently reset. Attend upcoming classes to ignite a fresh streak!'
        : 'Welcome to the semester! Attend all classes to start your streak.';
      streakColorClass = 'text-slate-600 from-slate-600 to-slate-800';
    } else if (curStreak === 1) {
      motivationalMessage = '🌱 Great start! 1 day present. Attend tomorrow to double your streak.';
      streakColorClass = 'text-emerald-700 from-emerald-600 to-teal-700';
    } else if (curStreak === 2) {
      motivationalMessage = '⚡ Momentum building! 2 days in a row. 1 more day to unlock the 3-Day Bronze badge!';
      streakColorClass = 'text-amber-600 from-amber-500 to-orange-600';
    } else if (curStreak >= 3 && curStreak < 5) {
      motivationalMessage = `🔥 Hot Streak! ${curStreak} consecutive days present. You are building top-tier consistency.`;
      streakColorClass = 'text-orange-600 from-orange-500 to-red-600';
    } else if (curStreak >= 5 && curStreak < 10) {
      motivationalMessage = `⚡ Power Streak! ${curStreak} days without missing a lecture. 100% exam eligibility track.`;
      streakColorClass = 'text-red-700 from-red-600 to-rose-700';
    } else {
      motivationalMessage = `🏆 Master Scholar Streak! ${curStreak} consecutive days. KMU Swabi Dean's Honor Roll tier!`;
      streakColorClass = 'text-purple-700 from-purple-600 to-pink-700';
    }

    return {
      currentStreak: curStreak,
      longestStreak: maxStreak,
      totalDaysAttended,
      totalLectureDays,
      recentDays,
      nextMilestone,
      milestoneProgress,
      milestoneTier,
      motivationalMessage,
      streakColorClass
    };
  }, [student.attendance]);

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
              currentStreak > 0 ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'
            }`}>
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Attendance Streak</span>
                {currentStreak >= 3 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-orange-100 text-orange-800 rounded-full border border-orange-200">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-slate-900">{currentStreak}</span>
                <span className="text-xs font-bold text-slate-600">
                  {currentStreak === 1 ? 'Day Present' : 'Days Present'}
                </span>
                <span className="text-[11px] text-slate-600 ml-2">
                  (Best: <strong className="text-slate-800 font-mono">{longestStreak}d</strong>)
                </span>
              </div>
            </div>
          </div>

          {onOpenCalendar && (
            <button
              onClick={onOpenCalendar}
              className="text-xs font-bold text-red-800 hover:text-red-900 bg-white hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden relative">
      {/* Decorative background aura */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-100/40 via-amber-50/20 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
            currentStreak > 0
              ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 text-white shadow-orange-500/20'
              : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>
            <Flame className={`w-6 h-6 ${currentStreak >= 3 ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Recent Attendance Streak</h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${
                currentStreak >= 3
                  ? 'bg-orange-50 text-orange-800 border-orange-200'
                  : currentStreak > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {milestoneTier}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Consecutive days with complete 'Present' status in all scheduled KMU lectures
            </p>
          </div>
        </div>

        {onOpenCalendar && (
          <button
            id="btn-streak-open-calendar"
            onClick={onOpenCalendar}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            title="Open Complete Semester Attendance Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-red-800" />
            <span>View Calendar</span>
          </button>
        )}
      </div>

      {/* Main Grid: Streak Numbers & Milestone Progress */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {/* Card 1: Current Active Streak */}
        <div className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 border border-amber-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-600 text-xs font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Current Streak
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200">
                ACTIVE
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 tracking-tight">
                {currentStreak}
              </span>
              <span className="text-sm font-bold text-slate-700">
                {currentStreak === 1 ? 'Day Present' : 'Days Present'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-slate-600">
            <span>Semester Best:</span>
            <span className="font-mono font-bold text-slate-900">{longestStreak} Consecutive Days</span>
          </div>
        </div>

        {/* Card 2: Attendance Velocity & Days Attended */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-600 text-xs font-semibold mb-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Lecture Days Attended
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200">
                TOTAL
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 tracking-tight">
                {totalDaysAttended}
              </span>
              <span className="text-sm font-medium text-slate-500">
                / {totalLectureDays} total days
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
            <span>Consistency Ratio:</span>
            <span className="font-mono font-bold text-emerald-700">
              {totalLectureDays > 0 ? Math.round((totalDaysAttended / totalLectureDays) * 100) : 100}% of Days
            </span>
          </div>
        </div>

        {/* Card 3: Next Streak Milestone Goal */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-600 text-xs font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-purple-600" />
                Next Goal: {nextMilestone} Days
              </span>
              <span className="text-[10px] font-bold text-purple-800 bg-purple-100/70 px-1.5 py-0.5 rounded border border-purple-200">
                {currentStreak >= nextMilestone ? 'ACHIEVED' : `${nextMilestone - currentStreak}d to go`}
              </span>
            </div>

            <div className="mt-2.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                <span>Milestone Progress</span>
                <span className="font-mono text-purple-800">{milestoneProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${milestoneProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
            <span>Reward Tier:</span>
            <span className="font-bold text-purple-900 flex items-center gap-1">
              <Award className="w-3 h-3 text-purple-600" />
              {milestoneTier}
            </span>
          </div>
        </div>
      </div>

      {/* Recent 7 Recorded Lecture Days Trail */}
      <div className="mt-5 pt-4 border-t border-slate-200 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Recent Activity Trail (Last {recentDays.length > 0 ? recentDays.length : 7} Recorded Sessions)</span>
          </h4>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Hover over day pills to view session breakdown
          </span>
        </div>

        {recentDays.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
            No class attendance records have been registered yet for this semester. Attendance will populate as faculty conducts daily lectures.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {recentDays.map((day, idx) => {
              const isPresent = day.isConsecutivePresent;
              const isAbsent = day.absentCount > 0;
              const isLeave = day.leaveCount > 0 && !isAbsent && !isPresent;

              return (
                <div
                  key={day.date || idx}
                  className={`rounded-xl p-2.5 border transition-all flex flex-col items-center justify-center text-center relative group ${
                    isPresent
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-xs hover:border-emerald-300'
                      : isAbsent
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950 shadow-xs hover:border-rose-300'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950 shadow-xs hover:border-amber-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {day.dayName || 'Day'}
                  </span>
                  <span className="text-xs font-black font-mono mt-0.5 text-slate-900">
                    {day.formattedDate}
                  </span>

                  <div className="mt-1.5 flex items-center gap-1">
                    {isPresent && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Present</span>
                      </span>
                    )}
                    {isAbsent && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-800 bg-white px-1.5 py-0.5 rounded-md border border-rose-200 shadow-2xs">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Absent</span>
                      </span>
                    )}
                    {isLeave && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-800 bg-white px-1.5 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Leave</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 mt-1 font-mono">
                    {day.totalLectures} {day.totalLectures === 1 ? 'class' : 'classes'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Motivational Bottom Callout */}
      <div className="mt-4 bg-gradient-to-r from-red-900 via-red-800 to-red-950 text-white rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{motivationalMessage}</p>
            <p className="text-[11px] text-red-100/80">
              KMU Academic Mandate: Maintain 75%+ attendance to secure eligibility for the BSN 2nd Semester Final Examinations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <span className="text-[11px] font-bold px-2.5 py-1 bg-white/15 rounded-lg text-red-100 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>75% Minimum Required</span>
          </span>
        </div>
      </div>
    </div>
  );
};

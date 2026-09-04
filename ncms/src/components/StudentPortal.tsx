import React, { useState } from 'react';
import {
  User,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BookOpen,
  CreditCard,
  Download,
  Printer,
  ShieldCheck,
  Phone,
  Mail,
  Award,
  Key,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ChevronRight,
  LogOut,
  FileText,
  Clock,
  QrCode,
  School,
  XCircle,
  TrendingUp,
  Percent,
  Lock
} from 'lucide-react';
import { Student, Subject } from '../types';
import { KMUSwabiLogo } from './KMUSwabiLogo';
import { KMU_ACADEMIC_MONTHS } from '../data/initialData';
import { exportMasterFilePDF, exportAttendanceReportPDF } from '../utils/pdfExport';
import { StudentAttendanceCalendarModal } from './StudentAttendanceCalendarModal';
import { AttendanceStreakWidget } from './AttendanceStreakWidget';

interface StudentPortalProps {
  student: Student;
  allSubjects: Subject[];
  onLogout: () => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onSwitchToAdmin: () => void;
  showAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  allSubjects,
  onLogout,
  onUpdateStudent,
  onSwitchToAdmin,
  showAlert
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'fees' | 'subjects' | 'admitCard' | 'profile'>('overview');
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [phoneInput, setPhoneInput] = useState(student.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');

  // Filtered attendance list based on selected academic month
  const activeAttendanceRecords = (student.attendance || []).filter(a => {
    if (selectedMonthFilter === 'all') return true;
    return a.date.startsWith(selectedMonthFilter);
  });

  // Calculate student attendance statistics (all vs filtered)
  const totalLectures = activeAttendanceRecords.length;
  const presentLectures = activeAttendanceRecords.filter(a => a.status === 'Present').length;
  const absentLectures = activeAttendanceRecords.filter(a => a.status === 'Absent').length;
  const leaveLectures = activeAttendanceRecords.filter(a => a.status === 'Leave').length;
  const attendanceRate = totalLectures > 0 ? Math.round((presentLectures / totalLectures) * 100) : 100;
  const isAttendanceEligible = attendanceRate >= 75;

  // Subject-wise attendance calculation for the active month or full session
  const subjectAttendance = allSubjects.map(sub => {
    const records = activeAttendanceRecords.filter(a => a.subjectCode === sub.code);
    const subTotal = records.length;
    const subPresent = records.filter(a => a.status === 'Present').length;
    const subAbsent = records.filter(a => a.status === 'Absent').length;
    const subLeave = records.filter(a => a.status === 'Leave').length;
    const subRate = subTotal > 0 ? Math.round((subPresent / subTotal) * 100) : 100;
    return {
      ...sub,
      total: subTotal,
      present: subPresent,
      absent: subAbsent,
      leave: subLeave,
      rate: subRate
    };
  });

  const activeMonthObj = KMU_ACADEMIC_MONTHS.find(m => m.value === selectedMonthFilter) || KMU_ACADEMIC_MONTHS[0];

  const handleExportMasterFile = () => {
    try {
      exportMasterFilePDF(student, allSubjects);
      showAlert('Official KMU Master File PDF generated & downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showAlert('Failed to generate Master File PDF', 'error');
    }
  };

  const handleExportAttendance = () => {
    try {
      exportAttendanceReportPDF(student, allSubjects, undefined, selectedMonthFilter);
      showAlert(`Official KMU Attendance Report (${activeMonthObj.shortLabel}) PDF generated & downloaded!`, 'success');
    } catch (err) {
      console.error(err);
      showAlert('Failed to generate Attendance Report PDF', 'error');
    }
  };

  const handleUpdatePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      showAlert('Please enter a valid phone number', 'error');
      return;
    }
    const updated: Student = {
      ...student,
      phone: phoneInput.trim()
    };
    onUpdateStudent(updated);
    showAlert('WhatsApp contact updated successfully in your portal record!', 'success');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (student.password && currentPassword !== student.password && currentPassword !== 'kmu123') {
      showAlert('Current password does not match', 'error');
      return;
    }
    if (newPassword.length < 4) {
      showAlert('New password must be at least 4 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('New passwords do not match', 'error');
      return;
    }
    const updated: Student = {
      ...student,
      password: newPassword
    };
    onUpdateStudent(updated);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showAlert('Portal password changed successfully! Use your new password on next login.', 'success');
  };

  // Download personal JSON transcript
  const handleDownloadPersonalRecord = () => {
    try {
      const studentData = {
        kmuPortal: 'Khyber Medical University Swabi - Student Personal Academic & Fee Record',
        campus: 'KMU Swabi Campus (Institute of Nursing Sciences)',
        studentProfile: {
          name: student.name,
          rollNo: student.rollNo,
          email: student.email,
          phone: student.phone,
          university: 'Khyber Medical University Swabi',
          campus: 'Swabi Campus',
          department: 'Institute of Nursing Sciences (INS)',
          semester: student.semester,
          section: student.section,
          registrationNo: student.registrationNo || `KMU-SWB-2025-${student.rollNo}`,
          generatedAt: new Date().toISOString()
        },
        academicAttendance: {
          overallPercentage: `${attendanceRate}%`,
          status: isAttendanceEligible ? 'KMU 75% Exam Policy Met (Eligible)' : 'Deficient Attendance',
          totalSessionsHeld: totalLectures,
          presentCount: presentLectures,
          absentCount: absentLectures,
          leaveCount: leaveLectures,
          subjectBreakdown: subjectAttendance
        },
        financialFeeStatus: {
          totalSemesterFee: student.fee?.totalFee || 102800,
          paidAmount: student.fee?.paidFee || 102800,
          pendingAmount: student.fee?.pendingFee || 0,
          feeStatus: student.fee?.status || 'Paid',
          paymentHistory: student.fee?.payments || []
        }
      };

      const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(studentData, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${student.rollNo}_${student.name.replace(/\s+/g, '_')}_KMU_Swabi_Record.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showAlert('Your official KMU Swabi student academic record JSON has been downloaded', 'success');
    } catch {
      showAlert('Failed to download student record', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Top Student Navigation Bar */}
      <header className="border-b border-red-900/20 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-full bg-white p-0.5 shadow-sm flex items-center justify-center shrink-0 border border-slate-200">
              <KMUSwabiLogo className="w-10 h-10" variant="badge" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base">KMU Swabi Student Portal</span>
                <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  IHS Swabi Campus • BSN-II
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Khyber Medical University Swabi • Institute of Health Sciences (IHS)
              </p>
            </div>
          </div>

          {/* Student Status Quick Bar & User Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-slate-500">Logged in:</span>
              <strong className="text-slate-900 font-semibold">{student.name}</strong>
              <span className="text-slate-300">|</span>
              <span className="text-red-800 font-mono font-bold">{student.rollNo}</span>
            </div>

            <button
              id="btn-student-switch-admin"
              onClick={onSwitchToAdmin}
              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Open faculty and administration management view"
            >
              <School className="w-3.5 h-3.5 text-red-800" />
              <span>Admin / Faculty View</span>
            </button>

            <button
              id="btn-student-logout"
              onClick={onLogout}
              className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation for Student */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap md:flex-nowrap space-x-1 border-t border-slate-200 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { id: 'overview', label: 'My Dashboard & ID Card', icon: User },
            { id: 'attendance', label: 'My Attendance Logs', icon: Calendar },
            { id: 'fees', label: 'My Fee & Clearance Vouchers', icon: CreditCard },
            { id: 'subjects', label: '7 Enrolled Subjects', icon: BookOpen },
            { id: 'admitCard', label: 'Exam Roll No Slip', icon: Award },
            { id: 'profile', label: 'My Profile & Security', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-student-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'border-red-800 text-red-900 bg-red-50/70 font-black'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-800' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Student Portal Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* HERO STUDENT PROFILE BANNER */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-6 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-red-800 to-rose-700 p-0.5 shadow-md flex-shrink-0">
                <div className="h-full w-full bg-white rounded-[14px] flex items-center justify-center text-2xl font-black text-red-800">
                  {student.name.charAt(0)}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {student.name}
                  </h1>
                  <span className="bg-red-50 border border-red-200 text-red-900 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {student.rollNo}
                  </span>
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active KMU Student
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                  {student.semester} • <span className="text-slate-900 font-semibold">{student.section}</span> • <span className="text-red-800 font-semibold">Khyber Medical University Swabi Campus (IHS)</span>
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 font-mono">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-red-800" />
                    {student.email}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    {student.phone}
                  </span>
                </div>

                <div className="mt-3 inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-lg">
                  <Lock className="w-3 h-3 text-red-800 shrink-0" />
                  <span>Official University Ledger (Read-Only Mode) — Academic and fee records can only be updated by KMU Faculty & Admin.</span>
                </div>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
              <button
                id="btn-student-export-master-pdf"
                onClick={handleExportMasterFile}
                className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Download Official KMU Formatted Master Dossier PDF"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Master PDF</span>
              </button>

              <button
                id="btn-student-export-attendance-pdf"
                onClick={handleExportAttendance}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Download Formatted Attendance Report PDF"
              >
                <Download className="w-3.5 h-3.5 text-red-800" />
                <span>Attendance PDF</span>
              </button>

              <button
                id="btn-student-print-id"
                onClick={() => {
                  setActiveTab('overview');
                  setTimeout(() => window.print(), 150);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Card</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & DIGITAL STUDENT ID CARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Key Performance Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                  <span>My Attendance Consistency</span>
                  <Percent className="w-4 h-4 text-red-800" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{attendanceRate}%</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    isAttendanceEligible ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' : 'text-rose-800 bg-rose-50 border border-rose-200'
                  }`}>
                    {isAttendanceEligible ? 'Eligible' : 'Low (<75%)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {presentLectures} of {totalLectures} lectures attended
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                  <span>Semester Fee Status</span>
                  <CreditCard className="w-4 h-4 text-red-800" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {(student.fee?.pendingFee || 0) === 0 ? 'Rs. 0' : `Rs. ${(student.fee?.pendingFee || 0).toLocaleString()}`}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {student.fee?.status || 'Paid'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Total Rs. {(student.fee?.totalFee || 102800).toLocaleString()} Cleared
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                  <span>Registered Subjects</span>
                  <BookOpen className="w-4 h-4 text-red-800" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">7 Courses</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  KMU BSN 2nd Semester Curriculum
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                  <span>KMU Final Exam Status</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black text-emerald-700">100% Cleared</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Roll No Slip Ready for Download
                </p>
              </div>
            </div>

            {/* RECENT ATTENDANCE STREAK WIDGET */}
            <AttendanceStreakWidget
              student={student}
              allSubjects={allSubjects}
              onOpenCalendar={() => setShowCalendarModal(true)}
            />

            {/* DIGITAL STUDENT SMART ID CARD (Printable) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-red-800" />
                    <span>Official KMU Swabi Digital Student Smart Card</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Institute of Health Sciences (IHS) • Khyber Medical University Swabi Campus
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportMasterFile}
                    className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF Dossier</span>
                  </button>
                  <button
                    id="btn-print-student-card"
                    onClick={() => window.print()}
                    className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Print Card</span>
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                {/* ID Card Front */}
                <div className="w-full max-w-md bg-gradient-to-br from-white via-slate-50 to-red-50/40 border-2 border-red-800 rounded-2xl p-5 shadow-lg relative overflow-hidden text-slate-900">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-red-200">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-full bg-white p-0.5 shadow-xs flex items-center justify-center shrink-0 border border-slate-200">
                        <KMUSwabiLogo className="w-9 h-9" variant="badge" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black tracking-wider text-red-900 uppercase">Khyber Medical University Swabi</h3>
                        <p className="text-[10px] text-slate-600 font-semibold">Institute of Health Sciences (IHS)</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-red-800 text-white px-2 py-0.5 rounded-full shadow-xs">
                      Batch 2025-29
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-22 w-22 rounded-xl bg-slate-100 border-2 border-red-800 p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
                      <div className="h-full w-full bg-white rounded-lg flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-red-800">{student.name.charAt(0)}</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5">IHS-SWB</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs flex-1">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block font-semibold leading-none">Candidate Name</span>
                        <strong className="text-slate-900 text-sm font-bold block">{student.name}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block font-semibold leading-none">Roll Number</span>
                          <span className="text-red-900 font-mono font-bold">{student.rollNo}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block font-semibold leading-none">Campus / Sec</span>
                          <span className="text-slate-900 font-bold">Swabi (Sec A)</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block font-semibold leading-none">Academic Program</span>
                        <span className="text-slate-600 font-medium text-[11px]">{student.semester} • BSN 4-Year</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>KMU Swabi Verified Student</span>
                    </div>
                    <div className="font-mono text-red-900 text-[9px] font-bold">
                      REG: KMU-SWB-2025
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Overview of Subjects & Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Attendance Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-800" />
                    <span>Subject-wise Attendance Rates</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="text-xs text-red-800 hover:text-red-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Log</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {subjectAttendance.map(sub => (
                    <div key={sub.code} className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-red-800">{sub.code}</span>
                          <span className="text-slate-800 font-medium truncate max-w-48">{sub.name}</span>
                        </div>
                        <span className={`font-mono font-bold ${sub.rate >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {sub.rate}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${sub.rate >= 75 ? 'bg-emerald-600' : 'bg-rose-600'}`}
                          style={{ width: `${sub.rate}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>{sub.present} Present / {sub.absent} Absent</span>
                        <span className={sub.rate >= 75 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                          {sub.rate >= 75 ? '✓ Exam Eligible (≥75%)' : '⚠ Warning Shortage'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee & Financial Summary */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-red-800" />
                      <span>Financial Clearance Voucher</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('fees')}
                      className="text-xs text-red-800 hover:text-red-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Receipts</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="mt-4 bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-lg font-black shadow-xs">
                      ✓
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Full Semester Fee Cleared</h4>
                    <p className="text-xs text-emerald-800 font-medium">
                      Zero Outstanding Balance (Rs. 0 Pending)
                    </p>
                    <div className="pt-2 border-t border-emerald-200 text-xs text-slate-700 flex justify-between font-mono">
                      <span>Total Paid:</span>
                      <strong className="text-slate-900">Rs. {(student.fee?.paidFee || 102800).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-600">Tuition & Clinical Lab:</span>
                      <span className="font-mono text-slate-900 font-semibold">Rs. 94,800</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-600">KMU Registration & Exam Fee:</span>
                      <span className="font-mono text-slate-900 font-semibold">Rs. 8,000</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Clearance Status:</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-xs">
                    Official No-Dues Issued
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY ATTENDANCE LOGS */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* RECENT ATTENDANCE STREAK WIDGET */}
            <AttendanceStreakWidget
              student={student}
              allSubjects={allSubjects}
              onOpenCalendar={() => setShowCalendarModal(true)}
            />

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-red-800" />
                    <span>My Complete Attendance History & Lecture Logs</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Active Filter: <strong className="text-slate-800">{activeMonthObj.label}</strong> • BSN 2nd Semester Section A
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    id="btn-portal-open-calendar-modal"
                    onClick={() => setShowCalendarModal(true)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Open Full Interactive Semester Calendar & Daily Attendance History"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Interactive Calendar</span>
                  </button>

                  <button
                    id="btn-export-attendance-report-pdf"
                    onClick={handleExportAttendance}
                    className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export Attendance PDF</span>
                  </button>

                  <select
                    id="select-student-academic-month"
                    value={selectedMonthFilter}
                    onChange={e => setSelectedMonthFilter(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-red-800 cursor-pointer shadow-xs"
                  >
                    {KMU_ACADEMIC_MONTHS.map(m => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <span className={`text-xs font-bold px-3 py-2 rounded-xl border ${
                    isAttendanceEligible
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {isAttendanceEligible ? '✓ Eligible for Final Exam (≥75%)' : '⚠ Deficient (< 75%)'}
                  </span>
                </div>
              </div>

              {/* Quick Month Filter Pills for Student */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-thin border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
                  Quick Month:
                </span>
                {KMU_ACADEMIC_MONTHS.map(m => {
                  const isSelected = selectedMonthFilter === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setSelectedMonthFilter(m.value)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-800 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {m.shortLabel}
                    </button>
                  );
                })}
              </div>

              {/* Attendance Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Overall Consistency</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">{attendanceRate}%</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Present Lectures</span>
                  <span className="text-2xl font-black text-emerald-700 font-mono">{presentLectures}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Absent (Unexcused)</span>
                  <span className="text-2xl font-black text-rose-700 font-mono">{absentLectures}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Excused Leaves</span>
                  <span className="text-2xl font-black text-amber-700 font-mono">{leaveLectures}</span>
                </div>
              </div>

              {/* Subject Wise Cards */}
              <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Subject-Wise Attendance Summary (7 Courses) • {activeMonthObj.shortLabel}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {subjectAttendance.map(sub => (
                    <div key={sub.code} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-bold text-red-800">{sub.code}</span>
                        <span className={`font-mono font-bold ${sub.rate >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {sub.rate}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-900 font-semibold truncate mb-2">{sub.name}</p>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${sub.rate >= 75 ? 'bg-emerald-600' : 'bg-rose-600'}`}
                          style={{ width: `${sub.rate}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                        <span>{sub.present} Present / {sub.total} Total</span>
                        <span className="font-mono text-slate-600">Cr: {sub.creditHours}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Date-wise Attendance Table */}
              <div className="mt-8">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Chronological Daily Lecture Log ({activeAttendanceRecords.length} Sessions)
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-700 font-mono text-[11px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Course Code</th>
                        <th className="py-2.5 px-4">Subject Title</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {activeAttendanceRecords.length > 0 ? (
                        [...activeAttendanceRecords]
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map((att, idx) => {
                            const matchedSub = allSubjects.find(s => s.code === att.subjectCode);
                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-4 font-mono text-slate-900 font-medium">{att.date}</td>
                                <td className="py-2.5 px-4 font-mono font-bold text-red-800">{att.subjectCode}</td>
                                <td className="py-2.5 px-4 text-slate-900 font-medium">{matchedSub?.name || 'KMU Subject'}</td>
                                <td className="py-2.5 px-4">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      att.status === 'Present'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : att.status === 'Absent'
                                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                    }`}
                                  >
                                    {att.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">
                            No attendance records found for {activeMonthObj.label}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MY FEES & CLEARANCE VOUCHERS */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-red-800" />
                    <span>My Fee Accounts & Official Clearance Vouchers</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fee ledger for BSN 2nd Semester (Section A) • Institute of Health Sciences
                  </p>
                </div>
                <button
                  id="btn-print-fee-slip"
                  onClick={() => window.print()}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 w-fit cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Fee Clearance Slip</span>
                </button>
              </div>

              {/* Financial Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 block">Total Semester Fee</span>
                  <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                    Rs. {(student.fee?.totalFee || 102800).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">BSN-II Standard Tariff</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 block">Amount Paid (Cleared)</span>
                  <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                    Rs. {(student.fee?.paidFee || 102800).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">✓ 100% Fully Settled</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <span className="text-xs text-slate-500 block">Remaining Due / Pending</span>
                  <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                    Rs. {(student.fee?.pendingFee || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">No Arrears Outstanding</span>
                </div>
              </div>

              {/* Official Paid Receipts Log */}
              <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Verified Payment Receipts
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-700 font-mono text-[11px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Receipt No</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4">Date of Payment</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {student.fee?.payments && student.fee.payments.length > 0 ? (
                        student.fee.payments.map((p, pIdx) => (
                          <tr key={pIdx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-red-800">{p.receiptNo || `KMU-RCP-0${pIdx + 1}`}</td>
                            <td className="py-3 px-4 text-slate-900 font-medium">BSN 2nd Semester Full Clearance</td>
                            <td className="py-3 px-4 font-mono text-slate-500">
                              {p.date ? new Date(p.date).toLocaleDateString('en-PK', { dateStyle: 'medium' }) : 'Verified Session'}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              Rs. {Number(p.amount).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Verified
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 px-4 text-center text-slate-400">
                            No payment history recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official KMU Fee Breakdown Notice */}
              <div className="mt-6 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-red-800" />
                  <span>Khyber Medical University Approved BSN-II Fee Structure</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 pt-1">
                  <div>• Tuition Fee: <strong className="text-slate-900 font-mono">Rs. 60,000</strong></div>
                  <div>• Clinical & Lab Training: <strong className="text-slate-900 font-mono">Rs. 22,800</strong></div>
                  <div>• KMU Registration & Exams: <strong className="text-slate-900 font-mono">Rs. 20,000</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 7 ENROLLED SUBJECTS */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-red-800" />
                  <span>My Enrolled Subjects • KMU BSN 2nd Semester Curriculum</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official 7 prescribed courses for Section A at Institute of Health Sciences
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allSubjects.map((sub) => (
                  <div key={sub.code} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between hover:border-red-800/40 transition-colors">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-mono font-bold text-red-900 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          {sub.code}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          Credit Hours: <strong className="text-slate-900">{sub.creditHours}</strong>
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">{sub.name}</h3>
                      <p className="text-xs text-slate-500">
                        {sub.code.startsWith('NUR')
                          ? 'Core Clinical Nursing Subject'
                          : sub.code.startsWith('QR')
                          ? 'Allied Quantitative & Biostatistics'
                          : sub.code.startsWith('NUT')
                          ? 'Clinical Dietetics & Applied Nutrition'
                          : 'General University Foundation'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enrolled
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono">Sec A • Regular</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXAM ROLL NO SLIP & ADMIT CARD */}
        {activeTab === 'admitCard' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-red-800" />
                    <span>KMU Swabi Examination Roll Number Slip (Admit Card)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Official Examination Clearance issued by Office of the Controller of Examinations, KMU Swabi
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportMasterFile}
                    className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-red-800" />
                    <span>Master PDF</span>
                  </button>
                  <button
                    id="btn-print-admit-card"
                    onClick={() => window.print()}
                    className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Exam Slip</span>
                  </button>
                </div>
              </div>

              {/* Printable Roll No Slip Box */}
              <div className="mt-6 bg-white border-2 border-red-800 rounded-2xl p-6 shadow-md text-slate-900 max-w-3xl mx-auto">
                {/* Header with Official KMU Logo */}
                <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b-2 border-red-800/40 gap-4">
                  <div className="h-16 w-16 rounded-full bg-white p-1 shadow-sm flex items-center justify-center shrink-0 border border-slate-200">
                    <KMUSwabiLogo className="w-14 h-14" variant="badge" />
                  </div>
                  <div className="text-center sm:text-left flex-1 space-y-0.5">
                    <div className="inline-flex items-center gap-2 mb-0.5">
                      <span className="bg-red-800 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                        KMU SWABI CAMPUS
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-wide uppercase">Khyber Medical University Swabi</h3>
                    <p className="text-xs text-red-800 font-semibold">INSTITUTE OF HEALTH SCIENCES (IHS) • SWABI</p>
                    <p className="text-xs text-slate-600 font-medium">BSN 2nd Semester Examination Roll Number Slip • Section A</p>
                  </div>
                  <div className="hidden sm:block text-right text-[10px] font-mono text-slate-500">
                    <span>DOC: KMU/EXAM/SWB/2025</span>
                    <br />
                    <span className="text-white font-bold bg-emerald-700 px-2 py-0.5 rounded mt-1 inline-block">STATUS: ADMITTED</span>
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-slate-200 text-xs">
                  <div className="space-y-2 sm:col-span-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Candidate Name:</span>
                        <strong className="text-slate-900 text-sm font-bold">{student.name}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Roll Number:</span>
                        <strong className="text-red-900 font-mono text-sm font-bold">{student.rollNo}</strong>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Campus / Program:</span>
                        <span className="text-slate-700 font-medium">KMU Swabi • BSN (4-Year)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Semester / Section:</span>
                        <span className="text-slate-700">{student.semester} ({student.section})</span>
                      </div>
                    </div>
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-500 uppercase block">Examination Centre:</span>
                      <span className="text-slate-900 font-medium">Hall-1, Main Academic Block, KMU Swabi Campus</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <div className="h-16 w-16 rounded-lg bg-white text-red-800 border border-red-200 flex flex-col items-center justify-center font-black text-xl mb-1 shadow-xs">
                      <span>{student.name.charAt(0)}</span>
                      <span className="text-[8px] font-mono text-slate-500 -mt-1">IHS-SWB</span>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">✓ Clearance Verified</span>
                    <span className="text-[9px] text-slate-500 font-mono mt-1">Fees & 75% Attendance Cleared</span>
                  </div>
                </div>

                {/* Exam Schedule for 7 Subjects */}
                <div className="mt-5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Prescribed Course Papers
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-3">Code</th>
                          <th className="py-2 px-3">Subject Name</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3 text-right">Clearance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white text-[11px]">
                        {allSubjects.map((sub, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-mono font-bold text-red-800">{sub.code}</td>
                            <td className="py-2 px-3 text-slate-900">{sub.name}</td>
                            <td className="py-2 px-3 text-slate-500">{sub.creditHours} Cr</td>
                            <td className="py-2 px-3 text-right text-emerald-700 font-bold">✓ Admitted</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatures & Seal */}
                <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
                  <div>
                    <div className="h-6 border-b border-dashed border-slate-400 w-36 mb-1"></div>
                    <span>Candidate Signature</span>
                  </div>
                  <div className="text-center">
                    <span className="bg-red-800 text-white px-2 py-0.5 rounded font-mono text-[9px] block mb-1 font-bold">
                      KMU-SWABI-EXAM-VERIFIED
                    </span>
                    <span>Electronic Verification Stamp</span>
                  </div>
                  <div className="text-right">
                    <div className="h-6 border-b border-dashed border-slate-400 w-36 mb-1"></div>
                    <span>Controller of Examinations, KMU</span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Instructions to Candidate:</p>
                  <p>1. Please bring your original KMU Swabi Student Identity Card and this Roll Number Slip to the examination hall.</p>
                  <p>2. Electronic gadgets, mobile phones, and unauthorized materials are strictly prohibited.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MY PROFILE & SECURITY SETTINGS */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Details & Contact Update */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-red-800" />
                    <span>My Registered Contact Information</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your official WhatsApp phone number for exam and attendance alerts
                  </p>
                </div>

                <form onSubmit={handleUpdatePhone} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Full Student Name (Official KMU Record):</label>
                    <input
                      type="text"
                      disabled
                      value={student.name}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 cursor-not-allowed font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">KMU Roll Number:</label>
                      <input
                        type="text"
                        disabled
                        value={student.rollNo}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-red-800 font-mono font-bold cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Semester & Section:</label>
                      <input
                        type="text"
                        disabled
                        value={`${student.semester} - ${student.section}`}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Official Student Email Address:</label>
                    <input
                      type="email"
                      disabled
                      value={student.email}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Registered WhatsApp Phone Number:</label>
                    <input
                      id="input-student-phone"
                      type="text"
                      disabled
                      value={phoneInput}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono font-bold cursor-not-allowed"
                      placeholder="+92 3XX XXXXXXX"
                    />
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      This record is view-only. Contact your Admin/Faculty office to update it.
                    </p>
                  </div>

                  <button
                    id="btn-save-student-phone"
                    type="button"
                    disabled
                    title="View-only: contact Admin/Faculty to make changes"
                    className="bg-slate-300 text-slate-500 text-xs font-bold px-4 py-2 rounded-xl cursor-not-allowed"
                  >
                    Save Contact Info
                  </button>
                </form>
              </div>

              {/* Password Change Box - View Only (students cannot change, admin/faculty controls this) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Key className="w-5 h-5 text-red-800" />
                    <span>Portal Password</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This section is view-only. Contact your Admin/Faculty office to reset your password.
                  </p>
                </div>

                <form className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Current Password:</label>
                    <input
                      id="input-current-password"
                      type="password"
                      disabled
                      value={currentPassword}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed font-mono"
                      placeholder="View-only"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">New Password:</label>
                    <input
                      id="input-new-password"
                      type="password"
                      disabled
                      value={newPassword}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed font-mono"
                      placeholder="View-only"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Confirm New Password:</label>
                    <input
                      id="input-confirm-password"
                      type="password"
                      disabled
                      value={confirmPassword}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed font-mono"
                      placeholder="View-only"
                    />
                  </div>

                  <button
                    id="btn-save-password"
                    type="button"
                    disabled
                    title="View-only: contact Admin/Faculty to reset your password"
                    className="bg-slate-300 text-slate-500 text-xs font-bold px-4 py-2 rounded-xl cursor-not-allowed"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* INTERACTIVE ATTENDANCE CALENDAR MODAL */}
      {showCalendarModal && (
        <StudentAttendanceCalendarModal
          student={student}
          allSubjects={allSubjects}
          initialMonth={selectedMonthFilter !== 'all' ? selectedMonthFilter : '2026-09'}
          onClose={() => setShowCalendarModal(false)}
          showAlert={showAlert}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Download,
  FileJson,
  TrendingUp,
  BarChart3,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  GraduationCap,
  School,
  LogIn,
  LogOut,
  Key,
  UserCheck,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  User,
  ArrowRight,
  ExternalLink,
  FileText,
  Printer,
  Search,
  BookOpen,
  CreditCard,
  Percent,
  RefreshCw,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { StudentPortal } from './components/StudentPortal';
import { LoginScreen } from './components/LoginScreen';
import { KMUSwabiLogo } from './components/KMUSwabiLogo';
import { StudentAttendanceCalendarModal } from './components/StudentAttendanceCalendarModal';
import { AttendanceHeatmap } from './components/AttendanceHeatmap';
import { Student, Subject, UserSession } from './types';
import { INITIAL_STUDENTS_MOCK, INITIAL_SUBJECTS_MOCK, KMU_ACADEMIC_MONTHS } from './data/initialData';
import { exportMasterFilePDF, exportAttendanceReportPDF, exportClassRosterPDF, exportDailyAttendancePDF } from './utils/pdfExport';

// MongoDB Backup Server URL (runs locally via `npm run server`)
// If the server isn't running, this silently fails and the local/JSON backups still work.
const BACKUP_SERVER_URL = 'http://localhost:5000/api/backup';

// LocalStorage Keys
const STORAGE_KEY_STUDENTS = 'kmu_swabi_bsn2_students_v5';
const STORAGE_KEY_SUBJECTS = 'kmu_swabi_bsn2_subjects_v5';
const STORAGE_KEY_SESSION = 'kmu_swabi_active_session_v5';
const STORAGE_KEY_ATTENDANCE_DRAFT = 'kmu_attendance_draft_auto_save_v5';
const STORAGE_KEY_AUTO_BACKUP = 'kmu_swabi_bsn2_autobackup_v5';
const STORAGE_KEY_LAST_AUTO_DOWNLOAD = 'kmu_swabi_bsn2_last_auto_download_v5';

export default function App() {
  // Navigation & Sessions - defaults to null so Home page is strictly the Login & Sign Up Gateway
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'fees' | 'subjects' | 'reports'>('dashboard');
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Core Data Collections
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS_MOCK;
    } catch {
      return INITIAL_STUDENTS_MOCK;
    }
  });

  const [subjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBJECTS);
      return saved ? JSON.parse(saved) : INITIAL_SUBJECTS_MOCK;
    } catch {
      return INITIAL_SUBJECTS_MOCK;
    }
  });

  // Master File Modal state
  const [viewStudentId, setViewStudentId] = useState<string | null>(null);
  const [masterStudent, setMasterStudent] = useState<any | null>(null);

  // Student Attendance Calendar Modal state
  const [calendarStudent, setCalendarStudent] = useState<Student | null>(null);

  // Fee Collection Modal state
  const [feeModalStudent, setFeeModalStudent] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>(102800);
  const [paymentReceipt, setPaymentReceipt] = useState<{ receiptNo: string; amount: number; date: string } | null>(null);

  // Attendance Marking Form state
  const [selectedSubject, setSelectedSubject] = useState<string>('NUR-201');
  const [attendanceDate, setAttendanceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [attendanceSheet, setAttendanceSheet] = useState<Record<string, 'Present' | 'Absent' | 'Leave'>>({});
  const [isDraftLoaded, setIsDraftLoaded] = useState<boolean>(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterFeeStatus, setFilterFeeStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // UI Toast Alerts
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showAlert = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertMessage({ text, type });
    setTimeout(() => {
      setAlertMessage(null);
    }, 4500);
  };

  // Sync Students data to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to sync students to localStorage', e);
    }
  }, [students]);

  // Automatic Full Backup (no button click needed) - runs silently in the background
  // 1) Keeps a complete backup snapshot in localStorage on every data change
  // 2) Auto-downloads a JSON backup file once per calendar day, so a real file
  //    is saved without the user having to click the "JSON Backup" button.
  // 3) Sends a debounced copy to your MongoDB database via the local backup server
  //    (npm run server) — if that server isn't running, this just fails silently
  //    and your local/JSON backups keep working as normal.
  const mongoBackupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const autoBackupData = {
        kmuPortal: 'Khyber Medical University Swabi - BSN 2nd Semester Management System',
        campus: 'KMU Swabi Campus (Institute of Nursing Sciences)',
        semester: 'BSN 2nd Semester',
        section: 'Section A',
        exportedAt: new Date().toISOString(),
        autoBackup: true,
        subjects,
        students
      };

      // 1) Always keep a fresh full snapshot in localStorage instantly
      localStorage.setItem(STORAGE_KEY_AUTO_BACKUP, JSON.stringify(autoBackupData));

      // 2) Auto-download an actual backup file, throttled to once per day
      const today = new Date().toISOString().split('T')[0];
      const lastAutoDownload = localStorage.getItem(STORAGE_KEY_LAST_AUTO_DOWNLOAD);
      if (lastAutoDownload !== today) {
        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(autoBackupData, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `KMU_Swabi_BSN2_AutoBackup_${today}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        localStorage.setItem(STORAGE_KEY_LAST_AUTO_DOWNLOAD, today);
      }

      // 3) Debounced MongoDB backup — waits 3s after the last change before sending,
      //    so rapid edits (typing, quick clicks) don't spam the database.
      if (mongoBackupTimeoutRef.current) {
        clearTimeout(mongoBackupTimeoutRef.current);
      }
      mongoBackupTimeoutRef.current = setTimeout(() => {
        fetch(BACKUP_SERVER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(autoBackupData)
        }).catch(() => {
          // Backup server not running or unreachable — local/JSON backups still safe.
        });
      }, 3000);
    } catch (e) {
      console.error('Automatic backup failed', e);
    }
  }, [students, subjects]);

  // Sync Session to LocalStorage
  useEffect(() => {
    try {
      if (userSession) {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(userSession));
      } else {
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }
    } catch (e) {
      console.error('Failed to sync session to localStorage', e);
    }
  }, [userSession]);

  // Load / initialize attendance sheet for current date & subject, check for drafts
  useEffect(() => {
    const draftKey = `${STORAGE_KEY_ATTENDANCE_DRAFT}_${selectedSubject}_${attendanceDate}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setAttendanceSheet(parsed.sheet || {});
        setIsDraftLoaded(true);
        setDraftSavedAt(parsed.savedAt || 'Recently');
        return;
      } catch (err) {
        console.error('Failed to parse attendance draft:', err);
      }
    }

    // Default initialization from student records or fallback to Present
    const initial: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
    students.forEach(std => {
      const existing = std.attendance?.find(a => a.date === attendanceDate && a.subjectCode === selectedSubject);
      initial[std._id] = existing ? existing.status : 'Present';
    });
    setAttendanceSheet(initial);
    setIsDraftLoaded(false);
    setDraftSavedAt(null);
  }, [selectedSubject, attendanceDate, students]);

  // Update status for single student and auto-save draft
  const handleStudentStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Leave') => {
    const updated = {
      ...attendanceSheet,
      [studentId]: status
    };
    setAttendanceSheet(updated);

    // Auto-save draft
    try {
      const draftKey = `${STORAGE_KEY_ATTENDANCE_DRAFT}_${selectedSubject}_${attendanceDate}`;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          subjectCode: selectedSubject,
          date: attendanceDate,
          sheet: updated,
          savedAt: nowStr
        })
      );
      setIsDraftLoaded(true);
      setDraftSavedAt(nowStr);
    } catch (e) {
      console.error('Draft auto-save failed', e);
    }
  };

  // Mark all students with a single status
  const markAllAttendance = (status: 'Present' | 'Absent' | 'Leave') => {
    const updated: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
    students.forEach(s => {
      updated[s._id] = status;
    });
    setAttendanceSheet(updated);

    try {
      const draftKey = `${STORAGE_KEY_ATTENDANCE_DRAFT}_${selectedSubject}_${attendanceDate}`;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          subjectCode: selectedSubject,
          date: attendanceDate,
          sheet: updated,
          savedAt: nowStr
        })
      );
      setIsDraftLoaded(true);
      setDraftSavedAt(nowStr);
      showAlert(`All students marked as ${status} (draft auto-saved)`, 'info');
    } catch (e) {
      console.error('Draft auto-save failed', e);
    }
  };

  // Discard current draft
  const handleDiscardDraft = () => {
    const draftKey = `${STORAGE_KEY_ATTENDANCE_DRAFT}_${selectedSubject}_${attendanceDate}`;
    localStorage.removeItem(draftKey);

    const initial: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
    students.forEach(std => {
      const existing = std.attendance?.find(a => a.date === attendanceDate && a.subjectCode === selectedSubject);
      initial[std._id] = existing ? existing.status : 'Present';
    });
    setAttendanceSheet(initial);
    setIsDraftLoaded(false);
    setDraftSavedAt(null);
    showAlert('Unsaved draft discarded. Reverted to recorded database values.', 'info');
  };

  // Export Daily Attendance Sheet PDF for current date & subject
  const handleExportDailyAttendanceSheet = () => {
    try {
      const subObj = subjects.find(s => s.code === selectedSubject) || {
        code: selectedSubject,
        name: selectedSubject,
        creditHours: '3+0'
      };
      exportDailyAttendancePDF(attendanceDate, subObj, students, attendanceSheet);
      showAlert(`Daily Attendance Sheet PDF for ${subObj.code} (${attendanceDate}) downloaded!`, 'success');
    } catch (err) {
      console.error(err);
      showAlert('Failed to generate Daily Attendance PDF', 'error');
    }
  };

  // Save and lock attendance permanently with automatic PDF generation
  const handleSaveAttendance = (autoDownloadPDF: boolean = true) => {
    const updated = students.map(std => {
      const currentAttendance = [...(std.attendance || [])];
      const newStatus = attendanceSheet[std._id] || 'Present';
      const existingIdx = currentAttendance.findIndex(
        a => a.date === attendanceDate && a.subjectCode === selectedSubject
      );

      if (existingIdx >= 0) {
        currentAttendance[existingIdx] = {
          ...currentAttendance[existingIdx],
          status: newStatus
        };
      } else {
        currentAttendance.push({
          date: attendanceDate,
          subjectCode: selectedSubject,
          status: newStatus
        });
      }

      return {
        ...std,
        attendance: currentAttendance
      };
    });

    setStudents(updated);

    // Clear saved draft
    const draftKey = `${STORAGE_KEY_ATTENDANCE_DRAFT}_${selectedSubject}_${attendanceDate}`;
    localStorage.removeItem(draftKey);
    setIsDraftLoaded(false);
    setDraftSavedAt(null);

    const subObj = subjects.find(s => s.code === selectedSubject) || {
      code: selectedSubject,
      name: selectedSubject,
      creditHours: '3+0'
    };
    const subName = subObj.name;

    if (autoDownloadPDF) {
      try {
        exportDailyAttendancePDF(attendanceDate, subObj, updated, attendanceSheet);
      } catch (e) {
        console.error('Auto PDF export error:', e);
      }
      showAlert(`Attendance for ${subName} on ${attendanceDate} locked & official Daily Attendance PDF generated & downloaded!`, 'success');
    } else {
      showAlert(`Attendance for ${subName} on ${attendanceDate} locked & saved permanently!`, 'success');
    }
  };

  // Fee Calculation Summary
  const feeReport = useMemo(() => {
    let totalPending = 0;
    let totalCollected = 0;
    let unpaidCount = 0;
    let paidCount = 0;
    let partialCount = 0;

    students.forEach(s => {
      const pending = s.fee?.pendingFee ?? 0;
      const paid = s.fee?.paidFee ?? 0;
      totalPending += pending;
      totalCollected += paid;

      if (pending === 0 || s.fee?.status === 'Paid') {
        paidCount++;
      } else if (s.fee?.status === 'Partial') {
        partialCount++;
      } else {
        unpaidCount++;
      }
    });

    return {
      totalPending,
      totalCollected,
      unpaidCount,
      paidCount,
      partialCount,
      totalExpected: totalPending + totalCollected
    };
  }, [students]);

  // Process Fee Payment
  const handleProcessPayment = () => {
    if (!feeModalStudent || paymentAmount === '' || paymentAmount <= 0) {
      showAlert('Please enter a valid payment amount', 'error');
      return;
    }

    const payNum = Number(paymentAmount);
    const receiptNo = `KMU-SWB-RCP-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const updated = students.map(std => {
      if (std._id === feeModalStudent._id) {
        const currentPaid = std.fee?.paidFee || 0;
        const total = std.fee?.totalFee || 102800;
        const newPaid = Math.min(total, currentPaid + payNum);
        const newPending = Math.max(0, total - newPaid);
        const newStatus = newPending === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';

        const payments = [
          ...(std.fee?.payments || []),
          { receiptNo, amount: payNum, date: nowIso }
        ];

        return {
          ...std,
          fee: {
            totalFee: total,
            paidFee: newPaid,
            pendingFee: newPending,
            status: newStatus as any,
            payments
          }
        };
      }
      return std;
    });

    setStudents(updated);
    setPaymentReceipt({ receiptNo, amount: payNum, date: nowIso });
    showAlert(`Payment of Rs. ${payNum.toLocaleString()} recorded. Receipt #${receiptNo} issued!`, 'success');
  };

  // Clear all pending fees
  const handleClearAllPendingFees = () => {
    const updated = students.map(std => {
      const total = std.fee?.totalFee || 102800;
      return {
        ...std,
        fee: {
          totalFee: total,
          paidFee: total,
          pendingFee: 0,
          status: 'Paid' as const,
          payments: std.fee?.payments?.length
            ? std.fee.payments
            : [{ receiptNo: `KMU-CLEAR-${std.rollNo}`, amount: total, date: new Date().toISOString() }]
        }
      };
    });
    setStudents(updated);
    showAlert(`All ${students.length} students fees cleared in full (0 pending balance)!`, 'success');
  };

  // Waive all fees
  const handleWaiveAllFees = () => {
    const updated = students.map(std => ({
      ...std,
      fee: {
        totalFee: 0,
        paidFee: 0,
        pendingFee: 0,
        status: 'Paid' as const,
        payments: []
      }
    }));
    setStudents(updated);
    showAlert(`All ${students.length} student fees waived to Rs. 0`, 'info');
  };

  // Reset to initial unpaid
  const handleResetAllToUnpaid = () => {
    const updated = students.map(std => ({
      ...std,
      fee: {
        totalFee: 102800,
        paidFee: 0,
        pendingFee: 102800,
        status: 'Unpaid' as const,
        payments: []
      }
    }));
    setStudents(updated);
    showAlert(`All ${students.length} student fee records reset to unpaid (Rs. 102,800 pending)`, 'info');
  };

  // Reset all data to initial defaults
  const handleResetToDefaults = () => {
    if (window.confirm(`Reset all ${students.length} student records, attendance, and fee history back to original defaults?`)) {
      localStorage.removeItem(STORAGE_KEY_STUDENTS);
      localStorage.removeItem(STORAGE_KEY_ATTENDANCE_DRAFT);
      setStudents(INITIAL_STUDENTS_MOCK);
      showAlert('All student records reset to official KMU Swabi defaults', 'success');
    }
  };

  // Generate realistic semester-long attendance across all 7 subjects
  const handlePopulateSampleAttendance = () => {
    // Academic calendar dates spread across the semester (Jan to Sep 2026)
    const semesterSchedule = [
      // Jan 2026
      { date: '2026-01-12', subject: 'NUR-201' },
      { date: '2026-01-14', subject: 'NUR-202' },
      { date: '2026-01-16', subject: 'NUR-203' },
      { date: '2026-01-19', subject: 'QR-204' },
      { date: '2026-01-21', subject: 'IS-205' },
      { date: '2026-01-23', subject: 'FQ-206' },
      { date: '2026-01-26', subject: 'NUT-207' },
      { date: '2026-01-28', subject: 'NUR-201' },
      // Feb 2026
      { date: '2026-02-02', subject: 'NUR-202' },
      { date: '2026-02-04', subject: 'NUR-203' },
      { date: '2026-02-06', subject: 'QR-204' },
      { date: '2026-02-09', subject: 'IS-205' },
      { date: '2026-02-11', subject: 'FQ-206' },
      { date: '2026-02-13', subject: 'NUT-207' },
      { date: '2026-02-16', subject: 'NUR-201' },
      { date: '2026-02-18', subject: 'NUR-202' },
      { date: '2026-02-20', subject: 'NUR-203' },
      { date: '2026-02-23', subject: 'QR-204' },
      // Mar 2026
      { date: '2026-03-02', subject: 'NUR-201' },
      { date: '2026-03-04', subject: 'NUR-202' },
      { date: '2026-03-06', subject: 'NUR-203' },
      { date: '2026-03-09', subject: 'QR-204' },
      { date: '2026-03-11', subject: 'IS-205' },
      { date: '2026-03-13', subject: 'FQ-206' },
      { date: '2026-03-16', subject: 'NUT-207' },
      { date: '2026-03-18', subject: 'NUR-201' },
      { date: '2026-03-25', subject: 'NUR-202' },
      // Apr 2026
      { date: '2026-04-01', subject: 'NUR-203' },
      { date: '2026-04-03', subject: 'QR-204' },
      { date: '2026-04-06', subject: 'IS-205' },
      { date: '2026-04-08', subject: 'FQ-206' },
      { date: '2026-04-10', subject: 'NUT-207' },
      { date: '2026-04-13', subject: 'NUR-201' },
      { date: '2026-04-15', subject: 'NUR-202' },
      // May 2026
      { date: '2026-05-04', subject: 'NUR-203' },
      { date: '2026-05-06', subject: 'QR-204' },
      { date: '2026-05-08', subject: 'IS-205' },
      { date: '2026-05-11', subject: 'FQ-206' },
      { date: '2026-05-13', subject: 'NUT-207' },
      { date: '2026-05-18', subject: 'NUR-201' },
      { date: '2026-05-20', subject: 'NUR-202' },
      // Jun 2026
      { date: '2026-06-01', subject: 'NUR-203' },
      { date: '2026-06-03', subject: 'QR-204' },
      { date: '2026-06-08', subject: 'IS-205' },
      { date: '2026-06-10', subject: 'FQ-206' },
      { date: '2026-06-15', subject: 'NUT-207' },
      { date: '2026-06-17', subject: 'NUR-201' },
      // Jul 2026
      { date: '2026-07-06', subject: 'NUR-202' },
      { date: '2026-07-08', subject: 'NUR-203' },
      { date: '2026-07-13', subject: 'QR-204' },
      { date: '2026-07-15', subject: 'IS-205' },
      { date: '2026-07-20', subject: 'FQ-206' },
      { date: '2026-07-22', subject: 'NUT-207' },
      // Aug 2026
      { date: '2026-08-03', subject: 'NUR-201' },
      { date: '2026-08-05', subject: 'NUR-202' },
      { date: '2026-08-10', subject: 'NUR-203' },
      { date: '2026-08-12', subject: 'QR-204' },
      { date: '2026-08-17', subject: 'IS-205' },
      { date: '2026-08-19', subject: 'FQ-206' },
      { date: '2026-08-24', subject: 'NUT-207' },
      // Sep 2026
      { date: '2026-09-01', subject: 'NUR-201' },
      { date: '2026-09-02', subject: 'NUR-202' }
    ];

    const updated = students.map((std, sIdx) => {
      const studentAttendance: AttendanceRecord[] = semesterSchedule.map((item, idx) => {
        const seed = (sIdx * 17 + idx * 31 + item.subject.charCodeAt(0)) % 100;
        let status: 'Present' | 'Absent' | 'Leave' = 'Present';

        if (seed < 82) {
          status = 'Present';
        } else if (seed < 93) {
          status = 'Absent';
        } else {
          status = 'Leave';
        }

        return {
          date: item.date,
          subjectCode: item.subject,
          status
        };
      });

      return {
        ...std,
        attendance: studentAttendance
      };
    });

    setStudents(updated);
    showAlert('Populated realistic semester-long attendance across all 7 subjects! Heatmap and streaks updated.', 'success');
  };

  // PDF Export Handlers
  const handleExportMasterFile = (student: Student) => {
    try {
      exportMasterFilePDF(student, subjects);
      showAlert(`Official Master File PDF for ${student.name} downloaded!`, 'success');
    } catch (err) {
      console.error(err);
      showAlert('Failed to generate Master File PDF', 'error');
    }
  };

  const handleExportAttendanceReport = (student: Student) => {
    try {
      exportAttendanceReportPDF(student, subjects, undefined, selectedMonth);
      showAlert(`Attendance Report PDF for ${student.name} downloaded!`, 'success');
    } catch (err) {
      console.error(err);
      showAlert('Failed to generate Attendance PDF', 'error');
    }
  };

  const handleExportClassAuditRoster = () => {
    try {
      exportClassRosterPDF(students, subjects, selectedMonth);
      showAlert('Official Class Master Audit Roster PDF downloaded!', 'success');
    } catch (err) {
      console.error(err);
      showAlert('Failed to generate Class Master Audit PDF', 'error');
    }
  };

  // Download JSON Backup
  const handleDownloadBackupJSON = () => {
    try {
      const backupData = {
        kmuPortal: 'Khyber Medical University Swabi - BSN 2nd Semester Management System',
        campus: 'KMU Swabi Campus (Institute of Nursing Sciences)',
        semester: 'BSN 2nd Semester',
        section: 'Section A',
        exportedAt: new Date().toISOString(),
        subjects,
        students
      };
      const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `KMU_Swabi_BSN2_Master_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      //downloadAnchor.click();
      //downloadAnchor.remove();
      showAlert('Local JSON backup downloaded successfully!', 'success');
    } catch {
      showAlert('Failed to generate JSON backup file', 'error');
    }
  };

  // Open Master File Modal
  const openMasterFile = (studentId: string) => {
    setViewStudentId(studentId);
    const std = students.find(s => s._id === studentId);
    if (std) {
      const total = std.attendance?.length || 0;
      const present = std.attendance?.filter(a => a.status === 'Present').length || 0;
      const absent = std.attendance?.filter(a => a.status === 'Absent').length || 0;
      const leave = std.attendance?.filter(a => a.status === 'Leave').length || 0;

      const subjectWise: Record<string, { total: number; present: number; absent: number; leave: number }> = {};
      subjects.forEach(sub => {
        subjectWise[sub.code] = { total: 0, present: 0, absent: 0, leave: 0 };
      });

      std.attendance?.forEach(item => {
        if (!subjectWise[item.subjectCode]) {
          subjectWise[item.subjectCode] = { total: 0, present: 0, absent: 0, leave: 0 };
        }
        subjectWise[item.subjectCode].total += 1;
        if (item.status === 'Present') subjectWise[item.subjectCode].present += 1;
        if (item.status === 'Absent') subjectWise[item.subjectCode].absent += 1;
        if (item.status === 'Leave') subjectWise[item.subjectCode].leave += 1;
      });

      setMasterStudent({
        ...std,
        summary: {
          totalAttendance: total,
          presentCount: present,
          absentCount: absent,
          leaveCount: leave,
          percentage: total > 0 ? ((present / total) * 100).toFixed(1) : '0.0',
          subjectWise
        }
      });
    }
  };

  // Monthly Attendance Analytics calculation
  const monthlyStats = useMemo(() => {
    let totalRecords = 0;
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;

    const subjectStats: Record<string, { present: number; absent: number; leave: number }> = {};
    subjects.forEach(s => {
      subjectStats[s.code] = { present: 0, absent: 0, leave: 0 };
    });

    students.forEach(s => {
      s.attendance?.forEach(a => {
        const isMatch = selectedMonth === 'all' || a.date.startsWith(selectedMonth);
        if (isMatch) {
          totalRecords++;
          if (a.status === 'Present') {
            presentCount++;
            if (subjectStats[a.subjectCode]) subjectStats[a.subjectCode].present++;
          } else if (a.status === 'Absent') {
            absentCount++;
            if (subjectStats[a.subjectCode]) subjectStats[a.subjectCode].absent++;
          } else if (a.status === 'Leave') {
            leaveCount++;
            if (subjectStats[a.subjectCode]) subjectStats[a.subjectCode].leave++;
          }
        }
      });
    });

    const chartData = subjects.map(s => {
      const st = subjectStats[s.code] || { present: 0, absent: 0, leave: 0 };
      return {
        subject: s.code,
        name: s.name,
        present: st.present,
        absent: st.absent,
        leave: st.leave
      };
    });

    const overallRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 100;
    const activeMonthObj = KMU_ACADEMIC_MONTHS.find(m => m.value === selectedMonth) || KMU_ACADEMIC_MONTHS[0];

    return {
      totalRecords,
      presentCount,
      absentCount,
      leaveCount,
      overallRate,
      chartData,
      monthLabel: activeMonthObj.label,
      shortLabel: activeMonthObj.shortLabel,
      quarter: activeMonthObj.quarter
    };
  }, [students, subjects, selectedMonth]);

  // Filter students based on search and fee status
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q));
      const matchesFee =
        filterFeeStatus === 'all' ||
        s.fee?.status?.toLowerCase() === filterFeeStatus.toLowerCase();
      return matchesSearch && matchesFee;
    });
  }, [students, searchTerm, filterFeeStatus]);

  // Active student logged in
  const currentLoggedInStudent = useMemo(() => {
    if (userSession?.role === 'student' && userSession.studentId) {
      return students.find(s => s._id === userSession.studentId) || students[0];
    }
    return null;
  }, [userSession, students]);

  const handleLoginAsStudent = (std: Student) => {
    setUserSession({
      role: 'student',
      studentId: std._id,
      studentName: std.name
    });
    setShowLoginModal(false);
    showAlert(`Welcome to your KMU Student Portal, ${std.name}!`, 'success');
  };

  const handleLoginAsAdmin = () => {
    setUserSession({ role: 'admin' });
    setShowLoginModal(false);
    showAlert('Switched to KMU Faculty & Administration Portal', 'info');
  };

  const handleLogout = () => {
    setUserSession(null);
    setShowLoginModal(true);
    showAlert('Logged out successfully', 'info');
  };

  const handleUpdateStudentFromPortal = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => (s._id === updatedStudent._id ? updatedStudent : s)));
  };

  const handleRegisterStudent = (newStudent: Student) => {
    setStudents(prev => [...prev, newStudent]);
    // Directly log the newly registered student in and open their portal —
    // no need to manually switch tabs and log in again after signing up.
    handleLoginAsStudent(newStudent);
  };

  // If user opened login screen OR has no active session (Home Page)
  if (showLoginModal || !userSession) {
    return (
      <LoginScreen
        students={students}
        onLoginStudent={handleLoginAsStudent}
        onLoginAdmin={handleLoginAsAdmin}
        onRegisterStudent={handleRegisterStudent}
        onCancel={userSession ? () => setShowLoginModal(false) : undefined}
        showAlert={showAlert}
      />
    );
  }

  // If active session is Student Portal
  if (userSession.role === 'student' && currentLoggedInStudent) {
    return (
      <StudentPortal
        student={currentLoggedInStudent}
        allSubjects={subjects}
        onLogout={handleLogout}
        onUpdateStudent={handleUpdateStudentFromPortal}
        onSwitchToAdmin={handleLoginAsAdmin}
        showAlert={showAlert}
      />
    );
  }

  // Admin / Faculty View (Light Theme)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-red-800 selection:text-white pb-16">
      {/* Top Banner / University Header */}
      <header className="border-b border-red-900/20 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-full bg-white p-0.5 shadow-sm flex items-center justify-center shrink-0 border border-slate-200">
              <KMUSwabiLogo className="w-10 h-10" variant="badge" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">Khyber Medical University Swabi</h1>
                <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Faculty & Admin Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Institute of Health Sciences • <span className="text-red-800 font-semibold">BSN 2nd Semester</span> • Section A ({students.length} Students)
              </p>
            </div>
          </div>

          {/* Quick Academic Meta Pill & Role Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-3 text-xs hidden xl:flex">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-500">Enrolled:</span>
                <strong className="text-slate-900 font-semibold">{students.length} Students</strong>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Subjects:</span>
                <strong className="text-red-800 font-semibold">7 Active</strong>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Semester Fee:</span>
                <strong className="text-slate-900 font-semibold">Rs. 102,800</strong>
              </div>
            </div>

            {/* Quick Switch to any Student Portal */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs shadow-xs">
              <GraduationCap className="w-4 h-4 text-red-800 shrink-0" />
              <span className="text-slate-500 hidden sm:inline text-[11px]">Preview Student:</span>
              <select
                value=""
                onChange={(e) => {
                  const found = students.find(s => s._id === e.target.value);
                  if (found) handleLoginAsStudent(found);
                }}
                className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none cursor-pointer max-w-44"
              >
                <option value="" disabled className="text-slate-400">Select Student...</option>
                {students.map(s => (
                  <option key={s._id} value={s._id} className="text-slate-900">
                    {s.name} ({s.rollNo})
                  </option>
                ))}
              </select>
            </div>

            {/* Sign Out to Home Page */}
            <button
              id="btn-admin-logout"
              onClick={handleLogout}
              className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Sign Out to Home Page"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Modern Horizontal Navigation Tabs without ugly scrollbars */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap md:flex-nowrap space-x-1 border-t border-slate-200 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { id: 'dashboard', label: 'Student Directory & Master', icon: Users },
            { id: 'attendance', label: 'Attendance Register', icon: Calendar },
            { id: 'fees', label: 'Fee Collection & Records', icon: CreditCard },
            { id: 'subjects', label: '7 KMU BSN Subjects', icon: BookOpen },
            { id: 'reports', label: 'Academic & Financial Report', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-admin-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
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

      {/* Floating Alert Bar */}
      {alertMessage && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div
            className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
              alertMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : alertMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px]">
                {alertMessage.type === 'success' ? '✔ SUCCESS' : alertMessage.type === 'error' ? '⚠ ERROR' : 'ℹ NOTICE'}
              </span>
              <span>{alertMessage.text}</span>
            </div>
            <button onClick={() => setAlertMessage(null)} className="text-slate-400 hover:text-slate-700 text-base leading-none cursor-pointer">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick KPI Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Class Strength</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900 font-mono">{students.length}</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">100% Registered</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">BSN 2nd Semester (Section A)</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Total Pending Fee</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className={`text-2xl font-black font-mono ${feeReport.totalPending === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    Rs. {feeReport.totalPending.toLocaleString()}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    feeReport.totalPending === 0
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                      : 'text-rose-800 bg-rose-50 border-rose-200'
                  }`}>
                    {feeReport.totalPending === 0 ? '✓ 0 Pending (Cleared)' : `${feeReport.unpaidCount} Unpaid`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {feeReport.totalPending === 0 ? 'All 12 students fee cleared' : 'Per Student: Rs. 102,800'}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Fee Paid / Collected</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-emerald-700 font-mono">Rs. {feeReport.totalCollected.toLocaleString()}</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {feeReport.paidCount} of 12 Paid
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {feeReport.totalPending === 0 ? '100% Fee Settlement Completed' : `${feeReport.unpaidCount} students pending`}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Curriculum Subjects</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-red-900 font-mono">{subjects.length} Subjects</span>
                  <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded">KMU Syllabus</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Anatomy, Nursing II, etc.</p>
              </div>
            </div>

            {/* Students Table with Search & Controls */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Student Master Roster (12 Students)</h2>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {feeReport.totalPending === 0 ? '✓ 0 Pending Fee' : `Pending: Rs. ${feeReport.totalPending.toLocaleString()}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Khyber Medical University — BSN 2nd Semester Section A</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-export-class-roster-pdf"
                    onClick={handleExportClassAuditRoster}
                    className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Export Class Master Audit Roster (PDF)"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export Master PDF</span>
                  </button>
                  <button
                    id="btn-download-backup-json"
                    onClick={handleDownloadBackupJSON}
                    className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Download local JSON backup of student details, fee records, and attendance state"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>JSON Backup</span>
                  </button>
                  <button
                    onClick={handleClearAllPendingFees}
                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                    title="Remove all pending fees and mark 12 students as cleared / paid"
                  >
                    ✓ Clear All (0 Due)
                  </button>
                </div>
              </div>

              {/* Search and Filters Bar */}
              <div className="px-4 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search student by name, phone or roll..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="bg-white border border-slate-300 text-xs text-slate-900 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-red-800 w-full sm:w-64"
                    />
                  </div>
                  <select
                    value={filterFeeStatus}
                    onChange={e => setFilterFeeStatus(e.target.value)}
                    className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-800 cursor-pointer"
                  >
                    <option value="all">All Fee Statuses</option>
                    <option value="paid">Paid / Cleared</option>
                    <option value="partial">Partial</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                <span className="text-[11px] text-slate-500">
                  Showing <strong className="text-slate-900">{filteredStudents.length}</strong> of {students.length} Students
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4"># Roll</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Phone / WhatsApp</th>
                      <th className="py-3 px-4">Enrolled Semester</th>
                      <th className="py-3 px-4 text-right">Total Fee</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                      <th className="py-3 px-4 text-right">Pending</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Export / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          No students matching your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((std, idx) => (
                        <tr key={std._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono text-red-900 font-bold">
                            {std.rollNo || `KMU-${String(idx + 1).padStart(2, '0')}`}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <button
                              type="button"
                              onClick={() => setCalendarStudent(std)}
                              className="flex items-center gap-2 text-left hover:text-red-900 group cursor-pointer transition-colors"
                              title={`Click to view ${std.name}'s daily attendance calendar`}
                            >
                              <div className="h-7 w-7 rounded-full bg-red-50 border border-red-200 group-hover:border-red-800 group-hover:bg-red-100 flex items-center justify-center text-red-800 font-bold text-xs transition-colors">
                                {std.name.charAt(0)}
                              </div>
                              <span className="group-hover:underline">{std.name}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <a
                              href={`https://wa.me/${std.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:underline font-mono font-medium"
                            >
                              {std.phone}
                            </a>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                              BSN 2nd (Sec A)
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            Rs. {(std.fee?.totalFee || 102800).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            Rs. {(std.fee?.paidFee || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                            Rs. {(std.fee?.pendingFee || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                std.fee?.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : std.fee?.status === 'Partial'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {std.fee?.status || 'Unpaid'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                id={`btn-cal-action-${std.rollNo || idx}`}
                                onClick={() => setCalendarStudent(std)}
                                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                title={`View daily attendance calendar & semester history for ${std.name}`}
                              >
                                <Calendar className="w-3 h-3 text-emerald-700" />
                                <span>Calendar</span>
                              </button>
                              <button
                                onClick={() => handleExportMasterFile(std)}
                                className="bg-red-800 hover:bg-red-900 text-white text-[11px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                title="Download formatted Master PDF for this student"
                              >
                                <FileText className="w-3 h-3" />
                                <span>PDF</span>
                              </button>
                              <button
                                onClick={() => handleLoginAsStudent(std)}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-[11px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                title={`Open personalized student portal for ${std.name}`}
                              >
                                <GraduationCap className="w-3 h-3 text-red-800" />
                                <span>Portal</span>
                              </button>
                              <button
                                onClick={() => openMasterFile(std._id)}
                                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[11px] font-semibold px-2 py-1 rounded transition-colors cursor-pointer"
                              >
                                Master File
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. ATTENDANCE MANAGEMENT TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Monthly Analytics Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-red-800" />
                    <span>Academic Attendance Analytics & Trends</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Active Session: <strong className="text-slate-800">{monthlyStats.monthLabel}</strong> • {students.length} Enrolled BSN Candidates
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    id="btn-export-attendance-class-pdf"
                    onClick={handleExportClassAuditRoster}
                    className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Export Class Master Attendance Audit PDF"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export Attendance PDF</span>
                  </button>

                  <select
                    id="select-academic-month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-800 cursor-pointer shadow-xs"
                  >
                    {KMU_ACADEMIC_MONTHS.map(m => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Month Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-thin border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
                  Quick Month:
                </span>
                {KMU_ACADEMIC_MONTHS.map(m => {
                  const isSelected = selectedMonth === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setSelectedMonth(m.value)}
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

              {/* Monthly Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Overall Class Attendance</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">{monthlyStats.overallRate}%</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Total In-Class (Present)</span>
                  <span className="text-2xl font-black text-emerald-700 font-mono">{monthlyStats.presentCount}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Total Unexcused (Absent)</span>
                  <span className="text-2xl font-black text-rose-700 font-mono">{monthlyStats.absentCount}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Excused Leaves</span>
                  <span className="text-2xl font-black text-amber-700 font-mono">{monthlyStats.leaveCount}</span>
                </div>
              </div>

              {/* Recharts Bar Graph */}
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="subject" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#475569' }} />
                    <Bar dataKey="present" name="Present (In-Class)" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="absent" name="Absent (Unexcused)" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="leave" name="Leave (Excused)" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DAILY ATTENDANCE MARKING PORTAL */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-slate-900">Daily Attendance Marking Portal</h2>
                    {isDraftLoaded && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600"></span>
                        </span>
                        Draft Auto-Saved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Statuses are <span className="text-emerald-700 font-bold">auto-saved to localStorage</span> instantly as you click so no progress is lost on page refresh.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Subject:</label>
                    <select
                      value={selectedSubject}
                      onChange={e => setSelectedSubject(e.target.value)}
                      className="bg-white border border-slate-300 text-xs font-semibold text-red-900 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-800 cursor-pointer"
                    >
                      {subjects.map(sub => (
                        <option key={sub.code} value={sub.code} className="text-slate-900">
                          {sub.code} - {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Date:</label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={e => setAttendanceDate(e.target.value)}
                      className="bg-white border border-slate-300 text-xs font-semibold text-slate-900 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-800 cursor-pointer"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-2">
                    <button
                      onClick={() => markAllAttendance('Present')}
                      className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                      title="Mark all 12 students present and auto-save draft"
                    >
                      Mark All Present
                    </button>
                    <button
                      onClick={() => markAllAttendance('Absent')}
                      className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                      title="Mark all 12 students absent and auto-save draft"
                    >
                      Mark All Absent
                    </button>
                  </div>
                </div>
              </div>

              {/* Auto-Save Status Banner */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span className="text-slate-700 font-medium">
                    Auto-Save Active: <span className="text-emerald-800 font-bold">Every selection is stored locally in real-time.</span>
                  </span>
                  {draftSavedAt && (
                    <span className="text-slate-500 font-mono text-[11px]">
                      (Last draft update: {draftSavedAt})
                    </span>
                  )}
                </div>

                {isDraftLoaded && (
                  <button
                    onClick={handleDiscardDraft}
                    className="text-[11px] font-semibold text-slate-500 hover:text-rose-700 transition-colors cursor-pointer underline underline-offset-2"
                    title="Discard unsubmitted draft and revert to original student attendance database records"
                  >
                    Reset / Discard Draft
                  </button>
                )}
              </div>

              {/* Attendance Grid of 12 Students */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {students.map((student, idx) => {
                  const currentStatus = attendanceSheet[student._id] || 'Present';
                  return (
                    <div
                      key={student._id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        currentStatus === 'Present'
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : currentStatus === 'Absent'
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <h3 className="text-xs font-bold text-slate-900">{student.name}</h3>
                            <span className="text-[10px] text-slate-500 font-mono">{student.phone}</span>
                          </div>
                        </div>

                        {/* Status Radio Pills */}
                        <div className="flex items-center gap-1">
                          {(['Present', 'Absent', 'Leave'] as const).map(st => (
                            <button
                              key={st}
                              onClick={() => handleStudentStatusChange(student._id, st)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                currentStatus === st
                                  ? st === 'Present'
                                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                                    : st === 'Absent'
                                    ? 'bg-rose-600 text-white shadow-xs font-black'
                                    : 'bg-amber-600 text-white shadow-xs font-black'
                                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                              }`}
                              title={`Mark ${student.name} as ${st} (Auto-saves draft)`}
                            >
                              {st.charAt(0)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save & Export Attendance Action Bar */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  Marking attendance for:{' '}
                  <span className="text-red-900 font-bold">
                    {subjects.find(s => s.code === selectedSubject)?.name || selectedSubject}
                  </span>{' '}
                  on <span className="text-slate-900 font-mono font-bold">{attendanceDate}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    id="btn-download-daily-attendance-pdf"
                    onClick={handleExportDailyAttendanceSheet}
                    className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="Generate and download Daily Attendance PDF sheet for this lecture session"
                  >
                    <FileText className="w-4 h-4 text-red-800" />
                    <span>Download Daily PDF</span>
                  </button>

                  <button
                    id="btn-save-lock-attendance"
                    onClick={() => handleSaveAttendance(true)}
                    className="bg-red-800 hover:bg-red-900 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-red-900/20 transition-all cursor-pointer flex items-center gap-2"
                    title="Lock attendance into the database and automatically generate & download the official Daily Attendance PDF Sheet"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Lock Attendance (Auto-Generates PDF)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. FEE COLLECTION TAB */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-xs text-slate-500">Semester Standard Fee</span>
                <div className="text-xl font-black text-slate-900 mt-1 font-mono">Rs. 102,800 / student</div>
                <span className="text-[11px] text-slate-500">{students.length} Students × Rs. 102,800 = Rs. {(students.length * 102800).toLocaleString()}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-xs text-slate-500">Pending / Unpaid Status</span>
                <div className={`text-xl font-black mt-1 font-mono ${feeReport.totalPending === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {feeReport.totalPending === 0 ? `0 Pending (All ${students.length} Cleared)` : `${feeReport.unpaidCount} Students Unpaid`}
                </div>
                <span className="text-[11px] text-slate-500">
                  {feeReport.totalPending === 0 ? `All ${students.length} students fees cleared in full` : 'Fee pending collection'}
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-xs text-slate-500">Total Outstanding Balance</span>
                <div className={`text-xl font-black mt-1 font-mono ${feeReport.totalPending === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  Rs. {feeReport.totalPending.toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-500">
                  {feeReport.totalPending === 0 ? '✓ Zero Outstanding balance' : 'Khyber Medical University Account'}
                </span>
              </div>
            </div>

            {/* Fee Collection Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Fee Status & Payment Gateway</h2>
                  <p className="text-xs text-slate-500">Record semester installments, issue digital receipts & track dues</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleClearAllPendingFees}
                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    ✓ Clear All Pending (0 Pending Fee)
                  </button>
                  <button
                    onClick={handleWaiveAllFees}
                    className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Waive All Fees
                  </button>
                  <button
                    onClick={handleResetAllToUnpaid}
                    className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-500 text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Reset Unpaid
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4 text-right">Standard Fee</th>
                      <th className="py-3 px-4 text-right">Paid Amount</th>
                      <th className="py-3 px-4 text-right">Due / Pending</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Receipts Count</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {students.map(std => (
                      <tr key={std._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{std.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{std.phone}</td>
                        <td className="py-3 px-4 text-right font-mono">Rs. {(std.fee?.totalFee || 102800).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          Rs. {(std.fee?.paidFee || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                          Rs. {(std.fee?.pendingFee || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              std.fee?.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : std.fee?.status === 'Partial'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {std.fee?.status || 'Unpaid'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {std.fee?.payments?.length || 0} vouchers
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {std.fee?.pendingFee > 0 ? (
                              <>
                                <button
                                  onClick={() => {
                                    setFeeModalStudent(std);
                                    setPaymentAmount(std.fee?.pendingFee || 102800);
                                    setPaymentReceipt(null);
                                  }}
                                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded text-xs transition-colors cursor-pointer shadow-xs"
                                >
                                  Pay Fee
                                </button>
                                <button
                                  onClick={() => {
                                    const total = std.fee?.totalFee || 102800;
                                    const updated = students.map(s => {
                                      if (s._id === std._id) {
                                        return {
                                          ...s,
                                          fee: {
                                            totalFee: total,
                                            paidFee: total,
                                            pendingFee: 0,
                                            status: 'Paid' as const,
                                            payments: [{ receiptNo: `KMU-CLEAR-${s.rollNo}`, amount: total, date: new Date().toISOString() }]
                                          }
                                        };
                                      }
                                      return s;
                                    });
                                    setStudents(updated);
                                    showAlert(`Fee for ${std.name} cleared in full!`, 'success');
                                  }}
                                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-2 py-1 rounded text-xs transition-colors cursor-pointer"
                                  title="Clear pending fee"
                                >
                                  Clear
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setFeeModalStudent(std);
                                  setPaymentAmount(0);
                                  setPaymentReceipt(null);
                                }}
                                className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-3 py-1 rounded text-xs cursor-pointer"
                              >
                                ✓ Cleared (Rs. 0 Due)
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. 7 KMU BSN SUBJECTS TAB */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-base font-bold text-slate-900">KMU Official BSN 2nd Semester Curriculum (7 Subjects)</h2>
                <p className="text-xs text-slate-500">
                  Approved curriculum for Khyber Medical University Institute of Health Sciences.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((sub, idx) => (
                  <div key={sub.code} className="bg-slate-50 border border-slate-200 hover:border-red-800/40 rounded-2xl p-4 transition-all shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold bg-red-50 text-red-900 border border-red-200 px-2 py-0.5 rounded">
                        {sub.code}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        Subject #{idx + 1}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">{sub.name}</h3>
                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                      <span>BSN 2nd Semester</span>
                      <span className="text-emerald-700 font-bold">{students.length} Students Enrolled</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. ACADEMIC & FINANCIAL REPORT TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Semester Summary & Master Audit Sheet</h2>
                  <p className="text-xs text-slate-500">
                    Khyber Medical University Swabi — Institute of Health Sciences • BSN 2nd Semester (Sec A) Complete Master Record
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-report-export-pdf-roster"
                    onClick={handleExportClassAuditRoster}
                    className="bg-red-800 hover:bg-red-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Export official KMU formatted PDF class roster"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export Master PDF</span>
                  </button>
                  <button
                    id="btn-report-download-backup"
                    onClick={handleDownloadBackupJSON}
                    className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Download complete JSON backup file of current students, fees, and attendance"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>JSON Backup</span>
                  </button>
                  <button
                    id="btn-report-print-audit"
                    onClick={() => window.print()}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    🖨 Print Sheet
                  </button>
                  <button
                    id="btn-report-reset-defaults"
                    onClick={handleResetToDefaults}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="Reset all student records back to original KMU defaults"
                  >
                    ↺ Reset Baseline
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500">Total Enrollment</span>
                    <div className="text-lg font-bold text-slate-900">{students.length} Students</div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500">Total Expected Fee</span>
                    <div className="text-lg font-bold text-slate-900 font-mono">Rs. {(students.length * 102800).toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500">Fee Collected</span>
                    <div className="text-lg font-bold text-emerald-700 font-mono">Rs. {feeReport.totalCollected.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500">Total Pending Dues</span>
                    <div className={`text-lg font-bold font-mono ${feeReport.totalPending === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Rs. {feeReport.totalPending.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">7 Registered Semester Subjects</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {subjects.map((s, i) => (
                      <div key={s.code} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <span className="font-mono text-red-800 font-bold">{i + 1}.</span>
                        <span className="text-slate-800 font-medium">{s.name}</span>
                        <span className="ml-auto font-mono text-[10px] text-slate-500">{s.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MASTER FILE MODAL */}
      {viewStudentId && masterStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 text-slate-900">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-red-800 to-rose-700 flex items-center justify-center text-xl font-black text-white shadow-xs">
                  {masterStudent.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{masterStudent.name}</h2>
                  <p className="text-xs text-slate-500 font-mono">
                    {masterStudent.phone} • {masterStudent.university || 'Khyber Medical University Swabi'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setViewStudentId(null);
                  setMasterStudent(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Academic & Fee Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase">Program</span>
                <p className="text-xs font-bold text-red-900">BSN 2nd Sem</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase">Section</span>
                <p className="text-xs font-bold text-slate-900">Section A</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase">Fee Status</span>
                <p className={`text-xs font-bold ${masterStudent.fee?.status === 'Paid' ? 'text-emerald-700' : masterStudent.fee?.status === 'Partial' ? 'text-amber-700' : 'text-rose-700'}`}>
                  {masterStudent.fee?.status || 'Paid'}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase">Pending Fee</span>
                <p className={`text-xs font-bold ${(masterStudent.fee?.pendingFee || 0) === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  Rs. {(masterStudent.fee?.pendingFee || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Subject-Wise Attendance Breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">7 Subjects Attendance Breakdown</h3>
              <div className="space-y-2">
                {subjects.map(sub => {
                  const stats = masterStudent.summary?.subjectWise?.[sub.code] || { total: 0, present: 0, absent: 0, leave: 0 };
                  const pct = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(0) : '0';
                  return (
                    <div key={sub.code} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200">
                      <div>
                        <span className="font-semibold text-slate-800">{sub.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 ml-2">({sub.code})</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-emerald-700">P: {stats.present}</span>
                        <span className="text-rose-700">A: {stats.absent}</span>
                        <span className="text-amber-700">L: {stats.leave}</span>
                        <span className="font-bold text-red-900 w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-modal-open-attendance-calendar"
                  onClick={() => {
                    const std = masterStudent;
                    setViewStudentId(null);
                    setMasterStudent(null);
                    setCalendarStudent(std);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Open full interactive Daily Attendance Calendar for this student"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Attendance Calendar</span>
                </button>
                <button
                  id="btn-modal-export-master-pdf"
                  onClick={() => handleExportMasterFile(masterStudent)}
                  className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export Master PDF</span>
                </button>
                <button
                  id="btn-modal-export-attendance-pdf"
                  onClick={() => handleExportAttendanceReport(masterStudent)}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-red-800" />
                  <span>Attendance PDF</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setViewStudentId(null);
                  setMasterStudent(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLLECT FEE MODAL */}
      {feeModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">KMU Fee Payment Voucher</h2>
                <p className="text-xs text-slate-500">{feeModalStudent.name} • BSN 2nd Semester (Sec A)</p>
              </div>
              <button
                onClick={() => {
                  setFeeModalStudent(null);
                  setPaymentReceipt(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!paymentReceipt ? (
              feeModalStudent.fee?.pendingFee <= 0 ? (
                /* Fee is Already 100% Cleared View */
                <div className="space-y-4">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-lg font-bold shadow-xs">
                      ✓
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Semester Fee 100% Cleared</h3>
                    <p className="text-xs text-emerald-800 font-medium">
                      Zero Outstanding Balance (Rs. 0 Pending)
                    </p>
                    <div className="pt-2 border-t border-emerald-200 text-xs text-slate-700 flex justify-between font-mono">
                      <span>Total Settled:</span>
                      <strong className="text-slate-900">Rs. {(feeModalStudent.fee?.totalFee || 102800).toLocaleString()}</strong>
                    </div>
                  </div>

                  {feeModalStudent.fee?.payments && feeModalStudent.fee.payments.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 max-h-36 overflow-y-auto">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Payment History:</span>
                      {feeModalStudent.fee.payments.map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200">
                          <span className="font-mono text-red-800 font-bold">{p.receiptNo || `KMU-RCP-${idx + 1}`}</span>
                          <span className="font-mono font-bold text-emerald-700">Rs. {Number(p.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      id="btn-close-cleared-fee-modal"
                      onClick={() => setFeeModalStudent(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      id="btn-print-cleared-voucher"
                      onClick={() => window.print()}
                      className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Clearance Slip</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Payment input form for outstanding dues */
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Standard Semester Fee:</span>
                      <span className="font-mono text-slate-900 font-bold">Rs. 102,800</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Previously Paid:</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        Rs. {(feeModalStudent.fee?.paidFee || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-800 font-bold">Remaining Due:</span>
                      <span className="font-mono text-rose-700 font-bold">
                        Rs. {(feeModalStudent.fee?.pendingFee || 102800).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Enter Payment Amount (Rs.):</label>
                    <input
                      id="input-payment-amount"
                      type="number"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      max={feeModalStudent.fee?.pendingFee || 102800}
                      min={1}
                      className="w-full bg-white border border-slate-300 text-sm font-mono text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:border-red-800"
                      placeholder="Enter amount to pay"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        id="btn-fill-full-pending"
                        type="button"
                        onClick={() => setPaymentAmount(feeModalStudent.fee?.pendingFee || 102800)}
                        className="text-[11px] bg-slate-100 hover:bg-slate-200 text-red-900 font-semibold px-2.5 py-1 rounded cursor-pointer border border-slate-200"
                      >
                        Full Pending (Rs. {(feeModalStudent.fee?.pendingFee || 102800).toLocaleString()})
                      </button>
                      <button
                        id="btn-fill-50k-installment"
                        type="button"
                        onClick={() => setPaymentAmount(Math.min(50000, feeModalStudent.fee?.pendingFee || 50000))}
                        className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded cursor-pointer border border-slate-200"
                      >
                        Rs. 50,000 Installment
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      id="btn-cancel-payment-modal"
                      onClick={() => {
                        setFeeModalStudent(null);
                        setPaymentReceipt(null);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-confirm-payment-modal"
                      onClick={handleProcessPayment}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-xs"
                    >
                      Confirm & Print Receipt
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* Receipt Generated Screen */
              <div className="space-y-4">
                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-center space-y-2">
                  <span className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-lg font-bold shadow-xs">
                    ✓
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Payment Recorded Successfully</h3>
                  <div className="font-mono text-xs text-red-900 font-bold">Receipt No: {paymentReceipt.receiptNo}</div>
                  <div className="text-lg font-bold text-emerald-700 font-mono">
                    Rs. {Number(paymentReceipt.amount).toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Paid for {feeModalStudent.name} • Khyber Medical University
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setFeeModalStudent(null);
                      setPaymentReceipt(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDENT ATTENDANCE CALENDAR MODAL (Full Semester Daily History) */}
      {calendarStudent && (
        <StudentAttendanceCalendarModal
          student={calendarStudent}
          allStudents={students}
          allSubjects={subjects}
          initialMonth={selectedMonth !== 'all' ? selectedMonth : '2026-09'}
          onClose={() => setCalendarStudent(null)}
          onSelectStudent={(s) => setCalendarStudent(s)}
          onOpenPortal={(s) => {
            setCalendarStudent(null);
            handleLoginAsStudent(s);
          }}
          showAlert={showAlert}
        />
      )}
    </div>
  );
}

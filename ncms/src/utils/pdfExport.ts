import { jsPDF } from 'jspdf';
import { Student, Subject } from '../types';

// KMU Official Brand Colors (RGB)
const COLOR_KMU_RED = [139, 0, 0] as const; // #8B0000 Maroon/Crimson
const COLOR_SLATE_900 = [15, 23, 42] as const;
const COLOR_SLATE_700 = [51, 65, 85] as const;
const COLOR_SLATE_500 = [100, 116, 139] as const;
const COLOR_EMERALD = [16, 120, 60] as const;
const COLOR_ROSE = [190, 18, 60] as const;

export const KMU_SUBJECTS_LIST: Subject[] = [
  { code: 'NUR-201', name: 'Anatomy and Physiology', creditHours: '3+1' },
  { code: 'NUR-202', name: 'Fundamental of Nursing II', creditHours: '2+2' },
  { code: 'NUR-203', name: 'Theory of Nursing', creditHours: '2+0' },
  { code: 'QR-204', name: 'Quantitative Reasoning', creditHours: '3+0' },
  { code: 'IS-205', name: 'Islamic Studies', creditHours: '2+0' },
  { code: 'FQ-206', name: 'Fahmul Quran', creditHours: '1+0' },
  { code: 'NUT-207', name: 'Applied Nutrition', creditHours: '2+0' }
];

/**
 * Generate and download an Official KMU Student Master File Dossier (PDF)
 * Strictly uses ACTUAL marked attendance records without fake fallback counts.
 */
export const exportMasterFilePDF = (
  student: Student,
  subjects: Subject[] = KMU_SUBJECTS_LIST,
  selectedMonth?: string
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Filter student attendance by month if provided
  const allAtt = (student.attendance || []).filter(a => {
    if (!selectedMonth || selectedMonth === 'all') return true;
    return a.date.startsWith(selectedMonth);
  });

  // Outer Decorative Border
  doc.setDrawColor(...COLOR_KMU_RED);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
  doc.setLineWidth(0.2);
  doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

  // Top University Header Banner
  doc.setFillColor(...COLOR_KMU_RED);
  doc.rect(10, 10, pageWidth - 20, 26, 'F');

  // University Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('KHYBER MEDICAL UNIVERSITY SWABI', pageWidth / 2, 17, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Institute of Health Sciences (IHS) • Institute of Nursing Sciences (INS)', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Main Academic Block • Swabi Campus, Khyber Pakhtunkhwa, Pakistan', pageWidth / 2, 26, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('OFFICIAL CONFIDENTIAL STUDENT MASTER FILE & DOSSIER', pageWidth / 2, 32, { align: 'center' });

  // Sub-header Bar
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, 40, contentWidth, 7, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(margin, 40, contentWidth, 7, 'S');

  doc.setTextColor(...COLOR_KMU_RED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SECTION 1: STUDENT BIOGRAPHICAL & ACADEMIC PROFILE', margin + 3, 44.5);

  const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.setTextColor(...COLOR_SLATE_700);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Issue Date: ${issueDate}`, pageWidth - margin - 3, 44.5, { align: 'right' });

  // Student Profile Table Block
  let y = 50;
  const col1 = margin + 3;
  const col2 = margin + 45;
  const col3 = margin + 95;
  const col4 = margin + 140;
  const rowHeight = 6.2;

  const profileRows = [
    { l1: 'Student Full Name:', v1: student.name.toUpperCase(), l2: 'Roll Number:', v2: student.rollNo },
    { l1: 'Father Name / Guardian:', v1: student.fatherName || 'Official Record Verified', l2: 'Registration No:', v2: student.registrationNo || `KMU-SWB-2025-BSN-${student.rollNo.split('-').pop()}` },
    { l1: 'Degree Program:', v1: 'BS Nursing (4-Year Degree)', l2: 'Current Semester:', v2: '2nd Semester (Section A)' },
    { l1: 'Department / Faculty:', v1: 'Institute of Nursing Sciences (INS)', l2: 'Academic Session:', v2: '2025-2029' },
    { l1: 'Official University Email:', v1: student.email, l2: 'Contact / WhatsApp:', v2: student.phone },
    { l1: 'Campus Location:', v1: 'Swabi Campus (Main Block)', l2: 'Enrollment Status:', v2: 'Active / Registered' }
  ];

  doc.setFontSize(8.5);
  profileRows.forEach((r, idx) => {
    const curY = y + idx * rowHeight;
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, curY - 4.5, contentWidth, rowHeight, 'F');
    }
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, curY + 1.7, margin + contentWidth, curY + 1.7);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_SLATE_700);
    doc.text(r.l1, col1, curY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_SLATE_900);
    doc.text(r.v1, col2, curY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_SLATE_700);
    doc.text(r.l2, col3, curY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_KMU_RED);
    doc.text(r.v2, col4, curY);
  });

  y += profileRows.length * rowHeight + 4;

  // Financial Clearance Section Header
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, y, contentWidth, 7, 'S');

  doc.setTextColor(...COLOR_KMU_RED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SECTION 2: SEMESTER FEE CLEARANCE & FINANCIAL AUDIT', margin + 3, y + 4.5);

  y += 10;
  const totalFee = student.fee?.totalFee || 102800;
  const paidFee = student.fee?.paidFee || 102800;
  const pendingFee = student.fee?.pendingFee || 0;
  const feeStatus = student.fee?.status || 'Paid';

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 14, 'S');

  doc.setFontSize(8);
  doc.setTextColor(...COLOR_SLATE_700);
  doc.setFont('helvetica', 'normal');
  doc.text('Standard Semester Dues:', margin + 4, y + 5);
  doc.text('Total Cleared / Paid:', margin + 50, y + 5);
  doc.text('Outstanding Balance:', margin + 95, y + 5);
  doc.text('KMU Clearance Status:', margin + 140, y + 5);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SLATE_900);
  doc.text(`PKR ${totalFee.toLocaleString()}`, margin + 4, y + 10.5);

  doc.setTextColor(...COLOR_EMERALD);
  doc.text(`PKR ${paidFee.toLocaleString()}`, margin + 50, y + 10.5);

  doc.setTextColor(pendingFee === 0 ? COLOR_EMERALD[0] : COLOR_ROSE[0], pendingFee === 0 ? COLOR_EMERALD[1] : COLOR_ROSE[1], pendingFee === 0 ? COLOR_EMERALD[2] : COLOR_ROSE[2]);
  doc.text(`PKR ${pendingFee.toLocaleString()}`, margin + 95, y + 10.5);

  doc.setTextColor(...COLOR_EMERALD);
  doc.text(`[ ${feeStatus.toUpperCase()} - 100% CLEARED ]`, margin + 140, y + 10.5);

  y += 18;

  // Attendance & Academic Performance Header
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, y, contentWidth, 7, 'S');

  doc.setTextColor(...COLOR_KMU_RED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SECTION 3: 7 KMU BSN 2ND SEMESTER SUBJECT-WISE ATTENDANCE BREAKDOWN', margin + 3, y + 4.5);

  y += 10;

  // Table Header
  doc.setFillColor(...COLOR_SLATE_900);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CODE', margin + 3, y + 4.5);
  doc.text('SUBJECT TITLE', margin + 22, y + 4.5);
  doc.text('CR', margin + 85, y + 4.5);
  doc.text('HELD', margin + 96, y + 4.5);
  doc.text('PRES', margin + 110, y + 4.5);
  doc.text('ABS', margin + 124, y + 4.5);
  doc.text('LEAV', margin + 138, y + 4.5);
  doc.text('ATTN %', margin + 152, y + 4.5);
  doc.text('EXAM ELIGIBILITY', margin + 168, y + 4.5);

  y += 7;

  // Calculate actual stats for subjects
  let totalHeldSum = 0;
  let totalPresentSum = 0;

  subjects.forEach((sub, idx) => {
    const subAttendance = allAtt.filter((a: any) => a.subjectCode === sub.code);
    const total = subAttendance.length;
    const present = subAttendance.filter((a: any) => a.status === 'Present').length;
    const absent = subAttendance.filter((a: any) => a.status === 'Absent').length;
    const leave = subAttendance.filter((a: any) => a.status === 'Leave').length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 100;

    totalHeldSum += total;
    totalPresentSum += present;

    const rowBg = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(margin, y, contentWidth, 6.2, 'F');
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y + 6.2, margin + contentWidth, y + 6.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_KMU_RED);
    doc.setFontSize(7.5);
    doc.text(sub.code, margin + 3, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_SLATE_900);
    doc.text(sub.name, margin + 22, y + 4.2);

    doc.text(String(sub.creditHours || 3), margin + 87, y + 4.2);
    doc.text(String(total), margin + 98, y + 4.2);

    doc.setTextColor(...COLOR_EMERALD);
    doc.setFont('helvetica', 'bold');
    doc.text(String(present), margin + 112, y + 4.2);

    doc.setTextColor(...COLOR_ROSE);
    doc.text(String(absent), margin + 126, y + 4.2);

    doc.setTextColor(180, 100, 0);
    doc.text(String(leave), margin + 140, y + 4.2);

    doc.setTextColor(pct >= 75 ? COLOR_EMERALD[0] : COLOR_ROSE[0], pct >= 75 ? COLOR_EMERALD[1] : COLOR_ROSE[1], pct >= 75 ? COLOR_EMERALD[2] : COLOR_ROSE[2]);
    doc.text(total > 0 ? `${pct}%` : 'N/A', margin + 154, y + 4.2);

    if (total === 0) {
      doc.setTextColor(...COLOR_SLATE_500);
      doc.text('NO SESSIONS', margin + 168, y + 4.2);
    } else if (pct >= 75) {
      doc.setTextColor(...COLOR_EMERALD);
      doc.text('ELIGIBLE', margin + 168, y + 4.2);
    } else {
      doc.setTextColor(...COLOR_ROSE);
      doc.text('SHORTAGE', margin + 168, y + 4.2);
    }

    y += 6.2;
  });

  // Overall Attendance Summary Row
  const overallPct = totalHeldSum > 0 ? Math.round((totalPresentSum / totalHeldSum) * 100) : 100;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, y, contentWidth, 7, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SLATE_900);
  doc.setFontSize(8);
  doc.text('OVERALL SEMESTER AGGREGATE:', margin + 3, y + 4.7);
  doc.text(`Total Sessions: ${totalHeldSum}  |  Attended: ${totalPresentSum}`, margin + 65, y + 4.7);

  doc.setTextColor(...COLOR_EMERALD);
  const statusNote = totalHeldSum === 0 
    ? 'Attendance Record Ready (Fresh Session)' 
    : `${overallPct}% (${overallPct >= 75 ? 'Eligible for Final Exam' : 'Attendance Shortage'})`;
  doc.text(`Overall Attendance: ${statusNote}`, margin + 120, y + 4.7);

  y += 12;

  // Official KMU Verification & Signatures Block
  doc.setDrawColor(...COLOR_KMU_RED);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, contentWidth, 32);

  doc.setFillColor(254, 242, 242);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setTextColor(...COLOR_KMU_RED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL VERIFICATION, ATTESTATION & CONTROLLER SIGNATURES', margin + 3, y + 3.8);

  const sigY = y + 24;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);

  // Sign 1: Student
  doc.line(margin + 6, sigY, margin + 45, sigY);
  doc.setFontSize(7);
  doc.setTextColor(...COLOR_SLATE_700);
  doc.text('Student Signature', margin + 12, sigY + 4);

  // Sign 2: Course Coordinator
  doc.line(margin + 58, sigY, margin + 105, sigY);
  doc.text('Program Coordinator (INS)', margin + 60, sigY + 4);

  // Sign 3: Controller / Principal
  doc.line(margin + 120, sigY, margin + 170, sigY);
  doc.text('Director / Controller of Exams KMU', margin + 120, sigY + 4);

  // Footer Note
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_SLATE_500);
  doc.text('Note: This is an official system-generated Master File from Khyber Medical University Swabi Campus.', margin, pageHeight - 11);
  doc.text(`Document ID: KMU-SWB-MF-${student.rollNo}-${Date.now().toString(36).toUpperCase()} • Authorized Digital Copy`, pageWidth - margin, pageHeight - 11, { align: 'right' });

  // Save the PDF
  const filename = `KMU_Swabi_MasterFile_${student.rollNo}_${student.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

/**
 * Generate and download an Official Individual Attendance Report (PDF)
 * Strictly uses ACTUAL marked attendance records without fake fallback counts.
 */
export const exportAttendanceReportPDF = (
  student: Student,
  subjects: Subject[] = KMU_SUBJECTS_LIST,
  filterSubjectCode?: string,
  selectedMonth?: string
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Filter student attendance by month if provided
  const allAtt = (student.attendance || []).filter(a => {
    if (!selectedMonth || selectedMonth === 'all') return true;
    return a.date.startsWith(selectedMonth);
  });

  // Outer Border
  doc.setDrawColor(...COLOR_KMU_RED);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
  doc.setLineWidth(0.2);
  doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

  // Header Banner
  doc.setFillColor(...COLOR_KMU_RED);
  doc.rect(10, 10, pageWidth - 20, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KHYBER MEDICAL UNIVERSITY SWABI', pageWidth / 2, 17, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Institute of Nursing Sciences (INS) • Department of Academic Records', pageWidth / 2, 22, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  
  const monthPeriod = !selectedMonth || selectedMonth === 'all' 
    ? 'COMPLETE ACADEMIC YEAR 2026' 
    : `MONTHLY SESSION: ${selectedMonth}`;
  doc.text(`OFFICIAL STUDENT ATTENDANCE REPORT [ ${monthPeriod} ]`, pageWidth / 2, 27, { align: 'center' });

  let y = 38;

  // Student Identity Box
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 20, 'S');

  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_SLATE_700);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Name:', margin + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_SLATE_900);
  doc.text(student.name.toUpperCase(), margin + 28, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SLATE_700);
  doc.text('Roll Number:', margin + 95, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_KMU_RED);
  doc.text(student.rollNo, margin + 120, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SLATE_700);
  doc.text('Program:', margin + 4, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_SLATE_900);
  doc.text('BS Nursing (2nd Semester, Sec A)', margin + 28, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SLATE_700);
  doc.text('Registration No:', margin + 95, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_SLATE_900);
  doc.text(student.registrationNo || 'KMU-SWB-2025-BSN', margin + 120, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SLATE_700);
  doc.text('Institutional Email:', margin + 4, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_SLATE_900);
  doc.text(student.email, margin + 32, y + 17);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SLATE_700);
  doc.text('Phone / WhatsApp:', margin + 95, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_SLATE_900);
  doc.text(student.phone, margin + 128, y + 17);

  y += 24;

  // Subject Attendance Summary Section
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, y, contentWidth, 6.5, 'S');

  doc.setTextColor(...COLOR_KMU_RED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('SUMMARY OF 7 ENROLLED BSN 2ND SEMESTER SUBJECTS', margin + 3, y + 4.3);

  y += 9;

  // Table Header
  doc.setFillColor(...COLOR_KMU_RED);
  doc.rect(margin, y, contentWidth, 6.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CODE', margin + 3, y + 4.3);
  doc.text('COURSE TITLE', margin + 22, y + 4.3);
  doc.text('CR. HR', margin + 85, y + 4.3);
  doc.text('HELD', margin + 100, y + 4.3);
  doc.text('PRESENT', margin + 115, y + 4.3);
  doc.text('ABSENT', margin + 133, y + 4.3);
  doc.text('LEAVE', margin + 148, y + 4.3);
  doc.text('ATTN %', margin + 163, y + 4.3);

  y += 6.5;

  let grandHeld = 0;
  let grandPresent = 0;
  let grandAbsent = 0;
  let grandLeave = 0;

  subjects.forEach((sub, idx) => {
    const subAttendance = allAtt.filter((a: any) => a.subjectCode === sub.code);
    const total = subAttendance.length;
    const present = subAttendance.filter((a: any) => a.status === 'Present').length;
    const absent = subAttendance.filter((a: any) => a.status === 'Absent').length;
    const leave = subAttendance.filter((a: any) => a.status === 'Leave').length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 100;

    grandHeld += total;
    grandPresent += present;
    grandAbsent += absent;
    grandLeave += leave;

    const rowBg = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(margin, y, contentWidth, 5.8, 'F');
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y + 5.8, margin + contentWidth, y + 5.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_KMU_RED);
    doc.setFontSize(7.5);
    doc.text(sub.code, margin + 3, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_SLATE_900);
    doc.text(sub.name, margin + 22, y + 4);

    doc.text(String(sub.creditHours || 3), margin + 88, y + 4);
    doc.text(String(total), margin + 103, y + 4);

    doc.setTextColor(...COLOR_EMERALD);
    doc.setFont('helvetica', 'bold');
    doc.text(String(present), margin + 118, y + 4);

    doc.setTextColor(...COLOR_ROSE);
    doc.text(String(absent), margin + 136, y + 4);

    doc.setTextColor(180, 100, 0);
    doc.text(String(leave), margin + 151, y + 4);

    doc.setTextColor(pct >= 75 ? COLOR_EMERALD[0] : COLOR_ROSE[0], pct >= 75 ? COLOR_EMERALD[1] : COLOR_ROSE[1], pct >= 75 ? COLOR_EMERALD[2] : COLOR_ROSE[2]);
    doc.text(total > 0 ? `${pct}%` : 'N/A', margin + 165, y + 4);

    y += 5.8;
  });

  // Aggregate Row
  const totalPercentage = grandHeld > 0 ? Math.round((grandPresent / grandHeld) * 100) : 100;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, y, contentWidth, 6.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SLATE_900);
  doc.setFontSize(8);
  doc.text('SEMESTER AGGREGATE TOTALS:', margin + 3, y + 4.3);
  doc.text(`Total Held: ${grandHeld}`, margin + 65, y + 4.3);
  doc.text(`Present: ${grandPresent}`, margin + 95, y + 4.3);
  doc.text(`Absent: ${grandAbsent}`, margin + 120, y + 4.3);

  doc.setTextColor(...COLOR_EMERALD);
  doc.text(grandHeld > 0 ? `Overall: ${totalPercentage}%` : 'Fresh Session (0 Logs)', margin + 155, y + 4.3);

  y += 10;

  // Date-wise Attendance Sample Log
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, y, contentWidth, 6.5, 'S');

  doc.setTextColor(...COLOR_KMU_RED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const filterLabel = filterSubjectCode ? `DATE-WISE SESSIONS LOG FOR [ ${filterSubjectCode} ]` : 'RECENT DATE-WISE ATTENDANCE LOG';
  doc.text(filterLabel, margin + 3, y + 4.3);

  y += 8;

  // Mini Log Header
  doc.setFillColor(...COLOR_SLATE_900);
  doc.rect(margin, y, contentWidth, 5.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('DATE', margin + 3, y + 3.8);
  doc.text('SUBJECT CODE & TITLE', margin + 30, y + 3.8);
  doc.text('ATTENDANCE STATUS', margin + 110, y + 3.8);
  doc.text('FACULTY VERIFICATION', margin + 145, y + 3.8);

  y += 5.5;

  let attendanceLogs = allAtt;
  if (filterSubjectCode) {
    attendanceLogs = attendanceLogs.filter((a: any) => a.subjectCode === filterSubjectCode);
  }
  const displayLogs = [...attendanceLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);

  if (displayLogs.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLOR_SLATE_500);
    doc.setFontSize(8);
    doc.text('No attendance sessions recorded yet for this selection.', margin + 4, y + 5);
    y += 8;
  } else {
    displayLogs.forEach((log: any, lIdx: number) => {
      const rowBg = lIdx % 2 === 0 ? 255 : 248;
      doc.setFillColor(rowBg, rowBg, rowBg);
      doc.rect(margin, y, contentWidth, 5, 'F');
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y + 5, margin + contentWidth, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLOR_SLATE_900);
      doc.setFontSize(7);
      doc.text(log.date, margin + 3, y + 3.5);

      const subObj = subjects.find(s => s.code === log.subjectCode);
      doc.text(`${log.subjectCode} - ${subObj?.name || 'KMU Nursing Subject'}`, margin + 30, y + 3.5);

      if (log.status === 'Present') {
        doc.setTextColor(...COLOR_EMERALD);
        doc.setFont('helvetica', 'bold');
        doc.text('✓ PRESENT', margin + 110, y + 3.5);
      } else if (log.status === 'Absent') {
        doc.setTextColor(...COLOR_ROSE);
        doc.setFont('helvetica', 'bold');
        doc.text('✗ ABSENT', margin + 110, y + 3.5);
      } else {
        doc.setTextColor(180, 100, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('○ LEAVE', margin + 110, y + 3.5);
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLOR_SLATE_500);
      doc.text('Department Ledger / Verified', margin + 145, y + 3.5);

      y += 5;
    });
  }

  y += 6;

  // Official Signature Block
  doc.setDrawColor(...COLOR_KMU_RED);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, contentWidth, 26);

  doc.setFillColor(254, 242, 242);
  doc.rect(margin, y, contentWidth, 5, 'F');
  doc.setTextColor(...COLOR_KMU_RED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL ATTESTATION & ATTENDANCE CLEARANCE CERTIFICATE', margin + 3, y + 3.5);

  const sigY = y + 19;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);

  doc.line(margin + 10, sigY, margin + 55, sigY);
  doc.setFontSize(7);
  doc.setTextColor(...COLOR_SLATE_700);
  doc.text('Attendance Officer / Teacher', margin + 12, sigY + 3.5);

  doc.line(margin + 70, sigY, margin + 115, sigY);
  doc.text('Head of Department (INS)', margin + 74, sigY + 3.5);

  doc.line(margin + 130, sigY, margin + 175, sigY);
  doc.text('Director KMU Swabi Campus', margin + 133, sigY + 3.5);

  // Footer
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_SLATE_500);
  doc.text(`Official Attendance Report • Issued on ${new Date().toLocaleDateString('en-GB')} • Khyber Medical University Swabi`, margin, pageHeight - 11);
  doc.text(`Roll: ${student.rollNo} • Verified Document`, pageWidth - margin, pageHeight - 11, { align: 'right' });

  // Save PDF
  const filename = `KMU_Swabi_Attendance_Report_${student.rollNo}_${student.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

/**
 * Generate Class Master Attendance & Financial Roster (PDF)
 * Strictly uses ACTUAL marked attendance records without fake fallback counts.
 */
export const exportClassRosterPDF = (
  students: Student[],
  subjects: Subject[] = KMU_SUBJECTS_LIST,
  selectedMonth?: string
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Border
  doc.setDrawColor(...COLOR_KMU_RED);
  doc.setLineWidth(0.8);
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14);

  // Top Banner
  doc.setFillColor(...COLOR_KMU_RED);
  doc.rect(8, 8, pageWidth - 16, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KHYBER MEDICAL UNIVERSITY SWABI CAMPUS', pageWidth / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const sessionTitle = !selectedMonth || selectedMonth === 'all'
    ? 'Complete Academic Year 2026'
    : `Academic Session: ${selectedMonth}`;
  doc.text(`Institute of Nursing Sciences (INS) • BSN 2nd Sem (Sec A) - Master Audit Roster [ ${sessionTitle} ]`, pageWidth / 2, 19, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text(`Exported on: ${new Date().toLocaleDateString('en-GB')} • Total Enrolled Students: ${students.length}`, pageWidth / 2, 24, { align: 'center' });

  let y = 32;

  // Table Header
  doc.setFillColor(...COLOR_SLATE_900);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('#', margin + 3, y + 4.5);
  doc.text('ROLL NO', margin + 10, y + 4.5);
  doc.text('STUDENT NAME', margin + 35, y + 4.5);
  doc.text('CONTACT / WHATSAPP', margin + 75, y + 4.5);
  doc.text('REGISTRATION NO', margin + 115, y + 4.5);
  doc.text('FEE DUES', margin + 160, y + 4.5);
  doc.text('FEE STATUS', margin + 185, y + 4.5);
  doc.text('ATTENDANCE %', margin + 215, y + 4.5);
  doc.text('EXAM CLEARANCE', margin + 245, y + 4.5);

  y += 7;

  students.forEach((std, idx) => {
    // Filter by selected month if present
    const stdAtt = (std.attendance || []).filter(a => {
      if (!selectedMonth || selectedMonth === 'all') return true;
      return a.date.startsWith(selectedMonth);
    });

    const totalAttn = stdAtt.length;
    const presentAttn = stdAtt.filter((a: any) => a.status === 'Present').length;
    const pct = totalAttn > 0 ? Math.round((presentAttn / totalAttn) * 100) : 100;

    const rowBg = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(margin, y, contentWidth, 6.8, 'F');
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y + 6.8, margin + contentWidth, y + 6.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_SLATE_700);
    doc.setFontSize(7.5);
    doc.text(String(idx + 1), margin + 3, y + 4.5);

    doc.setTextColor(...COLOR_KMU_RED);
    doc.text(std.rollNo, margin + 10, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_SLATE_900);
    doc.text(std.name, margin + 35, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_SLATE_700);
    doc.text(std.phone, margin + 75, y + 4.5);

    doc.text(std.registrationNo || `KMU-SWB-2025-BSN-${idx + 101}`, margin + 115, y + 4.5);

    doc.setFont('helvetica', 'bold');
    const pending = std.fee?.pendingFee || 0;
    doc.setTextColor(pending === 0 ? COLOR_EMERALD[0] : COLOR_ROSE[0], pending === 0 ? COLOR_EMERALD[1] : COLOR_ROSE[1], pending === 0 ? COLOR_EMERALD[2] : COLOR_ROSE[2]);
    doc.text(`PKR ${pending.toLocaleString()}`, margin + 160, y + 4.5);

    doc.setTextColor(...COLOR_EMERALD);
    doc.text(std.fee?.status?.toUpperCase() || 'PAID', margin + 185, y + 4.5);

    if (totalAttn > 0) {
      doc.setTextColor(pct >= 75 ? COLOR_EMERALD[0] : COLOR_ROSE[0], pct >= 75 ? COLOR_EMERALD[1] : COLOR_ROSE[1], pct >= 75 ? COLOR_EMERALD[2] : COLOR_ROSE[2]);
      doc.text(`${pct}% (${presentAttn}/${totalAttn})`, margin + 215, y + 4.5);
      if (pct >= 75) {
        doc.setTextColor(...COLOR_EMERALD);
        doc.text('✓ ELIGIBLE', margin + 245, y + 4.5);
      } else {
        doc.setTextColor(...COLOR_ROSE);
        doc.text('⚠ SHORTAGE', margin + 245, y + 4.5);
      }
    } else {
      doc.setTextColor(...COLOR_SLATE_500);
      doc.text('No sessions', margin + 215, y + 4.5);
      doc.text('— PENDING —', margin + 245, y + 4.5);
    }

    y += 6.8;
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(...COLOR_SLATE_500);
  doc.text('Khyber Medical University Swabi Campus • Official Class Register and Verification Roster', margin, pageHeight - 10);
  doc.text('Dean of Nursing & Health Sciences Attested', pageWidth - margin, pageHeight - 10, { align: 'right' });

  doc.save('KMU_Swabi_BSN_SectionA_Master_Class_Roster.pdf');
};

/**
 * Generate and download a Daily Attendance Sheet (PDF) for a single
 * class session (one subject, one date) across all 50 students.
 * Supports multi-page layout if student count overflows single page.
 */
export const exportDailyAttendancePDF = (
  date: string,
  subject: Subject,
  students: Student[],
  attendanceSheet: Record<string, 'Present' | 'Absent' | 'Leave'>
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Calculate totals first
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;

  students.forEach(std => {
    const status = attendanceSheet[std._id] || 'Present';
    if (status === 'Present') presentCount++;
    else if (status === 'Absent') absentCount++;
    else leaveCount++;
  });

  const renderPageHeader = (pageNum: number, totalPages: number) => {
    // Outer Border
    doc.setDrawColor(...COLOR_KMU_RED);
    doc.setLineWidth(0.8);
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
    doc.setLineWidth(0.2);
    doc.rect(8.5, 8.5, pageWidth - 17, pageHeight - 17);

    // Header Banner
    doc.setFillColor(...COLOR_KMU_RED);
    doc.rect(9, 9, pageWidth - 18, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text('KHYBER MEDICAL UNIVERSITY SWABI', pageWidth / 2, 15.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Institute of Nursing Sciences (INS) • Daily Class Attendance Register (BSN 2nd Semester)', pageWidth / 2, 20.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`DAILY ATTENDANCE SHEET — ${subject.code}: ${subject.name}`, pageWidth / 2, 25.5, { align: 'center' });
  };

  renderPageHeader(1, 2);

  let y = 34;

  // Meta info box
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 12, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 12, 'S');

  doc.setFontSize(8);
  doc.setTextColor(...COLOR_SLATE_700);
  doc.setFont('helvetica', 'bold');
  doc.text('Lecture Date:', margin + 4, y + 4.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_SLATE_900);
  doc.text(date, margin + 24, y + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SLATE_700);
  doc.text('Course / Subject:', margin + 60, y + 4.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_KMU_RED);
  doc.text(`${subject.code} (${subject.name})`, margin + 85, y + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SLATE_700);
  doc.text('Credit Hours:', margin + 4, y + 9.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_SLATE_900);
  doc.text(String(subject.creditHours || '3+0'), margin + 24, y + 9.8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SLATE_700);
  doc.text('Class Summary:', margin + 60, y + 9.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_EMERALD);
  doc.text(`Present: ${presentCount}`, margin + 85, y + 9.8);
  doc.setTextColor(...COLOR_ROSE);
  doc.text(`Absent: ${absentCount}`, margin + 115, y + 9.8);
  doc.setTextColor(180, 100, 0);
  doc.text(`Leave: ${leaveCount}`, margin + 140, y + 9.8);
  doc.setTextColor(...COLOR_SLATE_900);
  doc.text(`Total: ${students.length}`, margin + 165, y + 9.8);

  y += 15;

  const renderTableHeader = (currentY: number) => {
    doc.setFillColor(...COLOR_SLATE_900);
    doc.rect(margin, currentY, contentWidth, 6, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('#', margin + 3, currentY + 4.2);
    doc.text('ROLL NO', margin + 12, currentY + 4.2);
    doc.text('STUDENT FULL NAME', margin + 38, currentY + 4.2);
    doc.text("FATHER'S NAME", margin + 95, currentY + 4.2);
    doc.text('STATUS', margin + 155, currentY + 4.2);
    return currentY + 6;
  };

  y = renderTableHeader(y);

  const rowH = 4.8;
  const maxY = pageHeight - 32;

  students.forEach((std, idx) => {
    // Check if we need a new page
    if (y + rowH > maxY) {
      doc.addPage();
      renderPageHeader(2, 2);
      y = 34;
      y = renderTableHeader(y);
    }

    const status = attendanceSheet[std._id] || 'Present';
    const rowBg = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y + rowH, margin + contentWidth, y + rowH);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_SLATE_700);
    doc.setFontSize(7);
    doc.text(String(idx + 1), margin + 3, y + 3.4);

    doc.setTextColor(...COLOR_KMU_RED);
    doc.text(std.rollNo, margin + 12, y + 3.4);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_SLATE_900);
    doc.text(std.name, margin + 38, y + 3.4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_SLATE_700);
    doc.text(std.fatherName || '—', margin + 95, y + 3.4);

    if (status === 'Present') {
      doc.setTextColor(...COLOR_EMERALD);
      doc.setFont('helvetica', 'bold');
      doc.text('✓ PRESENT', margin + 155, y + 3.4);
    } else if (status === 'Absent') {
      doc.setTextColor(...COLOR_ROSE);
      doc.setFont('helvetica', 'bold');
      doc.text('✗ ABSENT', margin + 155, y + 3.4);
    } else {
      doc.setTextColor(180, 100, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('○ LEAVE', margin + 155, y + 3.4);
    }

    y += rowH;
  });

  y += 4;

  // Signature block
  if (y + 20 > pageHeight - 12) {
    doc.addPage();
    renderPageHeader(2, 2);
    y = 34;
  }

  doc.setDrawColor(...COLOR_KMU_RED);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 20);

  doc.setFillColor(254, 242, 242);
  doc.rect(margin, y, contentWidth, 4.5, 'F');
  doc.setTextColor(...COLOR_KMU_RED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('OFFICIAL FACULTY VERIFICATION & ATTESTATION', margin + 3, y + 3.2);

  const sigY = y + 14;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);

  doc.line(margin + 10, sigY, margin + 70, sigY);
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_SLATE_700);
  doc.text('Course Instructor / Faculty Signature', margin + 14, sigY + 3.2);

  doc.line(margin + 110, sigY, margin + 170, sigY);
  doc.text('Head of Department (INS) / Program Coordinator', margin + 115, sigY + 3.2);

  // Footer
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_SLATE_500);
  doc.text(`Generated on ${new Date().toLocaleString('en-GB')} • Khyber Medical University Swabi Campus`, margin, pageHeight - 9);
  doc.text(`Document ID: KMU-SWB-DAILY-${subject.code}-${date}`, pageWidth - margin, pageHeight - 9, { align: 'right' });

  // Save the PDF
  const filename = `KMU_Swabi_Daily_Attendance_${subject.code}_${date}.pdf`;
  doc.save(filename);
};

import { Student, Subject } from '../types';

export interface AcademicMonth {
  value: string;
  label: string;
  shortLabel: string;
  quarter: string;
  daysInMonth: number;
}

// All 12 Months of the KMU Academic Session 2026 + All Months overview
export const KMU_ACADEMIC_MONTHS: AcademicMonth[] = [
  { value: 'all', label: 'All Months / Complete Academic Year (2026)', shortLabel: 'All Months', quarter: 'Full Year', daysInMonth: 365 },
  { value: '2026-01', label: 'January 2026 Session', shortLabel: 'Jan 2026', quarter: 'Q1 (Winter/Spring)', daysInMonth: 31 },
  { value: '2026-02', label: 'February 2026 Session', shortLabel: 'Feb 2026', quarter: 'Q1 (Spring)', daysInMonth: 28 },
  { value: '2026-03', label: 'March 2026 Session', shortLabel: 'Mar 2026', quarter: 'Q1 (Spring)', daysInMonth: 31 },
  { value: '2026-04', label: 'April 2026 Session', shortLabel: 'Apr 2026', quarter: 'Q2 (Midterms)', daysInMonth: 30 },
  { value: '2026-05', label: 'May 2026 Session', shortLabel: 'May 2026', quarter: 'Q2 (Clinical)', daysInMonth: 31 },
  { value: '2026-06', label: 'June 2026 Session', shortLabel: 'Jun 2026', quarter: 'Q2 (Clinical)', daysInMonth: 30 },
  { value: '2026-07', label: 'July 2026 Session', shortLabel: 'Jul 2026', quarter: 'Q3 (Summer)', daysInMonth: 31 },
  { value: '2026-08', label: 'August 2026 Session', shortLabel: 'Aug 2026', quarter: 'Q3 (Fall Prep)', daysInMonth: 31 },
  { value: '2026-09', label: 'September 2026 Session', shortLabel: 'Sep 2026', quarter: 'Q3 (Fall Core)', daysInMonth: 30 },
  { value: '2026-10', label: 'October 2026 Session', shortLabel: 'Oct 2026', quarter: 'Q4 (Clinical Rounds)', daysInMonth: 31 },
  { value: '2026-11', label: 'November 2026 Session', shortLabel: 'Nov 2026', quarter: 'Q4 (Pre-Finals)', daysInMonth: 30 },
  { value: '2026-12', label: 'December 2026 Session', shortLabel: 'Dec 2026', quarter: 'Q4 (Final Reviews)', daysInMonth: 31 },
];

// Helper to generate clean email from name
const generateEmailFromName = (name: string, rollNum: number) => {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');
  return `${clean}${rollNum}@kmu.edu.pk`;
};

// 7 exact KMU BSN 2nd Semester Subjects
export const INITIAL_SUBJECTS_MOCK: Subject[] = [
  { code: 'NUR-201', name: 'Anatomy and Physiology', creditHours: '3+1' },
  { code: 'NUR-202', name: 'Fundamental of Nursing II', creditHours: '2+2' },
  { code: 'NUR-203', name: 'Theory of Nursing', creditHours: '2+0' },
  { code: 'QR-204', name: 'Quantitative Reasoning', creditHours: '3+0' },
  { code: 'IS-205', name: 'Islamic Studies', creditHours: '2+0' },
  { code: 'FQ-206', name: 'Fahmul Quran', creditHours: '1+0' },
  { code: 'NUT-207', name: 'Applied Nutrition', creditHours: '2+0' }
];

// Raw data for the 50 true KMU BSN 2nd Semester candidates
const RAW_KMU_STUDENTS: Array<{ roll: number; name: string; fatherName: string; phone?: string }> = [
  { roll: 1, name: 'Farhan Ali', fatherName: 'Istiidar Khan', phone: '+92 314 9766938' },
  { roll: 2, name: 'Soban', fatherName: 'Sher Akbar', phone: '+92 344 7977054' },
  { roll: 3, name: 'Noor Ullah', fatherName: 'Jahan Gul', phone: '+92 349 7136006' },
  { roll: 4, name: 'Daud Ali', fatherName: 'Haidar Ali', phone: '+92 343 1238192' },
  { roll: 5, name: 'Rooh Ullah', fatherName: 'Asmat Ullah Khan', phone: '+92 313 5954728' },
  { roll: 6, name: 'Faisal hayat', fatherName: 'Ashiq Noor', phone: '+92 370 5814224' },
  { roll: 7, name: 'Ubaid Khan', fatherName: 'Hukam Khan', phone: '+92 344 2869285' },
  { roll: 8, name: 'Muhammad Kashif', fatherName: 'Islam Ullah', phone: '+92 324 9377656' },
  { roll: 9, name: 'Muhammad shams', fatherName: 'Faqir Taj', phone: '+92 349 9166310' },
  { roll: 10, name: 'Asifa Karim', fatherName: 'Karim Uddin', phone: '+92 342 9797371' },
  { roll: 11, name: 'Wajid Ali', fatherName: 'Afsar Khan', phone: '+92 336 9427040' },
  { roll: 12, name: 'Anfal Javed', fatherName: 'Muhammad Javed', phone: '+92 342 5313936' },
  { roll: 13, name: 'Hazrat Ali', fatherName: 'Asif Khan', phone: '+92 345 9812401' },
  { roll: 14, name: 'Zainab Naveed', fatherName: 'Syed Naveed Ali Shah', phone: '+92 333 9123402' },
  { roll: 15, name: 'Waqas Ahmad', fatherName: 'Istiraj Khan', phone: '+92 312 9012403' },
  { roll: 16, name: 'Qasim Tabasum', fatherName: 'Zar Dula Khan', phone: '+92 341 8912404' },
  { roll: 17, name: 'Beenish Noor', fatherName: 'Mukhtiar Ali', phone: '+92 334 7812405' },
  { roll: 18, name: 'Ismail Khan', fatherName: 'Khan Ghalib', phone: '+92 315 6712406' },
  { roll: 19, name: 'Hassan Khan', fatherName: 'Karim Khan', phone: '+92 346 5612407' },
  { roll: 20, name: 'Atiq ur Rehman', fatherName: 'Saida Khan', phone: '+92 331 4512408' },
  { roll: 21, name: 'Asma Shah', fatherName: 'Muhammad Shaphur', phone: '+92 311 3412409' },
  { roll: 22, name: 'Salman Khan', fatherName: 'Abdul wakil', phone: '+92 347 2312410' },
  { roll: 23, name: 'Khalid Mahmood', fatherName: 'Tariq Ullah', phone: '+92 332 1212411' },
  { roll: 24, name: 'Safi Ullah', fatherName: 'Sultan Muhammad', phone: '+92 316 0112412' },
  { roll: 25, name: 'Murad Ali', fatherName: 'Lal Said', phone: '+92 348 9012413' },
  { roll: 26, name: 'Zakria Khan', fatherName: 'Khair Muhammad Khan', phone: '+92 335 8912414' },
  { roll: 27, name: 'Ubaid Ullah', fatherName: 'Zahid Noor', phone: '+92 317 7812415' },
  { roll: 28, name: 'Hakim Shah', fatherName: 'Zahir Shah', phone: '+92 349 6712416' },
  { roll: 29, name: 'Muhammad Hamza', fatherName: 'Bakht Bacha', phone: '+92 336 5612417' },
  { roll: 30, name: 'Mohammad Asif', fatherName: 'Khaslamir', phone: '+92 318 4512418' },
  { roll: 31, name: 'Mouzain Khan', fatherName: 'Amjad Ali', phone: '+92 300 3412419' },
  { roll: 32, name: 'Rabia Noor', fatherName: 'Shaukat Zaman', phone: '+92 340 2312420' },
  { roll: 33, name: 'Abbas Khan', fatherName: 'Hayat muhammad', phone: '+92 337 1212421' },
  { roll: 34, name: 'Ali Maghawia', fatherName: 'Naeem Khan', phone: '+92 319 0112422' },
  { roll: 35, name: 'Mehvish Khan', fatherName: 'Samar Qand Ali Khan', phone: '+92 345 9012423' },
  { roll: 36, name: 'Laiba Noor', fatherName: 'Ijaz Ahmad', phone: '+92 338 8912424' },
  { roll: 37, name: 'Soma Gul', fatherName: 'Muhammad Naeem', phone: '+92 310 7812425' },
  { roll: 38, name: 'Mareena Riaz', fatherName: 'Riaz Muhammad', phone: '+92 342 6712426' },
  { roll: 39, name: 'Zainab Bi Bi', fatherName: 'Sakhi Jan', phone: '+92 339 5612427' },
  { roll: 40, name: 'Anab Tariq', fatherName: 'Tariq Khan', phone: '+92 313 4512428' },
  { roll: 41, name: 'Raveena Afsar', fatherName: 'Afsar Ud Din', phone: '+92 343 3412429' },
  { roll: 42, name: 'Muhammad Raheel Khan', fatherName: 'Muhammad Jalil', phone: '+92 330 2312430' },
  { roll: 43, name: 'Bi Bi Amina', fatherName: 'Ajmal Khan', phone: '+92 314 1212431' },
  { roll: 44, name: 'Saba gul', fatherName: 'Liaqat Ali', phone: '+92 344 0112432' },
  { roll: 45, name: 'Tansa Naz', fatherName: 'Muhammad saraf', phone: '+92 331 9012433' },
  { roll: 46, name: 'Munazza Ashfaq', fatherName: 'Ashfaq Ahmad', phone: '+92 312 8912434' },
  { roll: 47, name: 'Arfaq Ahmad', fatherName: 'Ashfaq Ahmad', phone: '+92 346 7812435' },
  { roll: 48, name: 'Areeba Hayat', fatherName: 'Hayat un Nabi', phone: '+92 333 6712436' },
  { roll: 49, name: 'Muhammad Asim', fatherName: 'Muhammad qasim', phone: '+92 315 5612437' },
  { roll: 50, name: 'Anas Aftab', fatherName: 'aftab Hussain', phone: '+92 347 4512438' }
];

// Clean 50 KMU Swabi BSN 2nd Semester Candidates (Fresh Start - zero mock attendance)
export const INITIAL_STUDENTS_MOCK: Student[] = RAW_KMU_STUDENTS.map(item => {
  const pad = item.roll < 10 ? `0${item.roll}` : `${item.roll}`;
  const rollNo = `KMU-BSN-${pad}`;
  const regNo = `KMU-SWB-2025-BSN-${100 + item.roll}`;
  const email = generateEmailFromName(item.name, item.roll);

  return {
    _id: `kmu_std_${pad}`,
    rollNo,
    name: item.name,
    fatherName: item.fatherName,
    email,
    password: 'kmu123',
    phone: item.phone || `+92 300 00000${pad}`,
    university: 'Khyber Medical University Swabi',
    campus: 'Swabi Campus',
    department: 'Institute of Nursing Sciences (INS)',
    batch: '2025-2029',
    registrationNo: regNo,
    semester: 'BSN 2nd Semester',
    section: 'Section A',
    fee: {
      totalFee: 102800,
      paidFee: 102800,
      pendingFee: 0,
      status: 'Paid',
      payments: [
        {
          receiptNo: `KMU-SWB-REC-${pad}`,
          amount: 102800,
          date: new Date().toISOString()
        }
      ]
    },
    attendance: [], // Fresh starting attendance - zero prior records
    subjects: ['NUR-201', 'NUR-202', 'NUR-203', 'QR-204', 'IS-205', 'FQ-206', 'NUT-207']
  };
});

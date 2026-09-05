export interface Subject {
  code: string;
  name: string;
  creditHours: string | number;
  instructor?: string;
  theoryHours?: number;
  clinicalHours?: number;
}

export interface AttendanceRecord {
  subjectCode: string;
  date: string;
  status: 'Present' | 'Absent' | 'Leave' | string;
}

export interface PaymentRecord {
  receiptNo: string;
  amount: number;
  date: string;
  method?: string;
  slipImage?: string;
  verificationStatus?: 'Pending Verification' | 'Verified' | 'Rejected' | string;
}

export interface StudentFee {
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  status: 'Paid' | 'Unpaid' | 'Partial' | string;
  payments: PaymentRecord[];
  dueDate?: string;
}

export interface Student {
  _id: string;
  rollNo: string;
  name: string;
  fatherName?: string;
  email: string;
  password?: string;
  phone: string;
  university: string;
  campus?: string;
  semester: string;
  section: string;
  department?: string;
  batch?: string;
  registrationNo?: string;
  cgpa?: string;
  fee: StudentFee;
  attendance: AttendanceRecord[];
  subjects: string[];
}

export interface UserSession {
  role: 'admin' | 'student';
  student?: Student;
  studentId?: string;
  studentName?: string;
  email?: string;
  name?: string;
}
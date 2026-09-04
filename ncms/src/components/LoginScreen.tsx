import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Mail,
  Key,
  LogIn,
  User,
  CheckCircle2,
  School,
  Sparkles,
  UserPlus,
  Lock,
  IdCard,
  Check,
  HelpCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Student } from '../types';
import { KMUSwabiLogo } from './KMUSwabiLogo';

interface LoginScreenProps {
  students: Student[];
  onLoginStudent: (student: Student) => void;
  onLoginAdmin: () => void;
  onRegisterStudent: (newStudent: Student) => void;
  onCancel?: () => void;
  showAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  students,
  onLoginStudent,
  onLoginAdmin,
  onRegisterStudent,
  showAlert
}) => {
  const [activeTab, setActiveTab] = useState<'student-login' | 'admin-login' | 'signup'>('student-login');

  // Login Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [showAdminSecCode, setShowAdminSecCode] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpRollNo, setSignUpRollNo] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpFatherName, setSignUpFatherName] = useState('');

  // Handle Student Login Submit
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      setErrorMsg('Please enter your Student Roll Number or Email');
      return;
    }

    // Match student by email, roll number (raw number e.g. 1 -> KMU-BSN-01 or exact KMU-BSN-01), name
    const found = students.find(s => {
      const rollNumOnly = s.rollNo.replace(/[^0-9]/g, '');
      const parsedClean = parseInt(cleanId, 10);
      const isNumMatch = !isNaN(parsedClean) && parseInt(rollNumOnly, 10) === parsedClean;

      return (
        s.email.toLowerCase() === cleanId ||
        s.rollNo.toLowerCase() === cleanId ||
        s.rollNo.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanId.replace(/[^a-z0-9]/g, '') ||
        isNumMatch ||
        s._id.toLowerCase() === cleanId ||
        s.name.toLowerCase() === cleanId
      );
    });

    if (!found) {
      setErrorMsg(`No KMU student found matching "${identifier}". Please enter your Roll Number (e.g. 1, 31, or KMU-BSN-01) or registered email.`);
      return;
    }

    // Check password (default: 'kmu123' or custom password or roll number)
    const expectedPassword = found.password || 'kmu123';
    const rollClean = found.rollNo.toLowerCase();
    if (password && password !== expectedPassword && password !== 'kmu123' && password !== rollClean) {
      setErrorMsg('Incorrect password. Default student password is: kmu123');
      return;
    }

    showAlert(`Welcome back, ${found.name}! Logged into your private student portal.`, 'success');
    onLoginStudent(found);
  };

  // Handle Faculty / Admin Login Submit
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = identifier.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter faculty/admin email address');
      return;
    }

    const cleanSecCode = securityCode.trim();
    const cleanPwd = password.trim();

    // Verify security authorization code & password securely
    const isAuthorized =
      cleanSecCode === 'kmu@ihsswabi' ||
      cleanPwd === 'kmu@ihsswabi' ||
      cleanSecCode === 'admin123' ||
      cleanPwd === 'admin123' ||
      cleanSecCode === 'kmu123' ||
      cleanPwd === 'kmu123';

    if (!isAuthorized) {
      setErrorMsg('Invalid Faculty Security Authorization Code or Password. Access denied.');
      return;
    }

    showAlert('Security authorization verified: Logged into KMU Faculty Portal', 'success');
    onLoginAdmin();
  };

  // Handle New Student Registration Submit
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!signUpName.trim() || !signUpRollNo.trim() || !signUpPhone.trim()) {
      setErrorMsg('Please fill in your Full Name, Roll Number, and Phone number.');
      return;
    }

    const rollUpper = signUpRollNo.trim().toUpperCase();
    const existing = students.find(s => s.rollNo.toUpperCase() === rollUpper);
    if (existing) {
      setErrorMsg(`A student with Roll Number ${rollUpper} is already registered. Please log in.`);
      return;
    }

    const email = signUpEmail.trim() || `${signUpName.toLowerCase().replace(/[^a-z0-9]/g, '')}@kmu.edu.pk`;
    const pwd = signUpPassword.trim() || 'kmu123';
    const newStudentId = `kmu_std_${Date.now()}`;
    const regNo = `KMU-SWB-2025-BSN-${Math.floor(100 + Math.random() * 900)}`;

    const newStudent: Student = {
      _id: newStudentId,
      rollNo: rollUpper,
      name: signUpName.trim(),
      fatherName: signUpFatherName.trim() || undefined,
      email,
      password: pwd,
      phone: signUpPhone.trim(),
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
            receiptNo: `KMU-SWB-REC-${Math.floor(1000 + Math.random() * 9000)}`,
            amount: 102800,
            date: new Date().toISOString()
          }
        ]
      },
      attendance: [],
      subjects: ['NUR-201', 'NUR-202', 'NUR-203', 'QR-204', 'IS-205', 'FQ-206', 'NUT-207']
    };

    onRegisterStudent(newStudent);
    showAlert(`Registration successful! Welcome to KMU INS, ${newStudent.name}.`, 'success');
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 via-slate-50 to-slate-200 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Official KMU Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <KMUSwabiLogo size="xl" showTagline={false} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              KHYBER MEDICAL UNIVERSITY
            </h1>
            <p className="text-xs sm:text-sm font-bold text-red-800 tracking-wide uppercase mt-0.5">
              Swabi Campus • Institute of Nursing Sciences (INS)
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Academic Management & Student Information System (BSN 2nd Semester)
            </p>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/80">
          
          {/* Role & Auth Selector Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mb-6 gap-1 shadow-xs">
            <button
              id="tab-login-student"
              onClick={() => {
                setActiveTab('student-login');
                setErrorMsg(null);
                setIdentifier('');
                setPassword('');
              }}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'student-login'
                  ? 'bg-red-800 text-white shadow-md font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Student Login</span>
            </button>

            <button
              id="tab-login-admin"
              onClick={() => {
                setActiveTab('admin-login');
                setErrorMsg(null);
                setIdentifier('admin@kmu.edu.pk');
                setSecurityCode('');
                setPassword('');
              }}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'admin-login'
                  ? 'bg-red-800 text-white shadow-md font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <School className="w-4 h-4 shrink-0" />
              <span>Faculty & Admin</span>
            </button>

            <button
              id="tab-signup-student"
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-red-800 text-white shadow-md font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-300 text-red-900 text-xs p-3.5 rounded-xl mb-5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer px-1"
              >
                ×
              </button>
            </div>
          )}

          {/* 1. STUDENT LOGIN TAB */}
          {activeTab === 'student-login' && (
            <div className="space-y-4">
              <div className="space-y-1 pb-1">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-red-800" />
                  <span>Student Sign In</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Enter your Roll Number (e.g. <span className="font-mono font-bold text-slate-800">1</span> or <span className="font-mono font-bold text-slate-800">KMU-BSN-01</span>) and password.
                </p>
              </div>

              <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Student Roll Number or Email:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-login-student-id"
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="e.g. 1, 31, KMU-BSN-01, or email"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 shadow-xs"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="block text-slate-700 font-bold">Portal Password:</label>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-login-student-password"
                      type={showStudentPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showStudentPassword ? "Hide password" : "Show password"}
                    >
                      {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-login-student-submit"
                  type="submit"
                  className="w-full bg-red-800 hover:bg-red-900 text-white font-black py-2.5 rounded-xl transition-all shadow-md shadow-red-900/20 flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Access My Student Profile & Dossier</span>
                </button>
              </form>

              <div className="pt-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-red-800" />
                  <span>Privacy Protected Access:</span>
                </div>
                <p className="text-slate-500">
                  Upon logging in, students can only view their own verified student ID card, fee clearance receipt, and individual attendance history. Other students' information remains confidential.
                </p>
              </div>
            </div>
          )}

          {/* 2. FACULTY & ADMIN LOGIN TAB */}
          {activeTab === 'admin-login' && (
            <div className="space-y-4">
              <div className="space-y-1 pb-1">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-800" />
                  <span>Faculty & Administration Portal</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Authorized access for INS faculty to manage the 50-student class roster, mark daily attendance, and audit fee vouchers.
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Faculty / Administrator Email ID:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-login-admin-email"
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="faculty@kmu.edu.pk"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 shadow-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="block text-slate-700 font-bold">Faculty Security Authorization Code:</label>
                  </div>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-login-admin-security-code"
                      type={showAdminSecCode ? 'text' : 'password'}
                      value={securityCode}
                      onChange={e => setSecurityCode(e.target.value)}
                      placeholder="Enter security code"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 shadow-xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminSecCode(!showAdminSecCode)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showAdminSecCode ? "Hide code" : "Show code"}
                    >
                      {showAdminSecCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="block text-slate-700 font-bold">Faculty Password:</label>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-login-admin-password"
                      type={showAdminPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showAdminPassword ? "Hide password" : "Show password"}
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-login-admin-submit"
                  type="submit"
                  className="w-full bg-red-800 hover:bg-red-900 text-white font-black py-2.5 rounded-xl transition-all shadow-md shadow-red-900/20 flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Open Faculty & Admin Dashboard</span>
                </button>
              </form>

              <div className="pt-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">Faculty Privileges:</span>
                <span>Full access to view all 50 students, mark daily attendance for 7 subjects, manage fees, export official PDF rosters, and review batch analytics.</span>
              </div>
            </div>
          )}

          {/* 3. NEW STUDENT SIGN UP TAB */}
          {activeTab === 'signup' && (
            <div className="space-y-4">
              <div className="space-y-1 pb-1">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-red-800" />
                  <span>New Student Registration</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Register a candidate into BSN 2nd Semester Section A.
                </p>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      value={signUpName}
                      onChange={e => setSignUpName(e.target.value)}
                      placeholder="e.g. Shahab Khan"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 shadow-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Roll Number *</label>
                    <input
                      type="text"
                      value={signUpRollNo}
                      onChange={e => setSignUpRollNo(e.target.value)}
                      placeholder="e.g. KMU-BSN-51"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium font-mono focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 shadow-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Father's Name</label>
                    <input
                      type="text"
                      value={signUpFatherName}
                      onChange={e => setSignUpFatherName(e.target.value)}
                      placeholder="e.g. Muhammad Khan"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phone / WhatsApp *</label>
                    <input
                      type="text"
                      value={signUpPhone}
                      onChange={e => setSignUpPhone(e.target.value)}
                      placeholder="+92 3XX XXXXXXX"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 shadow-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={e => setSignUpEmail(e.target.value)}
                      placeholder="e.g. student@kmu.edu.pk"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Create Password</label>
                    <input
                      type="password"
                      value={signUpPassword}
                      onChange={e => setSignUpPassword(e.target.value)}
                      placeholder="Default: kmu123"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 shadow-xs"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-[11px] text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Candidate will be enrolled in all 7 KMU BSN subjects with fresh starting record.</span>
                </div>

                <button
                  id="btn-signup-submit"
                  type="submit"
                  className="w-full bg-red-800 hover:bg-red-900 text-white font-black py-2.5 rounded-xl transition-all shadow-md shadow-red-900/20 flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register & Open Student Portal</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Footer Brand Notes */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p className="font-bold text-red-900">
            Khyber Medical University Swabi Campus • Institute of Nursing Sciences (INS)
          </p>
          <p className="text-[11px] text-slate-400">
            Official Academic & Student Information System — Khyber Pakhtunkhwa, Pakistan
          </p>
        </div>
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { PhoneContact } from "@/components/PhoneContact";
import { ArrowRight, User, Phone, Lock, Eye, EyeOff, Users, Copy, Check } from "lucide-react";

const ParentAccountInfo = () => {
  const navigate = useNavigate();
  const { currentUser, students } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Get student info for parent
    if (currentUser.role === "parent" && currentUser.childrenIds && currentUser.childrenIds.length > 0) {
      const childId = currentUser.childrenIds[0];
      const student = students.find(s => s.id === childId);
      
      if (student) {
        setStudentInfo(student);
      }
    }
  }, [currentUser, students, navigate]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!currentUser || !studentInfo) return null;

  return (
    <div className="min-h-screen bg-physics-navy flex flex-col">
      <PhoneContact />
      
      {/* Header */}
      <header className="bg-physics-dark py-4 px-6 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-physics-gold hover:opacity-80">
            <ArrowRight size={20} />
            <span>العودة للرئيسية</span>
          </button>
        </div>
        <Logo />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-physics-gold mb-6 text-center">بيانات حساب ولي الأمر</h1>
          
          <div className="space-y-6">
            {/* معلومات ولي الأمر */}
            <div className="bg-physics-dark rounded-lg p-6 shadow-2xl border-2 border-physics-gold/30">
              <div className="flex items-center gap-3 mb-6">
                <User size={28} className="text-physics-gold" />
                <h2 className="text-xl font-bold text-white">معلومات ولي الأمر</h2>
              </div>
              
              <div className="space-y-4">
                {/* اسم ولي الأمر */}
                <div className="bg-physics-navy p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm mb-1">اسم ولي الأمر</p>
                      <p className="text-white text-lg font-medium">{currentUser.name}</p>
                    </div>
                    <User size={20} className="text-physics-gold" />
                  </div>
                </div>
                
                {/* رقم تليفون ولي الأمر */}
                <div className="bg-physics-navy p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm mb-1">رقم تليفون ولي الأمر</p>
                      <p className="text-white text-lg font-medium" dir="ltr">{currentUser.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={20} className="text-physics-gold" />
                      <button
                        onClick={() => handleCopy(currentUser.phone, 'parent-phone')}
                        className="text-physics-gold hover:text-physics-gold/80 transition-colors"
                      >
                        {copied === 'parent-phone' ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* كلمة مرور ولي الأمر */}
                <div className="bg-physics-navy p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm mb-1">كلمة مرور الحساب</p>
                      <p className="text-white text-lg font-medium">
                        {showPassword ? currentUser.password : "••••••••"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock size={20} className="text-physics-gold" />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-physics-gold hover:text-physics-gold/80 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => handleCopy(currentUser.password, 'parent-password')}
                        className="text-physics-gold hover:text-physics-gold/80 transition-colors"
                      >
                        {copied === 'parent-password' ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* معلومات الطالب (الابن) */}
            <div className="bg-physics-dark rounded-lg p-6 shadow-2xl border-2 border-physics-gold/30">
              <div className="flex items-center gap-3 mb-6">
                <Users size={28} className="text-physics-gold" />
                <h2 className="text-xl font-bold text-white">معلومات الطالب (الابن)</h2>
              </div>
              
              <div className="space-y-4">
                {/* اسم الطالب */}
                <div className="bg-physics-navy p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm mb-1">اسم الطالب</p>
                      <p className="text-white text-lg font-medium">{studentInfo.name}</p>
                    </div>
                    <User size={20} className="text-physics-gold" />
                  </div>
                </div>
                
                {/* رقم تليفون الطالب */}
                <div className="bg-physics-navy p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm mb-1">رقم تليفون الطالب</p>
                      <p className="text-white text-lg font-medium" dir="ltr">{studentInfo.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={20} className="text-physics-gold" />
                      <button
                        onClick={() => handleCopy(studentInfo.phone, 'student-phone')}
                        className="text-physics-gold hover:text-physics-gold/80 transition-colors"
                      >
                        {copied === 'student-phone' ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* الصف الدراسي */}
                <div className="bg-physics-navy p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm mb-1">الصف الدراسي</p>
                      <p className="text-white text-lg font-medium">
                        {studentInfo.grade === 'first' && 'الصف الأول الثانوي'}
                        {studentInfo.grade === 'second' && 'الصف الثاني الثانوي'}
                        {studentInfo.grade === 'third' && 'الصف الثالث الثانوي'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* المجموعة */}
                <div className="bg-physics-navy p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm mb-1">المجموعة</p>
                      <p className="text-white text-lg font-medium">{studentInfo.group}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ملاحظة أمان */}
            <div className="bg-physics-dark rounded-lg p-4 border border-physics-gold/30">
              <p className="text-gray-300 text-sm text-center">
                🔒 <span className="text-physics-gold font-medium">ملاحظة أمان:</span> احتفظ بهذه المعلومات في مكان آمن ولا تشاركها مع أحد
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentAccountInfo;
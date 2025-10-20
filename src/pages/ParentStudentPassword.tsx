import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { PhoneContact } from "@/components/PhoneContact";
import { ArrowRight, Lock, Eye, EyeOff, Copy, Check } from "lucide-react";

const ParentStudentPassword = () => {
  const navigate = useNavigate();
  const { currentUser, students } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleCopyPassword = () => {
    if (studentInfo) {
      navigator.clipboard.writeText(studentInfo.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-physics-dark rounded-lg p-8 text-center shadow-2xl border-2 border-physics-gold/30">
            <Lock size={48} className="mx-auto mb-4 text-physics-gold" />
            <h1 className="text-2xl font-bold text-physics-gold mb-2">كلمة مرور الطالب</h1>
            <p className="text-white mb-6">كلمة مرور حساب: {studentInfo.name}</p>
            
            {/* Student Info */}
            <div className="bg-physics-navy p-4 rounded-lg mb-6 text-right">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">اسم الطالب</p>
                  <p className="text-white font-medium">{studentInfo.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">كود الطالب</p>
                  <p className="text-physics-gold font-medium">{studentInfo.code}</p>
                </div>
              </div>
            </div>
            
            {/* Password Display */}
            <div className="bg-physics-navy p-6 rounded-lg mb-4">
              <p className="text-gray-400 text-sm mb-2">كلمة المرور</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-bold text-physics-gold tracking-wider">
                  {showPassword ? studentInfo.password : "••••••••"}
                </p>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-physics-gold hover:text-physics-gold/80 transition-colors"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCopyPassword}
                className="flex items-center justify-center gap-2 w-full bg-physics-gold text-physics-navy py-3 px-6 rounded-lg hover:bg-physics-gold/90 transition-all font-medium"
              >
                {copied ? (
                  <>
                    <Check size={20} />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    <span>نسخ كلمة المرور</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center justify-center gap-2 w-full bg-physics-navy text-white py-3 px-6 rounded-lg hover:bg-physics-navy/80 transition-all font-medium border border-physics-gold/30"
              >
                {showPassword ? (
                  <>
                    <EyeOff size={20} />
                    <span>إخفاء كلمة المرور</span>
                  </>
                ) : (
                  <>
                    <Eye size={20} />
                    <span>إظهار كلمة المرور</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Info */}
            <div className="mt-6 text-sm text-gray-400">
              <p>🔒 احتفظ بكلمة المرور في مكان آمن</p>
              <p className="mt-2">💡 يمكن استخدامها لتسجيل الدخول إلى حساب الطالب</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentStudentPassword;
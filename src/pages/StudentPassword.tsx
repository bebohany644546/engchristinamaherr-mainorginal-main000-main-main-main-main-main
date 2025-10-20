import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { ArrowRight, Lock, Copy, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import PhysicsBackground from "@/components/PhysicsBackground";
import { PhoneContact } from "@/components/PhoneContact";

const StudentPassword = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  if (!currentUser || currentUser.role !== "student") {
    return (
      <div className="min-h-screen bg-physics-navy flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">غير مصرح لك بالوصول لهذه الصفحة</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(currentUser.password || '');
      toast({
        title: "✅ تم النسخ بنجاح",
        description: "تم نسخ كلمة المرور إلى الحافظة",
      });
    } catch (error) {
      console.error("Failed to copy password:", error);
      
      // Fallback method for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = currentUser.password || '';
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        toast({
          title: "✅ تم النسخ بنجاح",
          description: "تم نسخ كلمة المرور إلى الحافظة",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "❌ فشل النسخ",
          description: "حدث خطأ أثناء نسخ كلمة المرور. يرجى نسخها يدوياً",
        });
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="min-h-screen bg-physics-navy flex flex-col relative">
      <PhysicsBackground />
      <PhoneContact />

      {/* Header */}
      <header className="bg-physics-dark py-4 px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-physics-gold hover:opacity-80 transition-opacity"
          >
            <ArrowRight size={20} />
            <span>العودة للرئيسية</span>
          </button>
        </div>
        <Logo />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 relative z-10 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Student Info Card */}
          <div className="bg-physics-dark/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-physics-gold/30 shadow-2xl">
            {/* Header with Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-physics-gold/20 p-4 rounded-full">
                <Shield size={48} className="text-physics-gold" />
              </div>
            </div>

            {/* Student Name */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-physics-gold mb-2">
                {currentUser.name}
              </h1>
              <p className="text-white/70 text-lg">كلمة المرور الخاصة بك</p>
            </div>

            {/* Password Section */}
            <div className="space-y-4 mb-8">
              <label className="block text-white text-sm font-semibold mb-2">
                <Lock className="inline-block ml-2" size={16} />
                كلمة المرور:
              </label>
              
              <div className="flex gap-3">
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentUser.password || ''}
                  readOnly
                  className="flex-1 p-4 bg-physics-navy border-2 border-physics-gold/50 rounded-lg text-white font-mono text-xl text-center tracking-wider focus:outline-none focus:border-physics-gold transition-colors"
                />
                <Button
                  onClick={() => setShowPassword(!showPassword)}
                  className="bg-physics-gold/20 hover:bg-physics-gold/30 text-physics-gold border-2 border-physics-gold/50 px-6"
                >
                  {showPassword ? "🙈 إخفاء" : "👁️ إظهار"}
                </Button>
              </div>

              {/* Copy Button */}
              <Button
                onClick={handleCopyPassword}
                className="w-full bg-physics-gold hover:bg-physics-gold/90 text-physics-navy font-bold py-4 text-lg transition-all transform hover:scale-105"
              >
                <Copy className="ml-2" size={20} />
                نسخ كلمة المرور
              </Button>
            </div>

            {/* Warning Section */}
            <div className="bg-red-900/30 border-2 border-red-500/50 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="text-red-400 font-bold text-lg mb-3">
                    ⚠️ تحذير هام جداً
                  </h3>
                  <ul className="space-y-2 text-white/90 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>
                        <strong className="text-red-400">لا تشارك</strong> كلمة المرور الخاصة بك مع أي شخص آخر نهائياً
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>
                        كلمة المرور هي <strong className="text-red-400">مسؤوليتك الشخصية</strong> ويجب الحفاظ عليها سرية
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>
                        في حالة مشاركة كلمة المرور مع الآخرين سيتم <strong className="text-red-400">حذف حسابك نهائياً</strong> من النظام
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>
                        إذا شككت في أن أحداً يعرف كلمة المرور الخاصة بك، اتصل بالمعلم فوراً
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-physics-gold/10 border border-physics-gold/30 rounded-lg">
              <p className="text-white/80 text-sm text-center">
                💡 <strong>نصيحة:</strong> احفظ كلمة المرور في مكان آمن ولا تكتبها في أماكن عامة
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentPassword;
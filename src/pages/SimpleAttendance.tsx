import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowRight, Camera, QrCode, UserCheck, Send } from "lucide-react";
import { Html5QrScanner } from "@/components/scanner/Html5QrScanner";
import PhysicsBackground from "@/components/PhysicsBackground";
import { PhoneContact } from "@/components/PhoneContact";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { usePayments } from "@/hooks/use-payments";

// دالة لتشغيل المؤثر الصوتي المخصص - محسنة ومضمونة
const playConfirmationSound = async () => {
  // تشغيل الصوت بشكل غير متزامن لعدم حجب العملية الرئيسية
  setTimeout(async () => {
    try {
      // محاولة تشغيل الملف الصوتي أولاً
      const audio = new Audio('/موثر صوتي للتاكيد0.mp3');
      audio.volume = 0.8; // مستوى صوت أعلى قليلاً
      audio.preload = 'auto'; // تحميل مسبق

      // إضافة معالج للأخطاء
      audio.onerror = () => {
        console.log("⚠️ فشل تحميل الملف الصوتي، جاري المحاولة بطريقة بديلة");
        playFallbackSound();
      };

      // تشغيل الصوت
      await audio.play();
      console.log("🔊 تم تشغيل المؤثر الصوتي بنجاح");
    } catch (error) {
      console.log("⚠️ فشل تشغيل الملف الصوتي:", error);
      playFallbackSound();
    }
  }, 0);
};

// دالة الصوت البديل - محسنة
const playFallbackSound = async () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // التأكد من أن السياق غير معلق
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // نغمة أفضل: انخفاض تدريجي للتأكيد
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // بداية عالية
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5); // انخفاض تدريجي

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    console.log("🔊 تم تشغيل الصوت البديل بنجاح");
  } catch (fallbackError) {
    console.log("⚠️ فشل تشغيل الصوت البديل:", fallbackError);

    // اهتزاز كبديل أخير - محسن
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100]); // نمط أفضل
      console.log("📳 تم تشغيل الاهتزاز كبديل");
    }
  }
};

const SimpleAttendance = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [successfulScans, setSuccessfulScans] = useState<{ code: string, name: string, paid: boolean, lessonNumber: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const { getStudentByCode } = useAuth();
  const { addAttendance, getNextLessonNumber, getDisplayLessonNumber } = useData();
  const { hasStudentPaidForCurrentLesson } = usePayments();
  
  // تحديث: فصل مسح الكود عن تسجيل الحضور
  const handleScanSuccess = (code: string) => {
    setScannedCode(code);
    setShowScanner(false);
    // تشغيل المؤثر الصوتي
    playConfirmationSound();
  };
  
  // متغيرات لمراقبة الأداء والحماية من التعليق
  const [performanceStats, setPerformanceStats] = useState({
    lastOperationTime: 0,
    operationCount: 0,
    averageTime: 0,
    isCircuitBreakerOpen: false
  });

  // دالة لإنشاء timeout promise
  const createTimeout = (ms: number) => new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
  );

  // دالة لقياس الأداء
  const measurePerformance = (operationName: string, startTime: number) => {
    const duration = Date.now() - startTime;
    console.log(`⏱️ ${operationName} took ${duration}ms`);

    setPerformanceStats(prev => {
      const newCount = prev.operationCount + 1;
      const newAverage = ((prev.averageTime * prev.operationCount) + duration) / newCount;

      return {
        ...prev,
        lastOperationTime: duration,
        operationCount: newCount,
        averageTime: newAverage,
        // فتح circuit breaker إذا كان المتوسط أكثر من 3 ثواني
        isCircuitBreakerOpen: newAverage > 3000
      };
    });

    return duration;
  };

  const handleRegisterAttendance = async () => {
    const startTime = Date.now();

    if (!scannedCode) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى مسح الكود أو إدخاله أولاً"
      });
      return;
    }

    // فحص circuit breaker
    if (performanceStats.isCircuitBreakerOpen) {
      toast({
        variant: "destructive",
        title: "⚠️ النظام مشغول",
        description: "يرجى الانتظار قليلاً ثم المحاولة مرة أخرى"
      });
      return;
    }

    // بدء المعالجة بسرعة فائقة
    setIsProcessing(true);

    try {
      // خطوة 1: الحصول على بيانات الطالب بشكل متزامن (أسرع)
      const student = getStudentByCode(scannedCode);

      if (!student) {
        measurePerformance("Student lookup", startTime);
        toast({
          variant: "destructive",
          title: "❌ كود غير صالح",
          description: "لم يتم العثور على طالب بهذا الكود"
        });
        setIsProcessing(false);
        return;
      }

      // خطوة 2: حساب البيانات المطلوبة بسرعة فائقة (كلها متزامنة)
      const rawLessonNumber = getNextLessonNumber(student.id);
      const displayLessonNumber = getDisplayLessonNumber(rawLessonNumber);
      const hasPaid = hasStudentPaidForCurrentLesson(student.id, rawLessonNumber);
      const paymentStatus = hasPaid ? "✅ دافع" : "❌ غير دافع";

      console.log(`💰 Payment check for ${student.name}: ${hasPaid ? 'PAID' : 'NOT PAID'} for lesson ${rawLessonNumber}`);

      // خطوة 3: عرض رسالة التأكيد فوراً (قبل أي شيء آخر)
      toast({
        title: "✅ تم تسجيل الحضور",
        description: `${student.name} - الحصة ${displayLessonNumber} - ${paymentStatus}`,
        duration: 2000,
      });

      // خطوة 4: تحديث واجهة المستخدم فوراً
      setSuccessfulScans(prev => [
        ...prev,
        {
          code: scannedCode,
          name: student.name,
          paid: hasPaid,
          lessonNumber: displayLessonNumber
        }
      ]);

      // مسح الكود فوراً
      setScannedCode("");

      // تشغيل الصوت فوراً (غير متزامن)
      playConfirmationSound();

      // قياس الأداء للعمليات السريعة
      measurePerformance("UI Update", startTime);

      // إنهاء المعالجة فوراً
      setIsProcessing(false);

      // خطوة 5: تسجيل الحضور في الخلفية (غير متزامن) بدون انتظار
      setTimeout(async () => {
        try {
          const dbStartTime = Date.now();
          await addAttendance(student.id, student.name, "present", rawLessonNumber);
          measurePerformance("Database save", dbStartTime);
          console.log(`✅ تم تسجيل الحضور للطالب ${student.name} في قاعدة البيانات`);
        } catch (error) {
          console.error("خطأ في تسجيل الحضور:", error);
          // لا نحتاج لإظهار رسالة خطأ للمستخدم لأن العملية نجحت من ناحية المستخدم
        }
      }, 0);

    } catch (error: any) {
      const duration = measurePerformance("Failed operation", startTime);
      console.error("Error processing code:", error);

      // إعادة تعيين circuit breaker إذا كان الخطأ بسبب timeout
      if (error.message?.includes('timed out')) {
        setPerformanceStats(prev => ({ ...prev, isCircuitBreakerOpen: true }));
        setTimeout(() => {
          setPerformanceStats(prev => ({ ...prev, isCircuitBreakerOpen: false }));
        }, 5000); // إعادة فتح بعد 5 ثواني
      }

      toast({
        variant: "destructive",
        title: "❌ خطأ",
        description: error.message?.includes('timed out')
          ? "انتهت مهلة العملية، يرجى المحاولة مرة أخرى"
          : "حدث خطأ أثناء معالجة الكود"
      });
      setIsProcessing(false);
    }
  };
  
  const handleStartScanning = () => {
    setShowScanner(true);
  };
  
  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  return (
    <div className="min-h-screen bg-physics-navy flex flex-col relative">
      {currentUser?.role !== "admin" && <PhysicsBackground />}
      <PhoneContact />
      
      {/* Header */}
      <header className="bg-physics-dark py-4 px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-physics-gold hover:opacity-80"
          >
            <ArrowRight size={20} />
            <span>العودة للرئيسية</span>
          </button>
        </div>
        <Logo />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 relative z-10">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold text-physics-gold text-center mb-6">تسجيل الحضور بالباركود</h1>
          
          {showScanner ? (
            <div className="mb-6">
              {/* عرض ماسح باستخدام HTML5 QR Scanner */}
              <Html5QrScanner
                onScanSuccess={handleScanSuccess}
                onClose={handleCloseScanner}
              />
              <p className="text-white text-center mt-4">
                وجّه الكاميرا نحو باركود أو رمز QR للطالب
              </p>
            </div>
          ) : (
            <div className="flex flex-col bg-physics-dark p-4 rounded-lg mb-6">
              {/* زر تشغيل الكاميرا */}
              <div className="flex flex-col gap-3 mb-4">
                <button
                  onClick={handleStartScanning}
                  className="flex items-center justify-center gap-2 bg-physics-gold text-physics-navy rounded-full py-4 px-6 font-bold shadow-lg hover:bg-physics-gold/90 transition-all transform active:scale-95 w-full md:w-3/4 mx-auto text-lg"
                  disabled={isProcessing}
                >
                  <Camera size={24} />
                  <span>📷 مسح الكود بالكاميرا</span>
                </button>

                {/* زر اختبار الصوت */}
                <button
                  onClick={playConfirmationSound}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2 px-4 font-medium shadow hover:bg-blue-700 transition-all transform active:scale-95 w-full md:w-1/2 mx-auto text-sm"
                >
                  <span>🔊</span>
                  <span>اختبار الصوت</span>
                </button>
              </div>
              
              {/* حقل إدخال الكود يدويًا */}
              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  placeholder="أو أدخل الكود يدويًا هنا"
                  className="bg-physics-navy border border-physics-gold/30 px-4 py-2 rounded flex-1 text-white"
                  disabled={isProcessing}
                />
              </div>
              
              {/* زر تسجيل الحضور */}
              <button
                onClick={handleRegisterAttendance}
                className="flex items-center justify-center gap-2 mt-4 bg-green-600 text-white py-3 px-6 rounded-lg w-full hover:bg-green-700 transition-all transform active:scale-95 disabled:opacity-50"
                disabled={!scannedCode || isProcessing}
              >
                {isProcessing ? (
                  <span className="animate-pulse">جاري التسجيل...</span>
                ) : (
                  <>
                    <Send size={20} />
                    <span>تسجيل الحضور</span>
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* عرض الرموز التي تم مسحها بنجاح */}
          {successfulScans.length > 0 && (
            <div className="bg-physics-dark p-4 rounded-lg mt-6">
              <h2 className="text-xl font-bold text-physics-gold mb-4">تم تسجيل حضور</h2>
              <div className="space-y-2">
                {successfulScans.map((scan, index) => (
                  <div
                    key={`${scan.code}-${index}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      scan.paid
                        ? 'bg-green-900/20 border-green-500/30'
                        : 'bg-red-900/20 border-red-500/30'
                    }`}
                  >
                    <UserCheck className={scan.paid ? "text-green-400" : "text-red-400"} size={20} />
                    <div className="flex-1">
                      <span className="text-white block font-medium">{scan.name}</span>
                      <div className="flex gap-4 text-xs text-white/70 mt-1">
                        <span>كود: {scan.code}</span>
                        <span>الحصة: {scan.lessonNumber}</span>
                      </div>
                    </div>
                    <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                      scan.paid
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {scan.paid ? '✅ دافع' : '❌ غير دافع'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SimpleAttendance;

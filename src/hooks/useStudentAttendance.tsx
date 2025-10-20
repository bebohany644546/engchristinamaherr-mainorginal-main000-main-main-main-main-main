
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { usePayments } from "@/hooks/use-payments";
import { toast } from "@/hooks/use-toast";
import { Attendance } from "@/types"; // Import Attendance type

export function useStudentAttendance() {
  const [scannedCode, setScannedCode] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<{paid: boolean, studentName?: string} | null>(null);
  const [previousLessonAbsent, setPreviousLessonAbsent] = useState<boolean>(false); // New state for previous absence
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0); // For vibration handling
  
  const { getStudentByCode } = useAuth();
  const { addAttendance, getNextLessonNumber, getDisplayLessonNumber, getStudentAttendance } = useData(); // Added getStudentAttendance
  const { hasStudentPaidForCurrentLesson, getStudentPaymentStatus } = usePayments();

  const processScannedCode = async (code: string) => {
    const now = Date.now();
    if (now - lastScanTime < 500) { // Reduced debounce to 500ms for faster response
      return false;
    }
    setLastScanTime(now);

    setIsProcessing(true);

    // إعادة تعيين الحالات السابقة
    setPreviousLessonAbsent(false);
    setPaymentStatus(null);
    
    try {
      const student = await getStudentByCode(code);
      if (student) {
        // الحصول على رقم الحصة التالية باستخدام الدالة الموحدة
        const rawLessonCount = getNextLessonNumber(student.id);

        // حساب رقم الحصة للعرض (دائري من 1 إلى 8)
        const displayLessonCount = getDisplayLessonNumber(rawLessonCount);
        
        // تسجيل الحضور فوراً بدون انتظار (أولوية قصوى)
        const attendancePromise = addAttendance(student.id, student.name, "present", rawLessonCount);
        
        // تشغيل الصوت فوراً
        const audio = new Audio("/attendance-present.mp3");
        audio.play().catch(e => console.error("Sound play failed:", e));
        
        // عرض الإشعار فوراً
        toast({
          title: "✅ تم تسجيل الحضور",
          description: `${student.name} - الحصة ${displayLessonCount}`
        });
        
        // تنفيذ العمليات الأخرى في الخلفية (بدون انتظار) - optimized for speed
        Promise.all([
          attendancePromise,
          (async () => {
            // Fast payment status check without full refresh
            const hasPaid = await getStudentPaymentStatus(student.id, rawLessonCount);
            setPaymentStatus({
              paid: hasPaid,
              studentName: student.name
            });
          })(),
          (async () => {
            const previousLessonNumber = rawLessonCount > 1 ? rawLessonCount - 1 : 0;
            if (previousLessonNumber > 0) {
              try {
                const studentAllAttendance: Attendance[] = await getStudentAttendance(student.id);
                const wasAbsentPreviousLesson = studentAllAttendance.some(
                  (record) => record.lessonNumber === previousLessonNumber && record.status === "absent"
                );
                setPreviousLessonAbsent(wasAbsentPreviousLesson);
              } catch (error) {
                console.error("Error checking previous lesson:", error);
              }
            }
          })()
        ]).catch(error => {
          console.error("Background operations error:", error);
        });
        
        // Clear code field after successful processing
        setScannedCode("");
        setIsProcessing(false);
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "❌ كود غير صالح",
          description: "لم يتم العثور على طالب بهذا الكود"
        });
        setIsProcessing(false);
        return false;
      }
    } catch (error) {
      console.error("Error processing scanned code:", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      toast({
        variant: "destructive",
        title: "❌ خطأ في التسجيل",
        description: `تعذر تسجيل الحضور: ${errorMessage}`
      });
      setIsProcessing(false);
      return false;
    }
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCode || isProcessing) return;
    
    await processScannedCode(scannedCode);
  };

  return {
    scannedCode,
    setScannedCode,
    paymentStatus,
    isProcessing,
    setIsProcessing,
    processScannedCode,
    handleManualEntry,
    previousLessonAbsent // Return new state
  };
}

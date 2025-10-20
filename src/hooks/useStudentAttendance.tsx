
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { usePayments } from "@/hooks/use-payments";
import { toast } from "@/hooks/use-toast";
import { Attendance } from "@/types"; // Import Attendance type

export function useStudentAttendance() {
  const [scannedCode, setScannedCode] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<{paid: boolean, studentName?: string} | null>(null);
  const [previousLessonAbsent, setPreviousLessonAbsent] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [lastStudentId, setLastStudentId] = useState<string>("");
  
  const { getStudentByCode } = useAuth();
  const { addAttendance, getNextLessonNumber, getDisplayLessonNumber, getStudentAttendance } = useData();
  const { getStudentPaymentStatus } = usePayments();

  const processScannedCode = async (code: string) => {
    const now = Date.now();
    
    // منع التسجيل المتكرر - debounce قوي جداً
    if (isProcessing) {
      console.log("⏳ عملية تسجيل جارية، يرجى الانتظار");
      return false;
    }
    
    // منع نفس الطالب من التسجيل خلال 3 ثواني
    if (now - lastScanTime < 3000) {
      console.log("⏳ انتظر 3 ثواني قبل تسجيل حضور جديد");
      return false;
    }

    setIsProcessing(true);
    setLastScanTime(now);

    // إعادة تعيين الحالات السابقة
    setPreviousLessonAbsent(false);
    setPaymentStatus(null);
    
    try {
      const student = await getStudentByCode(code);
      if (!student) {
        toast({
          variant: "destructive",
          title: "❌ كود غير صالح",
          description: "لم يتم العثور على طالب بهذا الكود"
        });
        setIsProcessing(false);
        return false;
      }

      // منع نفس الطالب من التسجيل مرتين متتاليتين
      if (student.id === lastStudentId && now - lastScanTime < 10000) {
        console.log("⚠️ تم منع تسجيل متكرر لنفس الطالب");
        toast({
          variant: "destructive",
          title: "⚠️ تنبيه",
          description: `تم تسجيل حضور ${student.name} بالفعل منذ لحظات`
        });
        setIsProcessing(false);
        return false;
      }

      setLastStudentId(student.id);
      
      // الحصول على رقم الحصة التالية
      const rawLessonCount = getNextLessonNumber(student.id);
      const displayLessonCount = getDisplayLessonNumber(rawLessonCount);
      
      // تسجيل الحضور فوراً
      const attendanceResult = addAttendance(student.id, student.name, "present", rawLessonCount);
      
      // تشغيل الصوت فوراً
      const audio = new Audio("/attendance-present.mp3");
      audio.play().catch(e => console.error("Sound play failed:", e));
      
      // عرض الإشعار فوراً
      toast({
        title: "✅ تم تسجيل الحضور",
        description: `${student.name} - الحصة ${displayLessonCount}`
      });
      
      // فحص حالة الدفع بشكل فوري (مباشرة بدون await)
      getStudentPaymentStatus(student.id, rawLessonCount).then(hasPaid => {
        console.log(`💰 ${student.name}: ${hasPaid ? '✅ دافع' : '❌ غير دافع'}`);
        setPaymentStatus({
          paid: hasPaid,
          studentName: student.name
        });
      }).catch(error => {
        console.error("❌ خطأ في فحص الدفع:", error);
        setPaymentStatus({
          paid: false,
          studentName: student.name
        });
      });
      
      // فحص غياب الحصة السابقة (في الخلفية)
      const previousLessonNumber = rawLessonCount > 1 ? rawLessonCount - 1 : 0;
      if (previousLessonNumber > 0) {
        try {
          const studentAllAttendance = getStudentAttendance(student.id);
          const wasAbsentPreviousLesson = studentAllAttendance.some(
            (record) => record.lessonNumber === previousLessonNumber && record.status === "absent"
          );
          setPreviousLessonAbsent(wasAbsentPreviousLesson);
        } catch (error) {
          console.error("Error checking previous lesson:", error);
        }
      }
      
      // Clear code field after successful processing
      setScannedCode("");
      setIsProcessing(false);
      return true;
      
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
    previousLessonAbsent
  };
}

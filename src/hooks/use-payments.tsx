
import { useState, useEffect } from 'react';
import { Payment, PaidMonth } from '@/types';
import { turso, generateId, createTables } from "@/integrations/turso/client";
import { toast } from "@/hooks/use-toast";

// ثابت لعدد الحصص في الشهر الواحد
const LESSONS_PER_MONTH = 8;

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // مدة التخزين المؤقت (5 دقائق)
  const CACHE_DURATION = 5 * 60 * 1000;

  // تخزين مؤقت للمدفوعات حسب الطالب
  const [paymentCache, setPaymentCache] = useState<Map<string, { payments: Payment[], timestamp: number }>>(new Map());

  // Load data from Turso when hook initializes
  useEffect(() => {
    const initializePayments = async () => {
      try {
        // تحميل البيانات مباشرة (الجداول موجودة بالفعل)
        await fetchPayments();
      } catch (error) {
        console.error("Error initializing payments:", error);
        // في حالة فشل التحميل، جرب إنشاء الجداول ثم التحميل مرة أخرى
        try {
          console.log("Attempting to create tables and retry...");
          await createTables();
          await fetchPayments();
        } catch (retryError) {
          console.error("Retry failed:", retryError);
          toast({
            title: "خطأ في تهيئة المدفوعات",
            description: "تعذر تحميل بيانات المدفوعات",
            variant: "destructive"
          });
        }
      }
    };

    initializePayments();
  }, []);

  // تحميل المدفوعات من Turso بطريقة محسنة
  const fetchPayments = async (forceRefresh = false) => {
    try {
      // التحقق من التخزين المؤقت
      const now = Date.now();
      if (!forceRefresh && payments.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
        console.log("Using cached payments data");
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      setIsLoading(true);

      // استخدام JOIN لتحميل البيانات في استعلام واحد
      const result = await turso.execute(`
        SELECT
          p.id,
          p.student_id,
          p.student_name,
          p.student_code,
          p.student_group,
          p.month,
          p.date,
          p.amount,
          pm.month as paid_month,
          pm.date as paid_date
        FROM payments p
        LEFT JOIN paid_months pm ON p.id = pm.payment_id
        ORDER BY p.date DESC, pm.date DESC
      `);

      // تجميع البيانات حسب payment_id
      const paymentsMap = new Map<string, any>();

      result.rows.forEach((row: any) => {
        const paymentId = row.id;

        if (!paymentsMap.has(paymentId)) {
          paymentsMap.set(paymentId, {
            id: row.id,
            studentId: row.student_id,
            studentName: row.student_name,
            studentCode: row.student_code,
            group: row.student_group,
            month: row.month,
            date: row.date,
            amount: row.amount,
            paidMonths: []
          });
        }

        // إضافة الشهر المدفوع إذا كان موجوداً
        if (row.paid_month) {
          paymentsMap.get(paymentId).paidMonths.push({
            month: row.paid_month,
            date: row.paid_date
          });
        }
      });

      const processedPayments = Array.from(paymentsMap.values());
      setPayments(processedPayments);
      setLastFetchTime(Date.now());
      console.log("Loaded payments from Turso (optimized):", processedPayments.length);
    } catch (error) {
      console.error("Error loading payments from Turso:", error);
      // في حالة فشل الاستعلام المحسن، استخدم الطريقة القديمة
      await fetchPaymentsLegacy();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  // الطريقة القديمة كـ fallback
  const fetchPaymentsLegacy = async () => {
    try {
      console.log("Using legacy fetch method...");

      // First, fetch all payments
      const paymentsResult = await turso.execute("SELECT * FROM payments ORDER BY date DESC");

      // Then fetch all paid months
      const paidMonthsResult = await turso.execute("SELECT * FROM paid_months ORDER BY date DESC");

      // Map the database data to our app's data structure
      const processedPayments = paymentsResult.rows.map((payment: any) => {
        // Find all paid months for this payment
        const relatedPaidMonths = paidMonthsResult.rows
          .filter((pm: any) => pm.payment_id === payment.id)
          .map((pm: any) => ({
            month: pm.month,
            date: pm.date
          }));

        return {
          id: payment.id,
          studentId: payment.student_id,
          studentName: payment.student_name,
          studentCode: payment.student_code,
          group: payment.student_group,
          month: payment.month,
          date: payment.date,
          amount: payment.amount,
          paidMonths: relatedPaidMonths
        };
      });

      setPayments(processedPayments);
      console.log("Loaded payments using legacy method:", processedPayments.length);
    } catch (error) {
      console.error("Legacy fetch also failed:", error);
      throw error;
    }
  };

  // Add a new payment - create separate record per month for independent amounts
  const addPayment = async (
    studentId: string,
    studentName: string,
    studentCode: string,
    group: string,
    month: string,
    amount?: string
  ) => {
    try {
      const date = new Date().toISOString();
      const paidMonth: PaidMonth = {
        month,
        date
      };

      // Check if this specific month is already paid for the student
      const monthAlreadyPaidQuery = await turso.execute(
        "SELECT 1 FROM paid_months pm JOIN payments p ON pm.payment_id = p.id WHERE p.student_id = ? AND pm.month = ?",
        [studentId, month]
      );

      if (monthAlreadyPaidQuery.rows.length > 0) {
        return {
          success: false,
          message: `تم دفع شهر ${month} مسبقا للطالب ${studentName}`,
          payment: null
        };
      }

      // Always create a new payment record for this month
      const paymentId = generateId();
      
      await turso.execute({
        sql: `INSERT INTO payments (id, student_id, student_name, student_code,
              student_group, month, date, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [paymentId, studentId, studentName, studentCode, group, month, date, amount]
      });

      // Add the paid month (single for this payment)
      await turso.execute({
        sql: "INSERT INTO paid_months (id, payment_id, month, date) VALUES (?, ?, ?, ?)",
        args: [generateId(), paymentId, month, date]
      });

      // Create new payment object for local state
      const newPayment: Payment = {
        id: paymentId,
        studentId,
        studentName,
        studentCode,
        group,
        month,
        date,
        amount,
        paidMonths: [paidMonth]
      };

      // Update state
      setPayments(prevPayments => [...prevPayments, newPayment]);
      setLastFetchTime(Date.now()); // تحديث وقت آخر تحديث

      // تحديث التخزين المؤقت
      setPaymentCache(prev => {
        const newCache = new Map(prev);
        const studentPayments = [...(prev.get(studentId)?.payments || []), newPayment];
        newCache.set(studentId, { payments: studentPayments, timestamp: Date.now() });
        return newCache;
      });

      return {
        success: true,
        message: `تم تسجيل دفع شهر ${month} للطالب ${studentName}`,
        payment: newPayment
      };
    } catch (error: any) {
      console.error("Error in addPayment:", error);
      return {
        success: false,
        message: `حدث خطأ أثناء تسجيل الدفعة: ${error.message || 'خطأ غير معروف'}`,
        payment: null
      };
    }
  };

  // Delete a payment record
  const deletePayment = async (paymentId: string) => {
    try {
      console.log(`Starting deletion process for payment ID: ${paymentId}`);
      
      // First delete related paid_months
      await turso.execute({
        sql: "DELETE FROM paid_months WHERE payment_id = ?",
        args: [paymentId]
      });
      
      console.log("Successfully deleted related paid months, now deleting payment record");
      
      // Then delete the payment itself
      await turso.execute({
        sql: "DELETE FROM payments WHERE id = ?",
        args: [paymentId]
      });

      // After successful deletion from database, update local state immediately
      setPayments(prevPayments => {
        const updatedPayments = prevPayments.filter(payment => payment.id !== paymentId);
        console.log(`Payments before deletion: ${prevPayments.length}, after deletion: ${updatedPayments.length}`);
        return updatedPayments;
      });
      
      console.log("Payment deleted successfully, state updated");
      setLastFetchTime(Date.now()); // تحديث وقت آخر تحديث

      return {
        success: true,
        message: "تم حذف سجل الدفع بنجاح"
      };
    } catch (error: any) {
      console.error("Error in deletePayment:", error);
      return {
        success: false,
        message: `حدث خطأ أثناء حذف سجل الدفع: ${error.message || 'خطأ غير معروف'}`
      };
    }
  };

  // Get all payment records
  const getAllPayments = () => {
    return payments;
  };

  // Get payment records for a specific student - per-month payments
  const getStudentPayments = (studentId: string) => {
    const now = Date.now();
    const cached = paymentCache.get(studentId);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`✅ تم العثور على المدفوعات للطالب ${studentId} في التخزين المؤقت`);
      return cached.payments;
    }

    const filteredPayments = payments.filter(payment => payment.studentId === studentId);

    setPaymentCache(prev => new Map(prev.set(studentId, { payments: filteredPayments, timestamp: now })));

    return filteredPayments;
  };
  
  // Check if a student has paid for current lesson
  const hasStudentPaidForCurrentLesson = (studentId: string, lessonNumber: number) => {
    // إجبار تحديث البيانات للتأكد من أحدث المدفوعات
    const studentPayments = getStudentPayments(studentId);
    if (studentPayments.length === 0) {
      console.log(`Student ${studentId} - No payments found`);
      return false;
    }
    
    // حساب الشهر الحالي بناءً على النظام الدائري المحسن
    // الحصص 1-8 = الشهر 1، الحصص 9-16 = الشهر 2، إلخ
    // استخدام Math.ceil يضمن أن الحصة 8 تبقى في الشهر 1، والحصة 9 تبدأ الشهر 2
    const currentMonth = Math.ceil(lessonNumber / LESSONS_PER_MONTH);
    
    // البحث عن أي دفعة تحتوي على الشهر المطلوب
    const hasPaidForCurrentMonth = studentPayments.some(payment => 
      payment.paidMonths.some(paidMonth => {
        let paidMonthNumber = 0;
        
        // إذا كان الشهر المدفوع رقماً مباشرة
        if (!isNaN(Number(paidMonth.month))) {
          paidMonthNumber = Number(paidMonth.month);
        }
        // إذا كان الشهر بصيغة "الشهر 1" أو "شهر 1"
        else {
          const monthPatterns = [
            /الشهر\s*الأول/i,
            /الشهر\s*الثاني/i,
            /الشهر\s*الثالث/i,
            /الشهر\s*الرابع/i,
            /الشهر\s*الخامس/i,
            /الشهر\s*السادس/i,
            /الشهر\s*السابع/i,
            /الشهر\s*الثامن/i,
            /الشهر\s*التاسع/i,
            /الشهر\s*العاشر/i,
            /الشهر\s*الحادي عشر/i,
            /الشهر\s*الثاني عشر/i,
            /الشهر\s*(\d+)/i,
            /شهر\s*(\d+)/i,
            /(\d+)/
          ];
          
          // التعامل مع الأشهر بالكلمات العربية
          const arabicMonths = {
            'الأول': 1, 'الثاني': 2, 'الثالث': 3, 'الرابع': 4,
            'الخامس': 5, 'السادس': 6, 'السابع': 7, 'الثامن': 8,
            'التاسع': 9, 'العاشر': 10, 'الحادي عشر': 11, 'الثاني عشر': 12
          };
          
          // البحث في الكلمات العربية أولاً
          for (const [arabicMonth, monthNum] of Object.entries(arabicMonths)) {
            if (paidMonth.month.includes(arabicMonth)) {
              paidMonthNumber = monthNum;
              break;
            }
          }
          
          // إذا لم نجد، نبحث في الأرقام
          if (paidMonthNumber === 0) {
            for (const pattern of monthPatterns) {
              const match = paidMonth.month.match(pattern);
              if (match && match[1]) {
                paidMonthNumber = Number(match[1]);
                break;
              }
            }
          }
        }
        
        const isPaid = paidMonthNumber === currentMonth;
        
        console.log(`Payment Check: "${paidMonth.month}" -> Month ${paidMonthNumber} vs Required Month ${currentMonth} = ${isPaid}`);
        
        return isPaid;
      })
    );
    
    console.log(`Student ${studentId} Payment Status:`, {
      rawLessonNumber: lessonNumber,
      requiredMonth: currentMonth,
      hasPaid: hasPaidForCurrentMonth,
      explanation: `Lesson ${lessonNumber} requires payment for Month ${currentMonth}`,
      studentPayments: studentPayments.map(p => ({
        id: p.id,
        paidMonths: p.paidMonths.map(pm => `"${pm.month}"`)
      }))
    });
    
    return hasPaidForCurrentMonth;
  };

  // تحديد الشهر الحالي للطالب بناءً على رقم الحصة - محسن ودقيق
  const getCurrentMonthByLessonNumber = (lessonNumber: number) => {
    // التأكد من أن رقم الحصة صحيح
    if (lessonNumber <= 0) return 1;
    
    // حساب الشهر بدقة:
    // الحصص 1-8 = الشهر 1
    // الحصص 9-16 = الشهر 2
    // الحصص 17-24 = الشهر 3
    // وهكذا...
    const month = Math.ceil(lessonNumber / LESSONS_PER_MONTH);
    
    console.log(`Lesson ${lessonNumber} belongs to Month ${month} (${LESSONS_PER_MONTH} lessons per month)`);
    
    return month;
  };

  // حساب الحصة الأولى في الشهر الحالي
  const getFirstLessonInCurrentMonth = (lessonNumber: number) => {
    const currentMonth = getCurrentMonthByLessonNumber(lessonNumber);
    return ((currentMonth - 1) * LESSONS_PER_MONTH) + 1;
  };

  // حساب الحصة الأخيرة في الشهر الحالي
  const getLastLessonInCurrentMonth = (lessonNumber: number) => {
    const currentMonth = getCurrentMonthByLessonNumber(lessonNumber);
    return currentMonth * LESSONS_PER_MONTH;
  };

  // Debug function to check hook state
  const debugPaymentsState = () => {
    console.log("Current payments state:", payments);
    return {
      stateCount: payments.length,
      supabaseIntegrated: true,
      lessonsPerMonth: LESSONS_PER_MONTH
    };
  };

  // تحديث البيانات يدوياً
  const refreshPayments = async () => {
    console.log("Manual refresh requested - forcing refresh");
    return await fetchPayments(true); // force refresh
  };

  // Fast payment status check for a single student - optimized for attendance scanning
  const getStudentPaymentStatus = async (studentId: string, lessonNumber: number) => {
    try {
      console.log(`Fast payment check for student ${studentId}, lesson ${lessonNumber}`);
      
      // Calculate required month
      const currentMonth = Math.ceil(lessonNumber / LESSONS_PER_MONTH);
      console.log(`Required month for lesson ${lessonNumber}: ${currentMonth}`);
      
      // Query only this student's payments (fast, targeted query)
      const paymentsResult = await turso.execute(
        "SELECT * FROM payments WHERE student_id = ? ORDER BY date DESC",
        [studentId]
      );
      
      if (paymentsResult.rows.length === 0) {
        console.log(`No payments found for student ${studentId}`);
        return false;
      }
      
      // Query only related paid months for these payments
      const paymentIds = paymentsResult.rows.map((p: any) => p.id);
      const paidMonthsResult = await turso.execute(
        `SELECT * FROM paid_months WHERE payment_id IN (${paymentIds.map(() => '?').join(',')}) ORDER BY date DESC`,
        paymentIds
      );
      
      // Group paid months by payment
      const studentPayments = paymentsResult.rows.map((payment: any) => {
        const relatedPaidMonths = paidMonthsResult.rows
          .filter((pm: any) => pm.payment_id === payment.id)
          .map((pm: any) => ({
            month: pm.month,
            date: pm.date
          }));
        
        return {
          ...payment,
          paidMonths: relatedPaidMonths
        };
      });
      
      console.log(`Found ${studentPayments.length} payments for student ${studentId}`);
      
      // Check if any payment covers the current month
      const hasPaidForCurrentMonth = studentPayments.some(payment =>
        payment.paidMonths.some(paidMonth => {
          let paidMonthNumber = 0;
          
          // Parse month number (same logic as before for accuracy)
          if (!isNaN(Number(paidMonth.month))) {
            paidMonthNumber = Number(paidMonth.month);
          } else {
            const monthPatterns = [
              /الشهر\s*الأول/i, /الشهر\s*الثاني/i, /الشهر\s*الثالث/i, /الشهر\s*الرابع/i,
              /الشهر\s*الخامس/i, /الشهر\s*السادس/i, /الشهر\s*السابع/i, /الشهر\s*الثامن/i,
              /الشهر\s*التاسع/i, /الشهر\s*العاشر/i, /الشهر\s*الحادي عشر/i, /الشهر\s*الثاني عشر/i,
              /الشهر\s*(\d+)/i, /شهر\s*(\d+)/i, /(\d+)/
            ];
            
            const arabicMonths = {
              'الأول': 1, 'الثاني': 2, 'الثالث': 3, 'الرابع': 4,
              'الخامس': 5, 'السادس': 6, 'السابع': 7, 'الثامن': 8,
              'التاسع': 9, 'العاشر': 10, 'الحادي عشر': 11, 'الثاني عشر': 12
            };
            
            for (const [arabicMonth, monthNum] of Object.entries(arabicMonths)) {
              if (paidMonth.month.includes(arabicMonth)) {
                paidMonthNumber = monthNum;
                break;
              }
            }
            
            if (paidMonthNumber === 0) {
              for (const pattern of monthPatterns) {
                const match = paidMonth.month.match(pattern);
                if (match && match[1]) {
                  paidMonthNumber = Number(match[1]);
                  break;
                }
              }
            }
          }
          
          const isPaid = paidMonthNumber === currentMonth;
          console.log(`Checking paid month "${paidMonth.month}" (parsed: ${paidMonthNumber}) against required ${currentMonth}: ${isPaid}`);
          
          return isPaid;
        })
      );
      
      console.log(`Final payment status for student ${studentId}: ${hasPaidForCurrentMonth ? 'دافع' : 'غير دافع'}`);
      return hasPaidForCurrentMonth;
      
    } catch (error) {
      console.error(`Error in fast payment check for student ${studentId}:`, error);
      // Fallback to false on error to avoid blocking attendance
      return false;
    }
  };

  // Update payment
  const updatePayment = async (paymentId: string, updatedData: Partial<Payment>) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) {
        return {
          success: false,
          message: "الدفعة غير موجودة"
        };
      }

      // Update in Turso database
      await turso.execute({
        sql: "UPDATE payments SET student_name = ?, student_code = ?, student_group = ?, month = ?, date = ?, amount = ? WHERE id = ?",
        args: [
          updatedData.studentName || payment.studentName,
          updatedData.studentCode || payment.studentCode,
          updatedData.group || payment.group,
          updatedData.month || payment.month,
          updatedData.date || payment.date,
          updatedData.amount || payment.amount,
          paymentId
        ]
      });

      // إذا تم تغيير الشهر، نحتاج لتحديث جدول paid_months أيضاً
      if (updatedData.month && updatedData.month !== payment.month) {
        // حذف الشهر القديم
        await turso.execute({
          sql: "DELETE FROM paid_months WHERE payment_id = ? AND month = ?",
          args: [paymentId, payment.month]
        });

        // إضافة الشهر الجديد
        await turso.execute({
          sql: "INSERT INTO paid_months (id, payment_id, month, date) VALUES (?, ?, ?, ?)",
          args: [generateId(), paymentId, updatedData.month, updatedData.date || payment.date]
        });
      }

      // تحديث الحالة المحلية
      const updatedPayment = { ...payment, ...updatedData };

      // إذا تم تغيير الشهر، نحتاج لتحديث paidMonths أيضاً
      if (updatedData.month && updatedData.month !== payment.month) {
        updatedPayment.paidMonths = payment.paidMonths.map(pm =>
          pm.month === payment.month
            ? { ...pm, month: updatedData.month!, date: updatedData.date || payment.date }
            : pm
        );
      }

      setPayments(prevPayments =>
        prevPayments.map(p =>
          p.id === paymentId ? updatedPayment : p
        )
      );

      setLastFetchTime(Date.now()); // تحديث وقت آخر تحديث

      return {
        success: true,
        message: "تم تحديث الدفعة بنجاح",
        payment: updatedPayment
      };
    } catch (error: any) {
      console.error("Error updating payment:", error);
      return {
        success: false,
        message: `حدث خطأ أثناء تحديث الدفعة: ${error.message || 'خطأ غير معروف'}`
      };
    }
  };

  // Delete all payments for a student
  const deleteAllStudentPayments = async (studentId: string) => {
    try {
      const studentPayments = getStudentPayments(studentId);
      if (studentPayments.length === 0) {
        return {
          success: false,
          message: "لا توجد مدفوعات لهذا الطالب"
        };
      }

      console.log(`Deleting all ${studentPayments.length} payments for student ${studentId}`);

      // Delete each payment
      for (const payment of studentPayments) {
        // First delete related paid_months
        await turso.execute({
          sql: "DELETE FROM paid_months WHERE payment_id = ?",
          args: [payment.id]
        });
        
        // Then delete the payment
        await turso.execute({
          sql: "DELETE FROM payments WHERE id = ?",
          args: [payment.id]
        });
      }

      // Update local state
      setPayments(prevPayments => prevPayments.filter(p => p.studentId !== studentId));

      // Update cache
      setPaymentCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(studentId);
        return newCache;
      });

      setLastFetchTime(Date.now());

      return {
        success: true,
        message: `تم حذف جميع مدفوعات الطالب (${studentPayments.length} دفعة)`
      };
    } catch (error: any) {
      console.error("Error in deleteAllStudentPayments:", error);
      return {
        success: false,
        message: `حدث خطأ أثناء حذف مدفوعات الطالب: ${error.message || 'خطأ غير معروف'}`
      };
    }
  };

  return {
    payments,
    isLoading,
    addPayment,
    deletePayment,
    deleteAllStudentPayments,
    updatePayment,
    getAllPayments,
    getStudentPayments,
    hasStudentPaidForCurrentLesson,
    getStudentPaymentStatus, // New fast method
    getCurrentMonthByLessonNumber,
    getFirstLessonInCurrentMonth,
    getLastLessonInCurrentMonth,
    debugPaymentsState,
    refreshPayments
  };
}

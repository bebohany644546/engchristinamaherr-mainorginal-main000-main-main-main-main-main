
import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PaymentStatusDisplayProps {
  paymentStatus: {
    paid: boolean;
    studentName?: string;
  } | null;
  previousLessonAbsent: boolean; // New prop for previous absence status
}

export function PaymentStatusDisplay({ paymentStatus, previousLessonAbsent }: PaymentStatusDisplayProps) {
  const [showPreviousAbsenceDialog, setShowPreviousAbsenceDialog] = useState(false);

  useEffect(() => {
    if (previousLessonAbsent && paymentStatus) {
      setShowPreviousAbsenceDialog(true);
      const timer = setTimeout(() => {
        setShowPreviousAbsenceDialog(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [previousLessonAbsent, paymentStatus]);

  if (!paymentStatus) return null;
  
  return (
    <>
      <div className="mt-4">
        <div className={`p-3 rounded-lg text-center ${paymentStatus.paid ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          <div className="flex items-center justify-center gap-2">
            {paymentStatus.paid ? (
              <CheckCircle2 className="text-green-400" size={20} />
            ) : (
              <AlertCircle className="text-red-400" size={20} />
            )}
            <p className="text-white font-bold">
              {paymentStatus.studentName}
            </p>
          </div>
          <p className="text-sm text-white mt-1">
            {paymentStatus.paid 
              ? 'الطالب مدفوع الاشتراك للدرس الحالي' 
              : 'الطالب غير مدفوع الاشتراك للدرس الحالي - يرجى التنبيه'}
          </p>
        </div>
      </div>

      <AlertDialog open={showPreviousAbsenceDialog} onOpenChange={setShowPreviousAbsenceDialog}>
        <AlertDialogContent className="sm:max-w-md bg-physics-dark text-white border-2 border-yellow-400 max-w-sm">
          <AlertDialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <span className="text-2xl animate-bounce">⚠️</span>
              <span className="text-2xl animate-bounce" style={{animationDelay: '0.1s'}}>⚠️</span>
              <span className="text-2xl animate-bounce" style={{animationDelay: '0.2s'}}>⚠️</span>
            </div>
            <AlertDialogTitle className="text-yellow-200 text-xl font-bold">
              🚨 تحذير هام 🚨
            </AlertDialogTitle>
            <AlertDialogDescription className="text-yellow-100 text-lg">
              الطالب {paymentStatus.studentName} كان غائب الحصة السابقة!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogDescription className="text-yellow-200 text-sm mb-4 text-center">
            يرجى التنبيه والمتابعة مع الطالب
          </AlertDialogDescription>
          <AlertDialogFooter className="justify-center">
            <AlertDialogAction onClick={() => setShowPreviousAbsenceDialog(false)} className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
              تخطى الآن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

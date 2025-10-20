import { useState, useEffect } from "react";
import { X, Calendar, DollarSign } from "lucide-react";
import { Payment } from "@/types";
import { usePayments } from "@/hooks/use-payments";

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export function PaymentHistoryModal({ isOpen, onClose, studentId, studentName }: PaymentHistoryModalProps) {
  const { getStudentPayments, refreshPayments } = usePayments();
  const [studentPayments, setStudentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (isOpen && studentId) {
      const payments = getStudentPayments(studentId);
      setStudentPayments(payments);

      // Force refresh if no payments loaded to fix empty modal
      if (payments.length === 0) {
        const timer = setTimeout(() => {
          refreshPayments();
        }, 200);
        return () => clearTimeout(timer);
      } else {
        // Also refresh to ensure latest for existing
        refreshPayments();
      }
    }
  }, [isOpen, studentId, getStudentPayments, refreshPayments]);

  if (!isOpen) return null;

  // Create a map of month to payment details - unique per month from its payment
  const monthPaymentMap = new Map<string, { date: string; amount: string }>();

  studentPayments.forEach(payment => {
    payment.paidMonths.forEach(paidMonth => {
      monthPaymentMap.set(paidMonth.month, {
        date: paidMonth.date,
        amount: payment.amount || "غير محدد"
      });
    });
  });

  // 12 months array
  const months = [
    "الشهر الأول",
    "الشهر الثاني",
    "الشهر الثالث",
    "الشهر الرابع",
    "الشهر الخامس",
    "الشهر السادس",
    "الشهر السابع",
    "الشهر الثامن",
    "الشهر التاسع",
    "الشهر العاشر",
    "الشهر الحادي عشر",
    "الشهر الثاني عشر"
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-physics-dark rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-physics-gold">سجل المدفوعات - {studentName}</h2>
          <button onClick={onClose} className="text-white hover:text-physics-gold">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-physics-navy/50 text-physics-gold">
                <th className="text-right py-3 px-4">الشهر</th>
                <th className="text-right py-3 px-4">تاريخ الدفع</th>
                <th className="text-right py-3 px-4">قيمة المبلغ</th>
                <th className="text-center py-3 px-4">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month, index) => {
                const payment = monthPaymentMap.get(month);
                const isPaid = !!payment;

                return (
                  <tr key={index} className={`border-t border-physics-navy hover:bg-physics-navy/30 ${isPaid ? 'bg-green-900/20' : ''}`}>
                    <td className="py-3 px-4 text-white font-medium">{month}</td>
                    <td className="py-3 px-4 text-white">
                      {isPaid ? (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-physics-gold" />
                          <span>{formatDate(payment.date)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {isPaid ? (
                        <div className="flex items-center gap-1">
                          <DollarSign size={14} className="text-physics-gold" />
                          <span className="text-physics-gold font-bold">
                            {payment.amount} جنيه
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isPaid ? (
                        <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                          مدفوع
                        </span>
                      ) : (
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                          غير مدفوع
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-physics-navy text-white py-2 px-6 rounded-lg hover:bg-physics-navy/80 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

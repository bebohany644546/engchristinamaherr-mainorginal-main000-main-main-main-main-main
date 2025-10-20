
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { PhoneContact } from "@/components/PhoneContact";
import { ArrowRight, DollarSign, RefreshCw, FileText, Calendar } from "lucide-react";
import { usePayments } from "@/hooks/use-payments";
import { Payment } from "@/types";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const StudentPaymentsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { payments, refreshPayments } = usePayments();
  const [studentPayments, setStudentPayments] = useState<Payment[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Filter payments relevant to the student
    if (currentUser.role === "student") {
      const filteredPayments = payments.filter(payment => payment.studentId === currentUser.id);
      setStudentPayments(filteredPayments);
    }
  }, [currentUser, payments, navigate]);
  
  // وظيفة تحديث البيانات
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshPayments();
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات المدفوعات بنجاح"
      });
    } catch (error) {
      console.error("Error refreshing payments:", error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!currentUser) return null;

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
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-physics-gold">سجل المدفوعات الخاص بي</h1>
            
            {/* زر تحديث البيانات */}
            <button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="flex items-center gap-2 text-white bg-physics-navy hover:bg-physics-navy/80 px-4 py-2 rounded disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              <span>{isRefreshing ? "جاري التحديث..." : "تحديث البيانات"}</span>
            </button>
          </div>
          
          {studentPayments.length === 0 ? (
            <div className="bg-physics-dark rounded-lg p-8 text-center">
              <DollarSign size={48} className="mx-auto mb-4 text-physics-gold opacity-50" />
              <p className="text-white text-lg">لا توجد مدفوعات مسجلة</p>
            </div>
          ) : (
            <div className="bg-physics-dark rounded-lg overflow-hidden">
              {studentPayments.map(payment => (
                <div key={payment.id} className="p-6 border-b border-physics-navy last:border-0">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">{payment.studentName}</h3>
                      <div className="text-sm text-gray-300">
                        كود الطالب: {payment.studentCode} | المجموعة: {payment.group}
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowPaymentDialog(true);
                        }}
                        className="flex items-center gap-2 bg-physics-gold text-physics-navy px-4 py-2 rounded-lg hover:bg-physics-gold/90 transition-all font-medium"
                      >
                        <FileText size={18} />
                        <span>سجل المدفوعات</span>
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-2">الأشهر المدفوعة:</p>
                    <div className="flex flex-wrap gap-2">
                      {payment.paidMonths.map((month, index) => (
                        <span 
                          key={index} 
                          className="bg-physics-navy px-3 py-1 rounded-full text-sm text-white"
                          title={`تاريخ الدفع: ${new Date(month.date).toLocaleDateString('ar-EG')}`}
                        >
                          {month.month}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Dialog لعرض سجل المدفوعات الكامل */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-physics-dark border-physics-gold/30 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-physics-gold text-xl">
              📋 سجل المدفوعات الكامل
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              {/* معلومات الطالب */}
              <div className="bg-physics-navy p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-2">{selectedPayment.studentName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                  <div>كود الطالب: <span className="text-physics-gold">{selectedPayment.studentCode}</span></div>
                  <div>المجموعة: <span className="text-physics-gold">{selectedPayment.group}</span></div>
                </div>
              </div>

              {/* جدول المدفوعات */}
              <div className="border border-physics-gold/30 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-physics-navy hover:bg-physics-navy">
                      <TableHead className="text-physics-gold text-right">#</TableHead>
                      <TableHead className="text-physics-gold text-right">الشهر المدفوع</TableHead>
                      <TableHead className="text-physics-gold text-right">تاريخ الدفع</TableHead>
                      <TableHead className="text-physics-gold text-right">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPayment.paidMonths.map((month, index) => (
                      <TableRow key={index} className="border-physics-gold/20 hover:bg-physics-navy/50">
                        <TableCell className="text-white font-medium">{index + 1}</TableCell>
                        <TableCell className="text-white">{month.month}</TableCell>
                        <TableCell className="text-white">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-physics-gold" />
                            {new Date(month.date).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-white">
                          {selectedPayment.amount ? `${selectedPayment.amount} جنيه` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* إحصائيات */}
              <div className="bg-physics-navy p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-physics-gold">{selectedPayment.paidMonths.length}</div>
                    <div className="text-sm text-gray-300">إجمالي الأشهر المدفوعة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-physics-gold">
                      {new Date(selectedPayment.date).toLocaleDateString('ar-EG')}
                    </div>
                    <div className="text-sm text-gray-300">آخر دفعة</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentPaymentsPage;

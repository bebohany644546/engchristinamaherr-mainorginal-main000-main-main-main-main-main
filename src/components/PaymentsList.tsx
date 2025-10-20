
import { useState, useMemo } from "react";
import { Calendar, Search, DollarSign, Edit, Trash2, History } from "lucide-react";
import { Payment } from "@/types";
import { sanitizeSearchText, getGradeDisplay } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { PaymentHistoryModal } from "./PaymentHistoryModal";
import { useAuth } from "@/context/AuthContext";

interface PaymentsListProps {
  payments: Payment[];
  onEditPayment?: (payment: Payment) => void;
  onDeletePayment?: (paymentId: string) => void;
  onDeleteAllStudentPayments?: (studentId: string) => void;
}

export function PaymentsList({ payments, onEditPayment, onDeletePayment, onDeleteAllStudentPayments }: PaymentsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"name" | "code" | "group">("name");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<{ id: string; name: string } | null>(null);

  const { getAllStudents } = useAuth();

  const studentGradeMap = useMemo(() => {
    const students = getAllStudents();
    return new Map(students.map(s => [s.id, getGradeDisplay(s.grade)]));
  }, [getAllStudents]);

    const groupedPayments = useMemo(() => {
      const map = new Map<string, any>();

      payments.forEach(p => {
        if (!map.has(p.studentId)) {
          map.set(p.studentId, {
            studentId: p.studentId,
            name: p.studentName,
            code: p.studentCode,
            group: p.group,
            grade: studentGradeMap.get(p.studentId) || "غير محدد",
            payments: [],
            totalAmount: 0,
            lastPaymentDate: ''
          });
        }
        const group = map.get(p.studentId);
        group.payments.push(p);
        const amt = parseFloat(p.amount || '0') || 0;
        group.totalAmount += amt;
        const dateTime = new Date(p.date).getTime();
        if (!group.lastPaymentDate || dateTime > new Date(group.lastPaymentDate).getTime()) {
          group.lastPaymentDate = p.date;
        }
      });

      return Array.from(map.values());
    }, [payments, studentGradeMap]);



  // معالج تعديل الدفعة
  const handleEdit = (payment: Payment) => {
    if (onEditPayment) {
      onEditPayment(payment);
    }
  };

  // معالج فتح نافذة سجل التواريخ
  const handleShowHistory = (student: { id: string; name: string }) => {
    setSelectedStudentForHistory(student);
    setShowHistoryModal(true);
  };

  // معالج حذف الدفعة
  const handleDelete = (paymentId: string) => {
    if (onDeletePayment) {
      if (window.confirm("هل أنت متأكد من حذف هذه الدفعة نهائياً؟")) {
        onDeletePayment(paymentId);
        toast({
          title: "✅ تم الحذف",
          description: "تم حذف الدفعة بنجاح",
        });
      }
    }
  };

  // معالج حذف جميع مدفوعات الطالب
  const handleDeleteAll = (studentId: string) => {
    if (onDeleteAllStudentPayments) {
      if (window.confirm("هل أنت متأكد من حذف جميع مدفوعات هذا الطالب نهائياً؟")) {
        onDeleteAllStudentPayments(studentId);
        toast({
          title: "✅ تم الحذف",
          description: "تم حذف جميع مدفوعات الطالب بنجاح",
        });
      }
    }
  };
  
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // تصفية المجموعات حسب البحث
  const filteredGroups = groupedPayments.filter(group => {
    const query = sanitizeSearchText(searchQuery);
    if (!query) return true;
    
    switch (searchField) {
      case "name":
        return sanitizeSearchText(group.name).includes(query);
      case "code":
        return sanitizeSearchText(group.code).includes(query);
      case "group":
        return sanitizeSearchText(group.group).includes(query);
      default:
        return true;
    }
  });

  return (
    <div>
      {/* حقل البحث مع اختيار نوع البحث */}
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/4">
            <select
              className="inputField w-full"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as "name" | "code" | "group")}
            >
              <option value="name">بحث بالاسم</option>
              <option value="code">بحث بالكود</option>
              <option value="group">بحث بالمجموعة</option>
            </select>
          </div>
          
          <div className="relative w-full md:w-3/4">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              className="inputField pr-10 w-full"
              placeholder={
                searchField === "name" ? "بحث عن طالب بالاسم..." : 
                searchField === "code" ? "بحث عن طالب بالكود..." :
                "بحث عن مجموعة..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* عرض المدفوعات */}
      {filteredGroups.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-white text-lg">لا توجد مدفوعات مسجلة</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-physics-navy/50 text-physics-gold hover:bg-physics-navy/50">
              <TableHead className="text-right">اسم الطالب</TableHead>
              <TableHead className="text-right">كود الطالب</TableHead>
              <TableHead className="text-right">المجموعة</TableHead>
              <TableHead className="text-right">الصف</TableHead>
              <TableHead className="text-center">سجل التواريخ</TableHead>
              <TableHead className="text-center">تعديل</TableHead>
              <TableHead className="text-center">حذف</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.map((group) => (
              <TableRow key={group.studentId} className="border-t border-physics-navy hover:bg-physics-navy/30">
                <TableCell className="text-white font-medium">{group.name}</TableCell>
                <TableCell className="text-white">{group.code}</TableCell>
                <TableCell className="text-white">{group.group}</TableCell>
                <TableCell className="text-white">{group.grade}</TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => handleShowHistory({ id: group.studentId, name: group.name })}
                    className="flex items-center justify-center gap-2 bg-physics-gold text-physics-navy px-3 py-1 rounded-lg hover:bg-physics-gold/80 transition-colors text-sm font-medium"
                    title="عرض سجل المدفوعات"
                  >
                    <History size={14} />
                    <span>سجل التواريخ</span>
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => group.payments.length > 0 && handleEdit(group.payments[0])}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    title="تعديل بيانات الدفعة"
                  >
                    <Edit size={14} />
                    <span>تعديل</span>
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => handleDeleteAll(group.studentId)}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    title="حذف جميع مدفوعات الطالب"
                  >
                    <Trash2 size={14} />
                    <span>حذف</span>
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* نافذة سجل التواريخ */}
      <PaymentHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedStudentForHistory(null);
        }}
        studentId={selectedStudentForHistory?.id || ""}
        studentName={selectedStudentForHistory?.name || ""}
      />
    </div>
  );
}

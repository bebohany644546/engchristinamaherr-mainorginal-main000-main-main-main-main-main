import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePayments } from "@/hooks/use-payments";
import { Student, Payment } from "@/types";
import { Search, X, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { sanitizeSearchText } from "@/lib/utils";

interface PaymentFormProps {
  onClose: () => void;
}

export function PaymentForm({ onClose }: PaymentFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"name" | "code" | "group">("name");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paidMonths, setPaidMonths] = useState<string[]>([]);

  // Load form data from localStorage on mount (amount only, not student)
  useEffect(() => {
    const savedData = localStorage.getItem('paymentFormData');
    if (savedData) {
      try {
        const { amount: savedAmount } = JSON.parse(savedData);
        setAmount(savedAmount || "");
      } catch (error) {
        console.error("Error loading payment form data from localStorage:", error);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes (amount only)
  useEffect(() => {
    const formData = {
      amount
    };
    localStorage.setItem('paymentFormData', JSON.stringify(formData));
  }, [amount]);

  // قائمة الأشهر الـ12
  const monthOptions = [
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
  
  const { getAllStudents } = useAuth();
  const { addPayment, getStudentPayments } = usePayments();
  
  // Handle search with field type
  useEffect(() => {
    if (searchQuery.length > 0) {
      const query = sanitizeSearchText(searchQuery);
      const results = getAllStudents().filter(student => {
        switch (searchField) {
          case "name":
            return sanitizeSearchText(student.name).includes(query);
          case "code":
            return sanitizeSearchText(student.code).includes(query);
          case "group":
            return student.group ? sanitizeSearchText(student.group).includes(query) : false;
          default:
            return false;
        }
      });
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery, searchField, getAllStudents]);
  
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery("");
    setShowResults(false);

    // Fetch paid months for this student
    const studentPayments = getStudentPayments(student.id);
    const paidMonthsList = studentPayments.flatMap(payment =>
      payment.paidMonths.map(pm => pm.month)
    );
    setPaidMonths(paidMonthsList);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار طالب أولا",
        variant: "destructive",
      });
      return;
    }
    
    if (!month) {
      toast({
        title: "خطأ",
        description: "يرجى كتابة اسم الشهر",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Await the Promise returned by addPayment
      const result = await addPayment(
        selectedStudent.id,
        selectedStudent.name,
        selectedStudent.code,
        selectedStudent.group || "",
        month,
        amount
      );
      
      if (result.success) {
        toast({
          title: "✅ تم تسجيل الدفعة",
          description: result.message,
        });
        onClose();
      } else {
        toast({
          title: "❌ خطأ",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ خطأ",
        description: error.message || "حدث خطأ أثناء تسجيل الدفعة",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-physics-dark rounded-lg p-4 shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl text-physics-gold font-bold">دفع شهر جديد</h3>
        <button onClick={onClose} className="text-white hover:text-physics-gold">
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* بحث عن الطالب */}
        {!selectedStudent && (
          <div>
            <div className="flex mb-2 gap-2">
              <select 
                className="inputField w-1/3"
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as "name" | "code" | "group")}
              >
                <option value="name">بحث بالاسم</option>
                <option value="code">بحث بالكود</option>
                <option value="group">بحث بالمجموعة</option>
              </select>
              
              <div className="relative w-2/3">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-physics-gold" size={18} />
                <input
                  type="text"
                  className="inputField pr-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    searchField === "name" ? "اكتب اسم الطالب..." :
                    searchField === "code" ? "اكتب كود الطالب..." :
                    "اكتب اسم المجموعة..."
                  }
                />
              </div>
            </div>
            
            {/* نتائج البحث */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-w-md bg-physics-navy border border-physics-gold rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map(student => (
                  <div 
                    key={student.id} 
                    className="p-2 hover:bg-physics-dark cursor-pointer text-white border-b border-physics-navy/50"
                    onClick={() => handleSelectStudent(student)}
                  >
                    <div>{student.name}</div>
                    <div className="text-xs text-physics-gold">كود: {student.code} | مجموعة: {student.group}</div>
                  </div>
                ))}
              </div>
            )}
            
            {showResults && searchResults.length === 0 && (
              <div className="absolute z-10 mt-1 w-full max-w-md bg-physics-navy border border-red-500 rounded-md p-2 text-center text-white">
                لا توجد نتائج
              </div>
            )}
          </div>
        )}
        
        {/* بيانات الطالب المحدد */}
        {selectedStudent && (
          <div className="bg-physics-navy/50 p-3 rounded-lg">
            <div className="flex justify-between mb-2">
              <h4 className="text-physics-gold font-bold">بيانات الطالب</h4>
              <button 
                type="button" 
                className="text-xs text-red-400 hover:text-red-300"
                onClick={() => setSelectedStudent(null)}
              >
                تغيير الطالب
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-white">الاسم: <span className="text-physics-gold">{selectedStudent.name}</span></div>
              <div className="text-white">الكود: <span className="text-physics-gold">{selectedStudent.code}</span></div>
              <div className="text-white">المجموعة: <span className="text-physics-gold">{selectedStudent.group}</span></div>
            </div>
          </div>
        )}
        
        {/* حقل الشهر - قائمة اختيار */}
        <div>
          <label className="block text-white mb-1 text-sm">اختر الشهر</label>
          <select
            className="inputField"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
          >
            <option value="">اختر الشهر</option>
            {monthOptions.map((monthOption, index) => {
              const isPaid = paidMonths.includes(monthOption);
              // إخفاء الشهور المدفوعة تماماً من القائمة
              if (isPaid) return null;
              return (
                <option
                  key={index}
                  value={monthOption}
                >
                  {monthOption}
                </option>
              );
            })}
          </select>
          {paidMonths.length > 0 && (
            <p className="text-xs text-green-400 mt-1">
              ✅ تم إخفاء الشهور المدفوعة ({paidMonths.length} شهر)
            </p>
          )}
        </div>

        {/* حقل قيمة المبلغ */}
        <div>
          <label className="block text-white mb-1 text-sm">قيمة المبلغ (جنيه)</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*\.?[0-9]*"
            className="inputField [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={amount}
            onChange={(e) => {
              // السماح فقط بالأرقام والنقطة العشرية
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setAmount(value);
              }
            }}
            placeholder="أدخل قيمة المبلغ..."
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            💡 اكتب المبلغ يدوياً (مثال: 200 أو 150.50)
          </p>
        </div>
        
        <div className="pt-2 flex gap-2">
          <button 
            type="submit" 
            className="goldBtn flex-1"
            disabled={!selectedStudent || !month || !amount || isSubmitting}
          >
            {isSubmitting ? "جاري التسجيل..." : "تسجيل الدفعة"}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="bg-physics-navy text-white py-2 px-4 rounded-lg flex-1"
            disabled={isSubmitting}
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

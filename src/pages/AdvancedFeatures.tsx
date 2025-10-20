import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import PhysicsBackground from "@/components/PhysicsBackground";
import { PhoneContact } from "@/components/PhoneContact";
import { ArrowRight, Video } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { usePayments } from "@/hooks/use-payments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getGradeDisplay } from "@/lib/utils";

const AdvancedFeatures = () => {
  const navigate = useNavigate();
  const { currentUser, students } = useAuth();
  const { getStudentAttendance, getAllVideos, updateVideo } = useData();
  const { payments } = usePayments();

  const [showVideoBlockDialog, setShowVideoBlockDialog] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [blockType, setBlockType] = useState<"absent" | "nonpayer" | null>(null);
  const [studentsToBlock, setStudentsToBlock] = useState<any[]>([]);
  const [selectedCalendarMonth, setSelectedCalendarMonth] = useState<number>(new Date().getMonth() + 1);

  // Video passwords states
  const [showVideoPasswordsDialog, setShowVideoPasswordsDialog] = useState(false);

  // Functions for video blocking
  const handleSearchAbsent = () => {
    if (!selectedVideo) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى اختيار الفيديو أولاً"
      });
      return;
    }

    console.log("=== بدء البحث عن الطلاب الغائبين ===");
    console.log("الفيديو المختار:", selectedVideo.title);
    console.log("صف الفيديو:", selectedVideo.grade);
    console.log("الشهر المختار:", selectedCalendarMonth);

    const absentStudents: any[] = [];
    
    // البحث فقط في طلاب نفس صف الفيديو
    const gradeStudents = students.filter(student => student.grade === selectedVideo.grade);
    console.log(`عدد طلاب ${selectedVideo.grade}:`, gradeStudents.length);

    gradeStudents.forEach(student => {
      const attendance = getStudentAttendance(student.id);
      const absentRecords = attendance.filter(record => record.status === "absent");
      
      console.log(`\n--- الطالب: ${student.name} (${student.id}) ---`);
      console.log("إجمالي الغياب:", absentRecords.length);

      // الشرط الأول: 3 حصص غياب في أي وقت
      const hasThreeAbsences = absentRecords.length >= 3;
      console.log("✓ الشرط 1 (3 حصص غياب في أي وقت):", hasThreeAbsences);

      // الشرط الثاني: حصتين متتاليتين في الشهر المختار
      let hasTwoConsecutiveInMonth = false;
      
      // فلترة الغياب في الشهر المختار
      const absencesInSelectedMonth = absentRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() + 1 === selectedCalendarMonth;
      });

      console.log(`الغياب في الشهر ${selectedCalendarMonth}:`, absencesInSelectedMonth.length);

      if (absencesInSelectedMonth.length >= 2) {
        // ترتيب الغياب حسب التاريخ
        const sortedAbsences = absencesInSelectedMonth.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // التحقق من وجود حصتين متتاليتين
        for (let i = 0; i < sortedAbsences.length - 1; i++) {
          const currentDate = new Date(sortedAbsences[i].date);
          const nextDate = new Date(sortedAbsences[i + 1].date);
          
          // حساب الفرق بالأيام
          const diffTime = Math.abs(nextDate.getTime() - currentDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // إذا كان الفرق 7 أيام أو أقل (نفس الأسبوع تقريباً)
          if (diffDays <= 7) {
            hasTwoConsecutiveInMonth = true;
            console.log(`✓ وجدت حصتين متتاليتين: ${currentDate.toLocaleDateString('ar-EG')} و ${nextDate.toLocaleDateString('ar-EG')}`);
            break;
          }
        }
      }

      console.log("✓ الشرط 2 (حصتين متتاليتين في الشهر المختار):", hasTwoConsecutiveInMonth);

      // يحظر إذا تحقق شرط واحد أو كليهما (OR)
      if (hasThreeAbsences || hasTwoConsecutiveInMonth) {
        absentStudents.push(student);
        const reason = hasThreeAbsences ? (hasTwoConsecutiveInMonth ? 'كلا الشرطين' : '3 حصص إجمالي') : 'حصتين متتاليتين';
        console.log(`✅ الطالب يستوفي ${reason} - سيتم حظره`);
      } else {
        console.log("❌ الطالب لا يستوفي أي شرط");
      }
    });

    console.log("\n=== نتيجة البحث ===");
    console.log("عدد الطلاب المستوفين للشروط:", absentStudents.length);

    setStudentsToBlock(absentStudents);
    toast({
      title: "تم البحث بنجاح",
      description: `تم العثور على ${absentStudents.length} طالب غائب يستوفي شرط واحد أو كليهما (3 حصص إجمالي أو حصتين متتاليتين في الشهر ${selectedCalendarMonth})`
    });
  };

  const handleSearchNonPayers = () => {
    if (!selectedCalendarMonth) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى اختيار الشهر أولاً"
      });
      return;
    }

    if (!selectedVideo) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى اختيار الفيديو أولاً"
      });
      return;
    }
    
    // تحويل أرقام الشهور إلى الصيغة النصية المستخدمة في قاعدة البيانات
    const monthNames = [
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
    
    const selectedMonthName = monthNames[selectedCalendarMonth - 1];
    
    console.log("Selected calendar month:", selectedCalendarMonth);
    console.log("Selected month name:", selectedMonthName);
    console.log("Video grade:", selectedVideo.grade);
    console.log("Total students in grade:", students.filter(s => s.grade === selectedVideo.grade).length);
    console.log("Total payments:", payments.length);
    
    const nonPayers: any[] = [];
    
    // البحث فقط في طلاب صف الفيديو (جميع المجموعات)
    const gradeStudents = students.filter(student => student.grade === selectedVideo.grade);
    
    gradeStudents.forEach(student => {
      // Get all payments for this student
      const studentPayments = payments.filter(p => p.studentId === student.id);
      
      // Get all paid months for this student from all their payment records
      const allPaidMonths = studentPayments.flatMap(payment => 
        payment.paidMonths?.map(pm => pm.month) || []
      );
      
      console.log(`Student ${student.name} (${student.id}, Group: ${student.group}) - Paid months:`, allPaidMonths);
      
      // Check if student has NOT paid for the selected month
      const hasNotPaidSelectedMonth = !allPaidMonths.includes(selectedMonthName);
      
      if (hasNotPaidSelectedMonth) {
        nonPayers.push(student);
        console.log(`✓ Student ${student.name} has not paid for ${selectedMonthName}`);
      } else {
        console.log(`✗ Student ${student.name} has paid for ${selectedMonthName}`);
      }
    });
    
    console.log("Non-payers found in grade:", nonPayers.length);
    
    setStudentsToBlock(nonPayers);
    toast({
      title: "تم البحث بنجاح",
      description: `تم العثور على ${nonPayers.length} طالب غير دافع لـ${selectedMonthName} في صف ${selectedVideo.grade}`
    });
  };

  const handleBlockConfirm = async () => {
    if (studentsToBlock.length === 0 || !selectedVideo) return;
    const currentBlocked = selectedVideo.blockedStudents || [];
    const newBlocked = [...new Set([...currentBlocked, ...studentsToBlock.map((s: any) => s.id)])];
    try {
      await updateVideo(
        selectedVideo.id,
        selectedVideo.title,
        selectedVideo.url,
        selectedVideo.grade,
        selectedVideo.isYouTube,
        selectedVideo.password,
        newBlocked
      );
      toast({
        title: "تم الحظر بنجاح",
        description: `تم حظر ${studentsToBlock.length} طالب من الفيديو "${selectedVideo.title}"${blockType === 'nonpayer' ? ` للشهر ${selectedCalendarMonth}` : ''}`
      });
    } catch (error) {
      console.error("Error blocking students:", error);
      toast({
        variant: "destructive",
        title: "خطأ في الحظر",
        description: "حدث خطأ أثناء حظر الطلاب"
      });
    } finally {
      setShowVideoBlockDialog(false);
      setSelectedVideo(null);
      setBlockType(null);
      setStudentsToBlock([]);
      setSelectedCalendarMonth(new Date().getMonth() + 1);
    }
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
      <main className="flex-1 p-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-physics-gold text-center">ميزات متقدمة</h1>
          </div>

          {/* Automatic Video Blocking Box */}
          <div
            className="mt-6 bg-physics-dark rounded-lg p-8 border border-physics-gold/20 hover:border-physics-gold/40 transition-colors cursor-pointer shadow-lg hover:shadow-xl"
            onClick={() => setShowVideoBlockDialog(true)}
          >
            <div className="flex items-center justify-center gap-3">
              <Video size={32} className="text-physics-gold" />
              <h2 className="text-physics-gold text-center text-xl font-bold">حظر الطلاب من الفيديوهات تلقائي</h2>
            </div>
          </div>

          {/* Video Passwords Management Box */}
          <div
            className="mt-6 bg-physics-dark rounded-lg p-8 border border-physics-gold/20 hover:border-physics-gold/40 transition-colors cursor-pointer shadow-lg hover:shadow-xl"
            onClick={() => setShowVideoPasswordsDialog(true)}
          >
            <div className="flex items-center justify-center gap-3">
              <Video size={32} className="text-physics-gold" />
              <h2 className="text-physics-gold text-center text-xl font-bold">إدارة كلمات مرور الفيديوهات</h2>
            </div>
          </div>


        </div>
      </main>

      {/* Video Blocking Dialog */}
      <Dialog open={showVideoBlockDialog} onOpenChange={setShowVideoBlockDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-physics-dark border-physics-gold">
          <DialogHeader>
            <DialogTitle className="text-physics-gold text-center text-xl">
              حظر الطلاب من الفيديوهات تلقائي
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {!selectedVideo ? (
              <div>
                <h3 className="text-white text-lg mb-4">اختر الفيديو</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getAllVideos().map(video => (
                    <div key={video.id} className="p-4 bg-physics-navy rounded border border-physics-gold/30 cursor-pointer hover:bg-physics-gold/10" onClick={() => setSelectedVideo(video)}>
                      <h4 className="text-physics-gold font-bold">{video.title}</h4>
                      <p className="text-gray-400 text-sm">{video.grade}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-white text-lg">الفيديو المختار: {selectedVideo.title}</h3>
                  <Button onClick={() => setSelectedVideo(null)} variant="outline" className="mt-2">تغيير الفيديو</Button>
                </div>
                {!blockType ? (
                  <div className="space-y-4">
                    <Button onClick={() => setBlockType('absent')} className="w-full bg-blue-600">
                      حظر الطلاب الغائبين
                    </Button>
                    <Button onClick={() => setBlockType('nonpayer')} className="w-full bg-orange-600">
                      حظر الطلاب الغير دافعين
                    </Button>
                  </div>
                ) : blockType === 'absent' ? (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-white mb-2 font-bold">اختر الشهر الميلادي للبحث</h4>
                      <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 mb-3">
                        <p className="text-blue-300 text-sm">
                          <strong>ملاحظة:</strong> سيتم البحث في <strong className="text-yellow-300">سجل الحضور لصف الفيديو فقط</strong> (جميع المجموعات) عن الطلاب الذين:
                        </p>
                        <ul className="text-gray-300 text-xs mt-2 mr-4 space-y-1">
                          <li>✓ غابوا <strong>3 حصص أو أكثر</strong> منذ الإضافة للمنصة</li>
                          <li>✓ غابوا <strong>حصتين متتاليتين (وراء بعض)</strong> في الشهر الميلادي المختار</li>
                          <li className="text-yellow-300 font-bold">⚠ يحظر إذا تحقق شرط واحد أو كليهما</li>
                        </ul>
                      </div>
                      <select 
                        value={selectedCalendarMonth} 
                        onChange={(e) => setSelectedCalendarMonth(Number(e.target.value))}
                        className="w-full p-3 bg-physics-dark border border-physics-gold/30 rounded text-white text-lg"
                      >
                        <option value={1}>يناير (1)</option>
                        <option value={2}>فبراير (2)</option>
                        <option value={3}>مارس (3)</option>
                        <option value={4}>أبريل (4)</option>
                        <option value={5}>مايو (5)</option>
                        <option value={6}>يونيو (6)</option>
                        <option value={7}>يوليو (7)</option>
                        <option value={8}>أغسطس (8)</option>
                        <option value={9}>سبتمبر (9)</option>
                        <option value={10}>أكتوبر (10)</option>
                        <option value={11}>نوفمبر (11)</option>
                        <option value={12}>ديسمبر (12)</option>
                      </select>
                    </div>
                    <Button onClick={handleSearchAbsent} className="w-full bg-physics-gold mb-4 text-lg font-bold hover:bg-physics-gold/90">
                      البحث عن الطلاب الغائبين (3 حصص + حصتين متتاليتين)
                    </Button>
                    {studentsToBlock.length > 0 && (
                      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                        <p className="text-white mb-4 text-lg">✓ تم العثور على <strong className="text-red-400">{studentsToBlock.length}</strong> طالب غائب يستوفي الشروط</p>
                        <Button onClick={handleBlockConfirm} className="w-full bg-red-600 text-lg font-bold hover:bg-red-700">
                          تأكيد حظر {studentsToBlock.length} طالب من الفيديو
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-white mb-2 font-bold">اختر الشهر الميلادي للبحث عن الغير دافعين</h4>
                      <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 mb-3">
                        <p className="text-blue-300 text-sm">
                          <strong>ملاحظة:</strong> سيتم البحث عن الطلاب في <strong className="text-yellow-300">صف الفيديو فقط</strong> (جميع المجموعات) الذين <strong className="text-red-400">لم يدفعوا</strong> الشهر المختار من صفحة إدارة المدفوعات
                        </p>
                        <ul className="text-gray-300 text-xs mt-2 mr-4 space-y-1">
                          <li>✓ البحث في سجل المدفوعات عن الطلاب المسجلين (الدافعين) للشهر المختار</li>
                          <li>✓ حظر باقي الطلاب في الصف الذين لم يظهروا في السجل (غير دافعين)</li>
                          <li className="text-yellow-300">⚠ يشمل جميع مجموعات الصف: أ، ب، ج، ... إلخ</li>
                        </ul>
                      </div>
                      <select 
                        value={selectedCalendarMonth} 
                        onChange={(e) => setSelectedCalendarMonth(Number(e.target.value))}
                        className="w-full p-3 bg-physics-dark border border-physics-gold/30 rounded text-white text-lg"
                      >
                        <option value={1}>الشهر الأول (يناير)</option>
                        <option value={2}>الشهر الثاني (فبراير)</option>
                        <option value={3}>الشهر الثالث (مارس)</option>
                        <option value={4}>الشهر الرابع (أبريل)</option>
                        <option value={5}>الشهر الخامس (مايو)</option>
                        <option value={6}>الشهر السادس (يونيو)</option>
                        <option value={7}>الشهر السابع (يوليو)</option>
                        <option value={8}>الشهر الثامن (أغسطس)</option>
                        <option value={9}>الشهر التاسع (سبتمبر)</option>
                        <option value={10}>الشهر العاشر (أكتوبر)</option>
                        <option value={11}>الشهر الحادي عشر (نوفمبر)</option>
                        <option value={12}>الشهر الثاني عشر (ديسمبر)</option>
                      </select>
                    </div>
                    <Button onClick={handleSearchNonPayers} className="w-full bg-physics-gold mb-4 text-lg font-bold hover:bg-physics-gold/90">
                      البحث عن الطلاب الغير دافعين للشهر المختار (صف {selectedVideo?.grade})
                    </Button>
                    {studentsToBlock.length > 0 && (
                      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                        <p className="text-white mb-4 text-lg">✓ تم العثور على <strong className="text-red-400">{studentsToBlock.length}</strong> طالب غير دافع للشهر المختار في صف الفيديو</p>
                        <Button onClick={handleBlockConfirm} className="w-full bg-red-600 text-lg font-bold hover:bg-red-700">
                          تأكيد حظر {studentsToBlock.length} طالب من الفيديو
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <Button 
                  onClick={() => { 
                    setBlockType(null); 
                    setSelectedVideo(null); 
                    setStudentsToBlock([]); 
                    setSelectedCalendarMonth(new Date().getMonth() + 1); 
                  }} 
                  variant="outline" 
                  className="w-full mt-4"
                >
                  إلغاء
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Passwords Management Dialog */}
      <Dialog open={showVideoPasswordsDialog} onOpenChange={setShowVideoPasswordsDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-physics-dark border-physics-gold">
          <DialogHeader>
            <DialogTitle className="text-physics-gold text-center text-xl">
              إدارة كلمات مرور الفيديوهات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
              <p className="text-blue-300 text-sm">
                <strong>ملاحظة:</strong> يتم عرض جميع الفيديوهات مع كلمات المرور الخاصة بها. الفيديوهات بدون كلمة مرور ستظهر بحقل فارغ.
              </p>
            </div>
            
            {(() => {
              const protectedVideos = getAllVideos().filter(v => v.password && v.password.trim() !== '');
              
              if (protectedVideos.length === 0) {
                return (
                  <div className="text-center text-gray-400 py-8">
                    <Video size={48} className="mx-auto mb-4 opacity-50" />
                    <p>لا توجد فيديوهات محمية بكلمة مرور</p>
                  </div>
                );
              }
              
              return (
                <div className="grid grid-cols-1 gap-4">
                  {protectedVideos.map(video => {
                    const passwordLength = video.password?.length || 0;
                    
                    return (
                      <div 
                        key={video.id} 
                        className="p-4 bg-physics-navy rounded-lg border-2 border-green-500/50 hover:border-green-500 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-physics-gold font-bold text-lg">{video.title}</h4>
                              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">✓ محمي</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-3">
                              الصف: {getGradeDisplay(video.grade)} | 
                              النوع: {video.isYouTube ? 'يوتيوب' : 'رابط مباشر'}
                            </p>
                            
                            <div className="space-y-2">
                              <label className="block text-white text-sm font-semibold">
                                كلمة المرور الحالية:
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={video.password || ''}
                                  readOnly
                                  className="flex-1 p-3 bg-physics-dark border-2 border-green-500/30 rounded text-white font-mono text-lg"
                                />
                                <Button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(video.password || '');
                                      toast({
                                        title: "✅ تم النسخ",
                                        description: "تم نسخ كلمة المرور إلى الحافظة بنجاح"
                                      });
                                    } catch (error) {
                                      console.error("Failed to copy:", error);
                                      toast({
                                        variant: "destructive",
                                        title: "❌ فشل النسخ",
                                        description: "حدث خطأ أثناء نسخ كلمة المرور"
                                      });
                                    }
                                  }}
                                  className="bg-physics-gold text-physics-navy hover:bg-physics-gold/90 px-4"
                                >
                                  📋 نسخ
                                </Button>
                              </div>
                              <p className="text-xs text-gray-400">
                                طول كلمة المرور: {passwordLength} حرف
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => {
                                const newPassword = prompt('أدخل كلمة مرور جديدة:', video.password || '');
                                if (newPassword !== null && newPassword.trim() !== '') {
                                  updateVideo(
                                    video.id,
                                    video.title,
                                    video.url,
                                    video.grade,
                                    video.isYouTube,
                                    newPassword.trim(),
                                    video.blockedStudents || []
                                  );
                                  toast({
                                    title: "✅ تم التحديث",
                                    description: "تم تحديث كلمة مرور الفيديو بنجاح"
                                  });
                                } else if (newPassword !== null) {
                                  toast({
                                    variant: "destructive",
                                    title: "❌ خطأ",
                                    description: "كلمة المرور لا يمكن أن تكون فارغة"
                                  });
                                }
                              }}
                              className="bg-physics-gold text-physics-navy hover:bg-physics-gold/90 whitespace-nowrap"
                            >
                              🔑 تغيير كلمة المرور
                            </Button>
                            
                            <Button
                              onClick={() => {
                                if (window.confirm('هل أنت متأكد من إزالة كلمة المرور؟ سيصبح الفيديو متاحاً للجميع!')) {
                                  updateVideo(
                                    video.id,
                                    video.title,
                                    video.url,
                                    video.grade,
                                    video.isYouTube,
                                    '',
                                    video.blockedStudents || []
                                  );
                                  toast({
                                    title: "✅ تم الإزالة",
                                    description: "تم إزالة كلمة مرور الفيديو"
                                  });
                                }
                              }}
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white whitespace-nowrap"
                            >
                              🗑️ إزالة الحماية
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            
            <div className="mt-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
              <h5 className="text-green-400 font-bold mb-2">📊 إحصائيات:</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-400">إجمالي الفيديوهات</p>
                  <p className="text-white font-bold text-xl">{getAllVideos().length}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">محمية بكلمة مرور</p>
                  <p className="text-green-400 font-bold text-xl">
                    {getAllVideos().filter(v => v.password && v.password.trim() !== '').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">نسبة الحماية</p>
                  <p className="text-blue-400 font-bold text-xl">
                    {getAllVideos().length > 0 
                      ? Math.round((getAllVideos().filter(v => v.password && v.password.trim() !== '').length / getAllVideos().length) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdvancedFeatures;

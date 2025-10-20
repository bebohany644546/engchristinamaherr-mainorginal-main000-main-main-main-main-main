import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Logo } from "@/components/Logo";
import { PhoneContact } from "@/components/PhoneContact";
import { Users, UserPlus, QrCode, Video, Book, LogOut, CheckSquare, Award, DollarSign, UserCheck, Settings, Lock, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PhysicsBackground from "@/components/PhysicsBackground";

const DashboardItem = ({
  to,
  icon,
  title,
  stats = null
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  stats?: { present?: number; absent?: number; total?: number } | null;
}) => {
  return (
    <Link
      to={to}
      className="group bg-gradient-to-br from-[#1a2332] to-[#1e2836] rounded-xl p-4 hover:from-[#1e2836] hover:to-[#243040] transition-all duration-200 flex flex-col items-center border border-[#d4af37]/30 hover:border-[#d4af37] hover:scale-102 transform"
    >
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0f1419] to-[#141a24] flex items-center justify-center text-[#d4af37] mb-3 group-hover:scale-105 transition-transform duration-200">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#d4af37] text-center group-hover:text-[#ffd700] transition-colors duration-200">{title}</h3>
      {stats && (
        <div className="mt-3 w-full">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-[#10b981]">✓ {stats.present || 0}</span>
            <span className="text-[#ef4444]">✗ {stats.absent || 0}</span>
          </div>
          <div className="w-full bg-[#0f1419] h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#10b981] to-[#34d399] h-full rounded-full transition-all duration-300" 
              style={{ width: `${stats.total ? (stats.present || 0) / stats.total * 100 : 0}%` }}
            />
          </div>
          <div className="text-center text-xs text-[#9ca3af] mt-1.5">
            {stats.total || 0} حصة
          </div>
        </div>
      )}
    </Link>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { getStudentAttendance, getStudentLessonCount } = useData();

  // إحصائيات الحضور للطالب
  const attendanceStats = currentUser?.role === "student" ? {
    present: getStudentAttendance(currentUser.id).filter(r => r.status === "present").length,
    absent: getStudentAttendance(currentUser.id).filter(r => r.status === "absent").length,
    total: getStudentLessonCount(currentUser.id)
  } : null;

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-physics-navy flex flex-col relative">
      {currentUser.role !== "admin" && <PhysicsBackground />}
      <PhoneContact />
      
      {/* Header with User Info */}
      <header className="bg-physics-dark py-4 px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center">
          <div className="text-physics-gold font-bold text-lg ml-2">
            {currentUser.name}
          </div>
          <div className="bg-physics-gold/20 rounded-full px-3 py-1 text-sm text-physics-gold">
            {currentUser.role === "admin" ? "مسؤول النظام" : currentUser.role === "student" ? "طالب" : "ولي أمر"}
          </div>
        </div>
        
        <Logo />
        
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="flex items-center gap-2 text-physics-gold hover:opacity-80">
            <span>تسجيل الخروج</span>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content - Dashboard */}
      <main className="flex-1 p-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-physics-gold mb-8">لوحة التحكم</h1>
          
          {/* Admin Dashboard Items - 9 مربعات */}
          {currentUser.role === "admin" && (
            <div className="grid grid-cols-3 gap-3">
              <DashboardItem
                to="/students"
                icon={<Users size={20} />}
                title="إدارة الطلاب"
              />
              <DashboardItem
                to="/parents"
                icon={<UserPlus size={20} />}
                title="أولياء الأمور"
              />
              <DashboardItem
                to="/scan-code"
                icon={<QrCode size={20} />}
                title="تسجيل الحضور"
              />
              <DashboardItem
                to="/attendance-list"
                icon={<UserCheck size={20} />}
                title="سجل الحضور"
              />
              <DashboardItem
                to="/grades-management"
                icon={<Award size={20} />}
                title="الدرجات"
              />
              <DashboardItem
                to="/payments"
                icon={<DollarSign size={20} />}
                title="المدفوعات"
              />
              <DashboardItem
                to="/videos"
                icon={<Video size={20} />}
                title="الفيديوهات"
              />
              <DashboardItem
                to="/books"
                icon={<Book size={20} />}
                title="الكتب"
              />
              <DashboardItem
                to="/advanced-features"
                icon={<Settings size={20} />}
                title="ميزات متقدمة"
              />
            </div>
          )}
          
          {/* Student Dashboard Items */}
          {currentUser.role === "student" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <DashboardItem 
                to="/student-code" 
                icon={<QrCode size={20} />} 
                title="كود الطالب"
              />
              <DashboardItem 
                to="/student-password" 
                icon={<Lock size={20} />} 
                title="كلمة المرور"
              />
              <DashboardItem 
                to="/student-grades" 
                icon={<Award size={20} />} 
                title="الدرجات"
              />
              <DashboardItem 
                to="/attendance-record" 
                icon={<CheckSquare size={20} />} 
                title="سجل الحضور"
                stats={attendanceStats}
              />
              <DashboardItem 
                to="/videos" 
                icon={<Video size={20} />} 
                title="الفيديوهات"
              />
              <DashboardItem 
                to="/student-books" 
                icon={<Book size={20} />} 
                title="الكتب"
              />
              <DashboardItem 
                to="/student-payments" 
                icon={<DollarSign size={20} />} 
                title="المدفوعات"
              />
            </div>
          )}
          
          {/* Parent Dashboard Items */}
          {currentUser.role === "parent" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <DashboardItem 
                to="/grades" 
                icon={<Award size={20} />} 
                title="الدرجات"
              />
              <DashboardItem 
                to="/attendance-record" 
                icon={<CheckSquare size={20} />} 
                title="سجل الحضور"
              />
              <DashboardItem 
                to="/parent-payments" 
                icon={<DollarSign size={20} />} 
                title="المدفوعات"
              />
              <DashboardItem 
                to="/parent-student-code" 
                icon={<QrCode size={20} />} 
                title="كود الطالب"
              />
              <DashboardItem 
                to="/parent-student-password" 
                icon={<Lock size={20} />} 
                title="كلمة مرور الطالب"
              />
              <DashboardItem 
                to="/parent-account-info" 
                icon={<User size={20} />} 
                title="بيانات الحساب"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { PhoneContact } from "@/components/PhoneContact";
import { ArrowRight, QrCode, Copy, Check } from "lucide-react";
import QRCode from "qrcode";

const ParentStudentCode = () => {
  const navigate = useNavigate();
  const { currentUser, students } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Get student info for parent
    if (currentUser.role === "parent" && currentUser.childrenIds && currentUser.childrenIds.length > 0) {
      const childId = currentUser.childrenIds[0];
      const student = students.find(s => s.id === childId);
      
      if (student) {
        setStudentInfo(student);
        
        // Generate QR code
        QRCode.toDataURL(student.code, {
          width: 300,
          margin: 2,
          color: {
            dark: "#1a1a2e",
            light: "#ffffff",
          },
        })
          .then((url) => {
            setQrCodeUrl(url);
          })
          .catch((err) => {
            console.error("Error generating QR code:", err);
          });
      }
    }
  }, [currentUser, students, navigate]);

  const handleCopyCode = () => {
    if (studentInfo) {
      navigator.clipboard.writeText(studentInfo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!currentUser || !studentInfo) return null;

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
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-physics-dark rounded-lg p-8 text-center shadow-2xl border-2 border-physics-gold/30">
            <QrCode size={48} className="mx-auto mb-4 text-physics-gold" />
            <h1 className="text-2xl font-bold text-physics-gold mb-2">كود الطالب</h1>
            <p className="text-white mb-6">كود الطالب: {studentInfo.name}</p>
            
            {/* QR Code */}
            {qrCodeUrl && (
              <div className="mb-6 bg-white p-4 rounded-lg inline-block">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              </div>
            )}
            
            {/* Student Code */}
            <div className="bg-physics-navy p-6 rounded-lg mb-4">
              <p className="text-gray-400 text-sm mb-2">الكود</p>
              <p className="text-4xl font-bold text-physics-gold tracking-wider">
                {studentInfo.code}
              </p>
            </div>
            
            {/* Copy Button */}
            <button
              onClick={handleCopyCode}
              className="flex items-center justify-center gap-2 w-full bg-physics-gold text-physics-navy py-3 px-6 rounded-lg hover:bg-physics-gold/90 transition-all font-medium"
            >
              {copied ? (
                <>
                  <Check size={20} />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy size={20} />
                  <span>نسخ الكود</span>
                </>
              )}
            </button>
            
            {/* Info */}
            <div className="mt-6 text-sm text-gray-400">
              <p>💡 استخدم هذا الكود لتسجيل حضور الطالب</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentStudentCode;
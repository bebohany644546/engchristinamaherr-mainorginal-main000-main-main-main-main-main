
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";

// Platform detection utility (single declaration)
const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

interface Html5QrScannerProps {
  onScanSuccess: (code: string) => void;
  onClose: () => void;
}

export function Html5QrScanner({ onScanSuccess, onClose }: Html5QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // تهيئة الماسح الضوئي
    if (containerRef.current) {
      const scannerId = "html5-qr-scanner";
      
      // إنشاء عنصر div للماسح الضوئي إذا لم يكن موجودًا
      let scannerElement = document.getElementById(scannerId);
      if (!scannerElement) {
        scannerElement = document.createElement("div");
        scannerElement.id = scannerId;
        containerRef.current.appendChild(scannerElement);
      }

      // إنشاء كائن الماسح الضوئي
      scannerRef.current = new Html5Qrcode(scannerId);
      
      // بدء المسح الضوئي
      startScanner();
    }

    // تنظيف عند إزالة المكون
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    if (!scannerRef.current) {
      console.error("Scanner ref is not available");
      return;
    }

    try {
      console.log("🎥 بدء تشغيل الكاميرا...");
      setIsScanning(true);

      // التحقق من وجود كاميرات متاحة
      const cameras = await Html5Qrcode.getCameras();
      console.log("📷 الكاميرات المتاحة:", cameras.length);

      if (cameras.length === 0) {
        throw new Error("لا توجد كاميرات متاحة");
      }

      // Platform-specific optimizations (standard constraints only)
      const videoConstraints = {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280, min: 640, max: 1920 },
        height: { ideal: 720, min: 480, max: 1080 }
      };

      if (isIOS) {
        // iOS: optimized resolution
        videoConstraints.width = { ideal: 640, min: 480, max: 1280 };
        videoConstraints.height = { ideal: 480, min: 360, max: 720 };
      } else if (isAndroid) {
        // Android: higher resolution
        videoConstraints.width = { ideal: 1920, min: 640, max: 1920 };
        videoConstraints.height = { ideal: 1080, min: 480, max: 1080 };
      }

      const config = {
        fps: isIOS ? 30 : 60,
        qrbox: { width: 350, height: 350 },
        aspectRatio: 1.0,
        disableFlip: false,
        supportedScanTypes: [], // Auto-detect for compatibility
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
          useIntegerCoordinates: true
        },
        videoConstraints,
        formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        rememberLastUsedCamera: true
      };

      // Multiple fallback attempts for Android compatibility
      const startAttempts = [
        { id: { facingMode: "environment" }, name: "خلفية" },
        { id: cameras[0]?.id, name: "أول كاميرا" },
        { id: true, name: "افتراضي" },
        { id: { facingMode: "user" }, name: "أمامية" }
      ];

      let startSuccess = false;
      for (const attempt of startAttempts) {
        try {
          console.log(`محاولة تشغيل: ${attempt.name}`, attempt.id);
          await scannerRef.current.start(attempt.id, config, handleQrCodeSuccess, handleQrCodeError);
          console.log(`✅ نجح تشغيل ${attempt.name}`);
          startSuccess = true;
          break;
        } catch (attemptError: any) {
          console.log(`فشل ${attempt.name}:`, attemptError.message);
          if (attempt === startAttempts[startAttempts.length - 1]) {
            throw attemptError; // Last attempt failed
          }
        }
      }

      if (!startSuccess) {
        throw new Error("تعذر تشغيل الكاميرا بعد جميع المحاولات");
      }

    } catch (err: any) {
      console.error("❌ خطأ في بدء الماسح الضوئي:", err);

      let errorMessage = "تأكد من أن لديك كاميرا متاحة وأنك منحتها الأذونات";

      if (err.message?.includes("Permission") || err.message?.includes("NotAllowed")) {
        errorMessage = "يرجى السماح بالكاميرا في إعدادات المتصفح (Chrome/Safari)";
      } else if (err.message?.includes("NotFound") || err.message?.includes("no devices")) {
        errorMessage = "لا توجد كاميرا متاحة. تأكد من أن الجهاز يدعم الكاميرا";
      } else if (isAndroid && (err.message?.includes("constraint") || err.message?.includes("track"))) {
        errorMessage = "مشكلة في الكاميرا على Android. جرب Chrome أو أعد تشغيل التطبيق";
      }

      toast({
        variant: "destructive",
        title: "تعذر تشغيل الكاميرا",
        description: errorMessage
      });
      setIsScanning(false);
      onClose();
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        // Safe stop without state check
        await scannerRef.current.stop().catch(console.warn);
        setIsScanning(false);
        
        // Clean video stream and container for re-opening
        const video = document.querySelector('video');
        if (video) {
          const stream = video.srcObject as MediaStream;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          video.srcObject = null;
        }
        
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        
        console.log("تم إيقاف الماسح الضوئي وتنظيفه لإعادة الاستخدام");
      } catch (error) {
        console.error("خطأ في إيقاف الماسح الضوئي:", error);
      }
    }
  };

  const handleQrCodeSuccess = async (decodedText: string) => {
    console.log("تم مسح الكود بنجاح:", decodedText);
    
    // إيقاف وتنظيف للسماح بإعادة الفتح الفوري
    await stopScanner();
    
    onScanSuccess(decodedText);
  };

  const handleQrCodeError = (error: any) => {
    // نتجاهل أخطاء المسح العادية (عندما لا يوجد رمز QR في الإطار)
    // ولكن نسجل الأخطاء الأخرى
    if (error?.message?.includes("No barcode or QR code detected")) {
      return;
    }
    console.error("خطأ في مسح الكود:", error);
  };

  // تحسين CSS للاستخدام على الأجهزة المحمولة
  const scannerStyle = {
    width: '100%',
    maxWidth: '100%'
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-physics-dark">
      {/* حاوية لعنصر الماسح الضوئي */}
      <div 
        ref={containerRef} 
        className="w-full aspect-video max-h-[60vh] relative"
        style={scannerStyle}
      >
        {/* غطاء زاوي للإطار */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-physics-gold"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-physics-gold"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-physics-gold"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-physics-gold"></div>
        </div>

        {/* زر الإغلاق */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-physics-navy/90 hover:bg-physics-navy rounded-full z-30 shadow-lg border border-physics-gold/30 transition-all transform hover:scale-110"
          aria-label="إغلاق الكاميرا"
        >
          <X className="text-white" size={20} />
        </button>
        
        {/* نص توجيهي */}
        <div className="absolute bottom-4 left-0 right-0 text-center z-20">
          <p className="text-white text-sm bg-physics-navy/90 py-2 px-4 rounded-full inline-block shadow-lg border border-physics-gold/30">
            ضع رمز QR أو Barcode داخل المربع للمسح
          </p>
        </div>
      </div>
    </div>
  );
}

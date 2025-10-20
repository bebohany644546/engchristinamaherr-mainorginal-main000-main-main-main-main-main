import React, { useEffect, useRef, useState } from 'react';
import { Lock, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";

interface PlyrYouTubePlayerProps {
  videoUrl: string;
  title?: string;
  password?: string;
  blockedStudents?: string[];
  currentUserId?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
}

export const PlyrYouTubePlayer: React.FC<PlyrYouTubePlayerProps> = ({
  videoUrl,
  title = "فيديو تعليمي",
  password,
  blockedStudents = [],
  currentUserId,
  className = "",
  autoplay = false,
  muted = false
}) => {
  const { currentUser } = useAuth();
  const playerRef = useRef<HTMLDivElement>(null);
  const [isPasswordVerified, setIsPasswordVerified] = useState(!password);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // التحقق من حظر الطالب
  useEffect(() => {
    if (currentUserId && blockedStudents.includes(currentUserId)) {
      setIsBlocked(true);
    }
  }, [currentUserId, blockedStudents]);

  // تجاوز كلمة المرور للمسؤول
  useEffect(() => {
    if (password && currentUser?.role === "admin") {
      setIsPasswordVerified(true);
    }
  }, [currentUser, password]);

  // استخراج معرف الفيديو من رابط يوتيوب
  const getVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(videoUrl);

  // تحميل Plyr من CDN
  useEffect(() => {
    if (!isPasswordVerified || isBlocked || !videoId) return;

    // تحميل CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
    document.head.appendChild(link);

    // تحميل JavaScript
    const script = document.createElement('script');
    script.src = 'https://cdn.plyr.io/3.7.8/plyr.polyfilled.js';
    script.onload = () => {
      if (playerRef.current && window.Plyr) {
        // إنشاء عنصر مشغل Plyr
        playerRef.current.innerHTML = '';

        const youtubeConfig: any = {
          noCookie: true,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          controls: 0,
          fs: 0,
          disablekb: 1,
          playsinline: 1,
          enablejsapi: 1,
        };
        if (currentUser?.role === "student") {
          youtubeConfig.vq = 'hd720';
        }

        const playerElement = document.createElement('div');
        playerElement.classList.add('plyr__video-embed');
        playerElement.setAttribute('data-plyr-provider', 'youtube');
        playerElement.setAttribute('data-plyr-embed-id', videoId);
        
        playerRef.current.appendChild(playerElement);

        // تهيئة Plyr
        const player = new window.Plyr(playerElement, {
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'duration',
            'mute',
            'volume',
            'settings',
            'fullscreen'
          ],
          settings: ['quality', 'speed'],
          youtube: youtubeConfig,
          autoplay: autoplay,
          muted: muted,
          hideControls: false,
          clickToPlay: true,
          keyboard: { focused: true, global: false },
          tooltips: { controls: true, seek: true },
          captions: { active: false, language: 'ar' }
        });

        // تخصيص الألوان
        const style = document.createElement('style');
        style.textContent = `
          .plyr--video {
            border-radius: 12px;
            overflow: hidden;
            background: #000;
          }
          .plyr__control--overlaid {
            background: rgba(212, 175, 55, 0.9);
          }
          .plyr__control--overlaid:hover {
            background: rgba(212, 175, 55, 1);
          }
          .plyr__controls {
            background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
            color: #fff;
          }
          .plyr__control {
            color: #fff;
          }
          .plyr__control:hover {
            background: rgba(212, 175, 55, 0.2);
          }
          .plyr__control.plyr__tab-focus {
            box-shadow: 0 0 0 2px #D4AF37;
          }
          .plyr__progress__buffer {
            color: rgba(212, 175, 55, 0.3);
          }
          .plyr__progress__played {
            color: #D4AF37;
          }
          .plyr__volume__display {
            color: #fff;
          }
          .plyr__menu {
            background: #171E31;
            border: 1px solid #D4AF37;
            border-radius: 8px;
          }
          .plyr__menu__container .plyr__control {
            color: #fff;
          }
          .plyr__menu__container .plyr__control:hover {
            background: rgba(212, 175, 55, 0.2);
          }
          /* إخفاء عناصر يوتيوب المتبقية ومنع التفاعل */
          .plyr__video-embed iframe {
            pointer-events: none !important;
          }
          /* إخفاء العلامات التجارية والأزرار */
          .ytp-watermark, .ytp-chrome-top, .ytp-chrome-bottom,
          .video-title, .ytp-settings-button, .ytp-share-panel,
          .ytp-button[data-tooltip-target-id="ytp-share-label"],
          .ytp-channel-title, .ytp-video-title, .ytp-branding {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          /* منع النقر عبر إلى يوتيوب */
          .plyr__video-wrapper::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 2;
            pointer-events: auto;
          }
          .plyr__video-embed {
            position: relative;
            z-index: 1;
          }
        `;
        document.head.appendChild(style);

        // تنظيف عند إلغاء التحميل
        return () => {
          if (player) {
            player.destroy();
          }
        };
      }
    };
    document.head.appendChild(script);

    return () => {
      // تنظيف الموارد
      const existingLink = document.querySelector('link[href*="plyr.css"]');
      const existingScript = document.querySelector('script[src*="plyr.polyfilled.js"]');
      if (existingLink) existingLink.remove();
      if (existingScript) existingScript.remove();
    };
  }, [isPasswordVerified, isBlocked, videoId, autoplay, muted]);

  // قيود أمان للطلاب: منع النسخ، التبويبات الجديدة، والتفاعل غير المرغوب (خارج اللاعب)
  useEffect(() => {
    if (currentUser?.role !== "student" || !isPasswordVerified || !playerRef.current) return;

    const playerElement = playerRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      // منع النسخ والتحديد عالمياً
      if (e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 'a' || e.key === 's')) {
        e.preventDefault();
        return false;
      }
      // محاولة منع التبويبات الجديدة والإغلاق والـ Home
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 't' || e.key.toLowerCase() === 'n' || e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        return false;
      }
      if (e.key.toLowerCase() === 'f12' || e.key === 'F11') {
        e.preventDefault();
        return false;
      }
      // منع التنقل
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // السماح بالكليك الأيمن داخل اللاعب فقط
      if (!playerElement.contains(e.target as Node)) {
        e.preventDefault();
      }
      return false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      // منع السحب والضغط خارج اللاعب
      if (!playerElement.contains(e.target as Node)) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('selectstart', () => false);
    document.addEventListener('dragstart', () => false);

    // CSS لمنع التحديد داخل اللاعب
    playerElement.style.userSelect = 'none';
    playerElement.style.webkitUserSelect = 'none';

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('selectstart', () => false);
      document.removeEventListener('dragstart', () => false);
      if (playerElement) {
        playerElement.style.userSelect = '';
        playerElement.style.webkitUserSelect = '';
      }
    };
  }, [currentUser?.role, isPasswordVerified]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError("يرجى إدخال كلمة المرور");
      return;
    }

    setIsSubmitting(true);
    setPasswordError("");

    // محاكاة التحقق من كلمة المرور
    setTimeout(() => {
      if (passwordInput === password) {
        setIsPasswordVerified(true);
        setShowPasswordPrompt(false);
        setPasswordInput("");
      } else {
        setPasswordError("كلمة المرور غير صحيحة");
      }
      setIsSubmitting(false);
    }, 500);
  };

  const handleClose = () => {
    setPasswordInput("");
    setPasswordError("");
    setShowPassword(false);
    setShowPasswordPrompt(false);
  };

  // إذا كان الطالب محظور
  if (isBlocked) {
    return (
      <div className={`flex items-center justify-center bg-physics-dark rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h3 className="text-xl font-bold text-red-500 mb-2">غير مسموح بالمشاهدة</h3>
          <p className="text-gray-400">عذراً، لا يمكنك مشاهدة هذا الفيديو</p>
        </div>
      </div>
    );
  }

  // إذا كان الرابط غير صحيح
  if (!videoId) {
    return (
      <div className={`flex items-center justify-center bg-physics-dark rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-red-500 mb-2">رابط غير صحيح</h3>
          <p className="text-gray-400">رابط فيديو يوتيوب غير صالح</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* مشغل الفيديو */}
      {isPasswordVerified ? (
        <div className="relative">
          <div ref={playerRef} className="w-full aspect-video bg-black rounded-lg overflow-hidden" />
          {title && (
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
              {title}
            </div>
          )}
        </div>
      ) : (
        // شاشة كلمة المرور
        <div className={`flex items-center justify-center bg-physics-dark rounded-lg aspect-video ${className}`}>
          <div className="text-center p-8">
            <div className="text-physics-gold text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-physics-gold mb-2">فيديو محمي</h3>
            <p className="text-gray-400 mb-6">هذا الفيديو محمي بكلمة مرور</p>
            <button
              onClick={() => setShowPasswordPrompt(true)}
              className="bg-physics-gold text-physics-dark px-6 py-3 rounded-lg font-medium hover:bg-physics-gold/90 transition-colors"
            >
              إدخال كلمة المرور
            </button>
          </div>
        </div>
      )}
      {/* نافذة إدخال كلمة المرور */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-physics-dark rounded-lg p-6 w-full max-w-md border border-physics-gold/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-physics-gold flex items-center gap-2">
                <Lock size={24} />
                فيديو محمي بكلمة مرور
              </h2>
              <button
                type="button"
                className="text-gray-400 hover:text-white transition-colors"
                onClick={handleClose}
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 text-sm">
                {title && `الفيديو: ${title}`}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                يرجى إدخال كلمة المرور لمشاهدة هذا الفيديو
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-physics-gold" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-physics-navy border border-physics-gold/30 rounded-lg px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-physics-gold transition-colors"
                  placeholder="كلمة المرور"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError("");
                  }}
                  disabled={isSubmitting}
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-physics-gold transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !passwordInput.trim()}
                  className="flex-1 bg-physics-gold text-physics-dark py-3 rounded-lg font-medium hover:bg-physics-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "جاري التحقق..." : "تأكيد"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// إضافة تعريف Plyr للـ TypeScript
declare global {
  interface Window {
    Plyr: any;
  }
}

export default PlyrYouTubePlayer;

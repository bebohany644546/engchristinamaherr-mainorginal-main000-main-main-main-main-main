import React, { useEffect, useState } from 'react';

interface PhysicsLoaderProps {
  onComplete?: () => void;
}

export const PhysicsLoader: React.FC<PhysicsLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1500; // 1.5 ثانية فقط - سريع جداً

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);

      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        setIsComplete(true);
        setTimeout(() => {
          onComplete?.();
        }, 300);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-500 ${isComplete ? 'opacity-0' : 'opacity-100'}`}>
      {/* خلفية بسيطة وسريعة */}
      <div className="absolute inset-0 bg-gradient-to-br from-physics-dark via-physics-navy to-physics-dark overflow-hidden">
        {/* جزيئات متحركة - مخفضة للأداء */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-physics-gold rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 2}s infinite linear`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* خطوط الطاقة - مخفضة للأداء */}
        <div className="absolute inset-0">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-physics-gold to-transparent opacity-20"
              style={{
                top: `${20 + i * 20}%`,
                left: '0%',
                right: '0%',
                animation: `pulse ${3 + i * 0.5}s infinite`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">

        {/* رسوم فيزيائية مبسطة */}
        <div className="relative mb-12">
          <svg width="300" height="200" viewBox="0 0 300 200" className="mx-auto drop-shadow-xl">
            <defs>
              <linearGradient id="atomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FFA500" />
              </linearGradient>
              <linearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00BFFF" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FF6B6B" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* الذرة المركزية - مبسطة */}
            <g transform="translate(150,100)">
              {/* النواة */}
              <circle
                cx="0"
                cy="0"
                r="10"
                fill="url(#atomGrad)"
                filter="url(#glow)"
              >
                <animate attributeName="r" values="10;13;10" dur="2s" repeatCount="indefinite"/>
              </circle>

              {/* المدارات - مخفضة */}
              {[...Array(2)].map((_, i) => (
                <ellipse
                  key={i}
                  cx="0"
                  cy="0"
                  rx={25 + i * 20}
                  ry={12 + i * 10}
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth="1"
                  opacity="0.4"
                  transform={`rotate(${i * 60})`}
                />
              ))}

              {/* الإلكترونات - مخفضة */}
              {[...Array(3)].map((_, i) => (
                <circle
                  key={i}
                  r="3"
                  fill="#00BFFF"
                  filter="url(#glow)"
                >
                  <animateMotion
                    dur={`${2.5 + i * 0.5}s`}
                    repeatCount="indefinite"
                    path={`M ${25 + (i % 2) * 20} 0 A ${25 + (i % 2) * 20} ${12 + (i % 2) * 10} 0 1 1 ${-(25 + (i % 2) * 20)} 0 A ${25 + (i % 2) * 20} ${12 + (i % 2) * 10} 0 1 1 ${25 + (i % 2) * 20} 0`}
                    transform={`rotate(${i * 60})`}
                  />
                </circle>
              ))}
            </g>

            {/* معادلات فيزيائية - مبسطة */}
            <g opacity={progress > 30 ? "1" : "0"} style={{ transition: 'opacity 0.3s' }}>
              <text x="30" y="40" fill="#FFD700" fontSize="16" fontFamily="monospace" fontWeight="bold">
                E = mc²
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
              </text>
              <text x="200" y="60" fill="#00BFFF" fontSize="14" fontFamily="monospace">
                F = ma
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2.2s" repeatCount="indefinite"/>
              </text>
            </g>

            {/* دائرة الطاقة - مبسطة */}
            {progress > 50 && (
              <g transform="translate(150,100)">
                <circle
                  cx="0"
                  cy="0"
                  r="40"
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth="2"
                  opacity="0.5"
                >
                  <animate attributeName="r" values="30;50;30" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite"/>
                </circle>
              </g>
            )}
          </svg>
        </div>

        {/* شريط التقدم البسيط */}
        <div className="w-full max-w-md mb-8">
          <div className="relative">
            <div className="w-full h-3 bg-physics-navy/40 rounded-full overflow-hidden border border-physics-gold/30">
              <div
                className="h-full bg-gradient-to-r from-physics-gold to-yellow-400 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* النسبة المئوية */}
            <div className="text-center mt-3">
              <span className="text-physics-gold font-bold text-lg">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>

        {/* نقاط متحركة */}
        <div className="text-center">
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-physics-gold rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-physics-gold rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-2 h-2 bg-physics-gold rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
      </div>

      {/* CSS للحركات المخصصة */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

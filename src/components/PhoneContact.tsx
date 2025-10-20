import React, { useState } from "react";
import { Phone, MessageCircle, X } from "lucide-react";

export function PhoneContact() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const phoneNumbers = ["01228895553", "01273994390", "01220529753"];
  
  const handleWhatsAppClick = (phoneNumber: string) => {
    // Open WhatsApp with the phone number
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    window.open(whatsappUrl, '_blank');
    setIsPopoverOpen(false);

    // Play sound effect
    const audio = new Audio("/click-sound.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Sound play failed:", e));
  };
  
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="relative">
        {/* زر الاتصال الرئيسي - ساكن وأصغر */}
        <button 
          onClick={() => setIsPopoverOpen(!isPopoverOpen)} 
          className="flex items-center justify-center w-12 h-12 bg-physics-gold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border-2 border-physics-navy"
        >
          <Phone className="text-physics-navy" size={20} />
        </button>
        
        {/* نافذة الأرقام - أصغر */}
        {isPopoverOpen && (
          <div className="absolute bottom-16 left-0 bg-physics-dark border-2 border-physics-gold rounded-xl shadow-xl p-3 w-64 animate-fade-in">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-physics-gold font-bold text-base font-tajawal flex items-center gap-1">
                <Phone size={16} />
                تواصل معنا
              </h3>
              <button 
                onClick={() => setIsPopoverOpen(false)} 
                className="text-white hover:text-physics-gold transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* قائمة الأرقام */}
            <div className="space-y-2">
              {phoneNumbers.map((phoneNumber) => (
                <div 
                  key={phoneNumber} 
                  className="flex items-center justify-between bg-physics-navy/50 p-2 rounded-lg border border-physics-gold/30"
                >
                  <span className="text-white font-tajawal text-sm" dir="ltr">{phoneNumber}</span>
                  <div className="flex gap-1">
                    {/* زر الاتصال */}
                    <button 
                      onClick={() => {
                        window.location.href = `tel:${phoneNumber}`;
                        setIsPopoverOpen(false);
                      }} 
                      className="bg-physics-gold text-physics-navy p-1.5 rounded-md hover:bg-yellow-500 transition-colors"
                      title="اتصال"
                    >
                      <Phone size={14} />
                    </button>
                    
                    {/* زر واتساب */}
                    <button 
                      onClick={() => handleWhatsAppClick(phoneNumber)} 
                      className="bg-green-500 text-white p-1.5 rounded-md hover:bg-green-600 transition-colors"
                      title="واتساب"
                    >
                      <MessageCircle size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-gray-400 text-xs font-tajawal mt-2 text-center">
              📞 اتصل أو راسلنا عبر واتساب
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
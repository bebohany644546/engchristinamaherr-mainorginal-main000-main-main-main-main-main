
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // تحديد ما إذا كانت رسالة نجاح أو خطأ
        const isSuccess = String(title).includes("✓") || String(title).includes("✅") || 
                         String(title).toLowerCase().includes("تم") || String(title).toLowerCase().includes("نجاح");
        const isError = props.variant === "destructive" || String(title).includes("❌") || 
                       String(title).toLowerCase().includes("خطأ") || String(title).toLowerCase().includes("فشل");
        
        // تطبيق التنسيق المخصص بناءً على نوع الرسالة
        const customClasses = isSuccess
          ? "bg-gradient-to-r from-green-800 to-green-900/95 border-green-500 text-white shadow-green-500/30"
          : isError
            ? "bg-gradient-to-r from-red-800 to-red-900/95 border-red-500 text-white shadow-red-500/30"
            : "bg-gradient-to-r from-physics-dark to-physics-navy border-physics-gold text-white shadow-physics-gold/30";
            
        return (
          <Toast 
            key={id} 
            {...props}
            className={`${customClasses} shadow-2xl border-[3px] backdrop-blur-md animate-in slide-in-from-top-2 duration-300 rounded-xl`}
            style={{ fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif" }}
          >
            <div className="grid gap-2 pr-2">
              {title && (
                <ToastTitle 
                  className="text-xl font-bold tracking-wide leading-relaxed"
                  style={{ 
                    fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
                    unicodeBidi: 'plaintext',
                    direction: 'rtl'
                  }}
                >
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription 
                  className="text-base opacity-95 leading-relaxed"
                  style={{ 
                    fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
                    unicodeBidi: 'plaintext',
                    direction: 'rtl'
                  }}
                >
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="hover:bg-white/20 rounded-md transition-colors" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

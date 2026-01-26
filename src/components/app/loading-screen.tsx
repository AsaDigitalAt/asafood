import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  isVisible: boolean;
}

export default function LoadingScreen({ isVisible }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-background/90 backdrop-blur-lg z-[100] flex justify-center items-center",
        "transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className={cn(
          "glass-card p-10 md:p-16 rounded-3xl text-center shadow-2xl flex flex-col items-center max-w-md w-[90%]",
          "transition-transform duration-300",
          isVisible ? "scale-100" : "scale-95"
      )}>
        <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(56,189,248,0.2)]"></div>
        <h3 className="text-xl text-white font-bold tracking-widest uppercase animate-pulse">
          Analisando Dados
        </h3>
        <p className="text-muted-foreground mt-4 text-sm">
          A inteligência artificial está processando suas informações...
        </p>
      </div>
    </div>
  );
}

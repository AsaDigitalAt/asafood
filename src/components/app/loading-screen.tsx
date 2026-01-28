import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  isVisible: boolean;
}

export default function LoadingScreen({ isVisible }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-primary z-[100] flex justify-center items-center",
        "transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className={cn(
          "p-10 md:p-16 rounded-3xl text-center flex flex-col items-center max-w-lg w-[90%]",
          "transition-transform duration-300",
          isVisible ? "scale-100" : "scale-95"
      )}>
        <div className="w-20 h-20 border-4 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin mb-8"></div>
        <h3 className="text-xl text-primary-foreground font-bold tracking-widest animate-pulse">
          Aguarde enquanto sua tela está sendo carregada.
        </h3>
      </div>
    </div>
  );
}

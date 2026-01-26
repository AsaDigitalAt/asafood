"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { BarChart3, Rocket, Store, Star, LogOut, Shield } from "lucide-react";
import { useAuth, useUser, useMemoFirebase } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc, getFirestore } from "firebase/firestore";


type View = "login" | "diagnosis" | "action-plan" | "restaurant" | "admin";

type AppHeaderProps = {
  currentView: View;
  onNavigate: (view: View) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
};

export function AppHeader({ currentView, onNavigate, isLoggedIn, onLogout }: AppHeaderProps) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const { user } = useUser();
  const firestore = getFirestore(auth.app);

  const adminRoleRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    onLogout();
  };
  
  const NavItem = ({ view, icon, text, adminOnly = false }: { view: View; icon: React.ReactNode; text: string, adminOnly?: boolean }) => {
    if (adminOnly && !isAdmin) return null;

    return (
        <div
          className={cn(
            "flex items-center gap-4 p-4 rounded-lg text-muted-foreground font-semibold text-sm transition-colors cursor-pointer",
            "hover:bg-primary/10 hover:text-white",
            currentView === view && "bg-primary/10 text-white"
          )}
          onClick={() => {
            onNavigate(view);
            setMenuOpen(false);
          }}
        >
          {icon}
          <span>{text}</span>
        </div>
    )
  };
  
  const userInitials = user?.email?.substring(0, 2).toUpperCase() || '...';

  return (
    <header className={cn(
      "fixed top-0 left-0 w-full p-6 md:p-10 flex justify-between items-center z-50",
      "bg-gradient-to-b from-background/80 to-transparent",
      "transition-opacity duration-1000",
      isLoggedIn ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div className="flex items-center gap-5">
        {/* Menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!isMenuOpen)}
            className="bg-white/5 border border-white/10 w-12 h-12 rounded-xl flex flex-col justify-center items-center gap-1.5 cursor-pointer transition-colors hover:bg-primary/10 hover:border-primary"
          >
            <span className="w-6 h-0.5 bg-white rounded-full"></span>
            <span className="w-4 h-0.5 bg-white rounded-full"></span>
            <span className="w-6 h-0.5 bg-white rounded-full"></span>
          </button>
          <nav className={cn(
            "absolute top-16 left-0 glass-card backdrop-blur-2xl rounded-2xl p-2 min-w-72",
            "opacity-0 invisible -translate-y-5 transition-all duration-300",
            isMenuOpen && "opacity-100 visible translate-y-0"
          )}>
            <NavItem view="diagnosis" icon={<BarChart3 className="w-5 h-5" />} text="Diagnóstico de Performance" />
            <NavItem view="action-plan" icon={<Rocket className="w-5 h-5" />} text="Meu Plano de Ação" />
            <NavItem view="restaurant" icon={<Store className="w-5 h-5" />} text="Meu Restaurante" />
            <NavItem view="admin" icon={<Shield className="w-5 h-5" />} text="Painel do Administrador" adminOnly={true} />
          </nav>
        </div>
        {/* Brand */}
        <div className="text-2xl font-extrabold text-white tracking-tight">
          <span className="text-primary">Asa</span> Food
        </div>
      </div>

      {/* User Profile */}
      <div ref={profileRef} className="relative">
        <div onClick={() => setProfileOpen(!isProfileOpen)} className="flex items-center gap-4 cursor-pointer">
          <div className="relative group">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-primary/30 flex justify-center items-center text-white font-bold transition-all duration-300 group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(56,189,248,0.5)]">
              {userInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
          </div>
        </div>
        <div className={cn(
          "absolute top-full right-0 mt-4 glass-card backdrop-blur-lg p-2 rounded-xl whitespace-nowrap",
          "opacity-0 invisible -translate-y-2 transition-all duration-300 shadow-2xl",
          isProfileOpen && "opacity-100 visible translate-y-0"
        )}>
          <div className="p-2 px-4">
             <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Plano Ativo</span>
             <div className="flex items-center gap-2 text-primary font-bold text-base text-shadow-[0_0_10px_rgba(56,189,248,0.3)]">
               <Star className="w-5 h-5 fill-current" /> {isAdmin ? 'Admin' : 'Premium'}
             </div>
          </div>
          <div className="border-t border-white/10 my-1"></div>
          <button onClick={handleLogout} className="flex items-center gap-3 p-2 px-4 rounded-lg text-sm font-semibold text-muted-foreground w-full text-left hover:bg-destructive/10 hover:text-red-400">
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}

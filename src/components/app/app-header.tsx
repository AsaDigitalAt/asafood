"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BarChart3, Rocket, Store, Star, LogOut, Shield, BookOpenCheck, Calculator, Lock, LayoutGrid } from "lucide-react";
import { useAuth, useUser, useMemoFirebase, useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc } from "firebase/firestore";

type View = "hub" | "login" | "diagnosis" | "action-plan" | "restaurant" | "admin" | "menu-analysis" | "price-calculator";

type AppHeaderProps = {
  currentView: View;
  onNavigate: (view: View) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
};

const planLabels: Record<string, string> = {
  convidado: "Convidado",
  plano_unico: "Plano Único",
  plano_duplo: "Plano Duplo",
  plano_acelerador: "Plano Acelerador",
  desenvolvedor: "Desenvolvedor",
};

const planLimits: Record<string, number> = {
  convidado: 10,
  plano_unico: 1,
  plano_duplo: 2,
  plano_acelerador: 4,
  desenvolvedor: Infinity,
};

export function AppHeader({ currentView, onNavigate, isLoggedIn, onLogout }: AppHeaderProps) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<any>(userDocRef);

  const adminRoleRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const NavItem = ({
    view,
    icon,
    text,
    adminOnly = false,
    locked = false,
  }: {
    view: View;
    icon: React.ReactNode;
    text: string;
    adminOnly?: boolean;
    locked?: boolean;
  }) => {
    if (adminOnly && !isAdmin) return null;

    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 p-4 rounded-xl font-bold text-sm transition-all duration-300",
          locked ? "text-white/40 cursor-not-allowed" : "cursor-pointer text-white/60 hover:bg-white/10 hover:text-white",
          currentView === view && !locked && "bg-white/10 text-white"
        )}
        onClick={() => {
          if (locked) return;
          onNavigate(view);
          setMenuOpen(false);
        }}
      >
        <div className="flex items-center gap-4">
          {icon}
          <span>{text}</span>
        </div>
        {locked && <Lock className="w-4 h-4 text-orange-300/80" />}
      </div>
    );
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || '...';

  const planName = userProfile?.plan ? planLabels[userProfile.plan] ?? userProfile.plan : "Carregando...";
  const usageCount = userProfile?.usage?.diagnosticsUsed ?? 0;
  const isDeveloper = userProfile?.plan === 'desenvolvedor' || userProfile?.role === 'developer';
  const usageLimit = isDeveloper ? Infinity : (userProfile?.quota?.diagnosticsMax ?? planLimits[userProfile?.plan] ?? 0);
  const usageText = isDeveloper ? `${usageCount} / ∞` : `${usageCount} / ${usageLimit}`;

  const forceSolidHeader = currentView === 'price-calculator' || currentView === 'action-plan';

  return (
    <header className={cn(
      "fixed top-0 left-0 w-full px-6 md:px-12 flex justify-between items-center z-50 transition-all duration-500 print:hidden",
      isLoggedIn ? "opacity-100" : "opacity-0 pointer-events-none",
      (scrolled || forceSolidHeader) ? "bg-primary/95 backdrop-blur-xl py-4 shadow-2xl" : "bg-transparent py-6 md:py-10"
    )}>
      <div className="flex items-center gap-6">
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!isMenuOpen)}
            className={cn(
              "border w-14 h-14 rounded-2xl flex flex-col justify-center items-center gap-1.5 cursor-pointer transition-all duration-300 backdrop-blur-md",
              "bg-white/10 border-white/20 hover:bg-white/20"
            )}
          >
            <span className="w-6 h-0.5 rounded-full bg-white"></span>
            <span className="w-4 h-0.5 rounded-full bg-white"></span>
            <span className="w-6 h-0.5 rounded-full bg-white"></span>
          </button>

          <nav className={cn(
            "absolute top-18 left-0 bg-black/60 backdrop-blur-2xl rounded-3xl p-3 min-w-72 border border-white/10 shadow-2xl",
            "opacity-0 invisible -translate-y-5 transition-all duration-500",
            isMenuOpen && "opacity-100 visible translate-y-0"
          )}>
            <NavItem view="hub" icon={<LayoutGrid className="w-5 h-5" />} text="Início (Hub)" />
            <NavItem view="diagnosis" icon={<BarChart3 className="w-5 h-5" />} text="Diagnóstico" />
            <NavItem view="action-plan" icon={<Rocket className="w-5 h-5" />} text="Meu Plano de Ação" />
            <NavItem view="price-calculator" icon={<Calculator className="w-5 h-5" />} text="Calculadora de Preços" />
            <NavItem view="restaurant" icon={<Store className="w-5 h-5" />} text="Meu Perfil" />
            <NavItem view="admin" icon={<Shield className="w-5 h-5" />} text="Painel do Administrador" adminOnly={true} />
            <NavItem view="menu-analysis" icon={<BookOpenCheck className="w-5 h-5" />} text="Análise de Cardápio" locked={true} />
          </nav>
        </div>
        <div onClick={() => onNavigate('hub')} className="cursor-pointer transition-transform hover:scale-105 active:scale-95">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/base-arquivos.firebasestorage.app/o/Logo%20ASA%20OFF.png?alt=media&token=62ef02f9-1b75-4a7a-b496-b56184407e2f"
            alt="Asa Food Logo"
            width={130}
            height={32}
            priority
          />
        </div>
      </div>

      <div ref={profileRef} className="relative">
        <div onClick={() => setProfileOpen(!isProfileOpen)} className="flex items-center gap-4 cursor-pointer">
          <div className="relative group">
            <div className={cn(
              "w-14 h-14 rounded-full flex justify-center items-center font-bold transition-all duration-500 backdrop-blur-md",
              "bg-white/20 border-2 border-white/30 text-white group-hover:border-white group-hover:bg-white/30"
            )}>
              {userInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#FE1413] rounded-full"></span>
          </div>
        </div>
        <div className={cn(
          "absolute top-full right-0 mt-4 bg-black/60 backdrop-blur-2xl p-4 rounded-3xl whitespace-nowrap min-w-64 shadow-2xl border border-white/10",
          "opacity-0 invisible -translate-y-2 transition-all duration-500",
          isProfileOpen && "opacity-100 visible translate-y-0"
        )}>
          <div className="p-3">
            <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] block mb-2 font-black">Plano Atual</span>
            <div className="flex items-center gap-3 text-white font-extrabold text-lg">
              <Star className="w-5 h-5 fill-white/20 text-white/40" /> {planName}
            </div>
          </div>
          <div className="p-3">
            <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] block mb-2 font-black">Gerações Mensais</span>
            <div className="flex items-center gap-3 text-white font-extrabold text-lg">
              {usageText}
            </div>
          </div>
          <div className="border-t border-white/10 my-3"></div>
          <button onClick={handleLogout} className="flex items-center gap-4 p-4 rounded-2xl text-sm font-black text-white/60 w-full text-left hover:bg-white/10 hover:text-white transition-all">
            <LogOut className="w-5 h-5" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </header>
  );
}
"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Rocket, 
  Calculator, 
  BookOpenCheck, 
  Store, 
  ArrowRight,
  Star,
  Zap
} from "lucide-react";
import { useUser, useMemoFirebase, useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc } from "firebase/firestore";

type ToolCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  locked?: boolean;
  delay?: string;
};

const ToolCard = ({ title, description, icon, onClick, locked, delay }: ToolCardProps) => {
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={!locked ? onClick : undefined}
      className={cn(
        "group relative overflow-hidden bg-white/5 border border-white/10 rounded-[2rem] p-8 transition-all duration-500 backdrop-blur-sm",
        locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-white/30 hover:-translate-y-1",
        "animate-fade-up",
        delay
      )}
    >
      {/* Glow Effect */}
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-[2rem]"
        style={{
          background: `radial-gradient(800px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(255,255,255,0.35), transparent 50%)`
        }}
      />

      <div className="flex flex-col h-full justify-between gap-6 relative z-10">
        <div className="flex justify-between items-start">
          <div className="p-4 rounded-2xl bg-white/10 text-white transition-all duration-500 group-hover:scale-110 group-hover:bg-white/20">
            {icon}
          </div>
          {locked ? (
            <div className="px-3 py-1 rounded-full bg-white/10 text-white/50 text-[10px] font-bold uppercase tracking-widest border border-white/10">
              Em Breve
            </div>
          ) : (
            <ArrowRight className="w-5 h-5 text-white/30 transition-all duration-500 group-hover:translate-x-1 group-hover:text-white" />
          )}
        </div>
        <div>
          <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">{title}</h3>
          <p className="text-white/70 text-sm leading-relaxed font-medium">{description}</p>
        </div>
      </div>
    </div>
  );
};

export function HubView({ onNavigate }: { onNavigate: (view: any) => void }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<any>(userDocRef);

  const planName = userProfile?.plan === 'plano_acelerador' ? 'Plano Acelerador' : 
                   userProfile?.plan === 'desenvolvedor' ? 'Modo Desenvolvedor' : 'Plano AsaFood';

  return (
    <div className="min-h-screen bg-primary pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Seção Usuário */}
        <header className="mb-16 animate-fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10 backdrop-blur-md">
                  Bem-vindo à AsaFood
                </div>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">
                Olá, <span className="text-white/40">{user?.email?.split('@')[0]}</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-6 bg-white/5 border border-white/10 p-6 md:p-8 rounded-[2.5rem] backdrop-blur-xl">
               <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner">
                 <Star className="w-8 h-8 fill-white/20" />
               </div>
               <div>
                 <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-black block mb-1">Status da Conta</span>
                 <p className="text-white font-extrabold text-2xl tracking-tight">{planName}</p>
               </div>
            </div>
          </div>
        </header>

        {/* Grid de Ferramentas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ToolCard 
            title="Diagnóstico"
            description="Analise o funil do seu iFood e identifique gargalos que impedem suas vendas de crescerem."
            icon={<BarChart3 className="w-8 h-8" />}
            onClick={() => onNavigate("diagnosis")}
            delay="[animation-delay:100ms]"
          />
          <ToolCard 
            title="Plano de Ação"
            description="Acesse seus relatórios salvos e siga o passo a passo personalizado gerado pela nossa IA."
            icon={<Rocket className="w-8 h-8" />}
            onClick={() => onNavigate("action-plan")}
            delay="[animation-delay:200ms]"
          />
          <ToolCard 
            title="Precificação"
            description="Calcule o preço ideal dos seus pratos com base no custo real de cada insumo e margem desejada."
            icon={<Calculator className="w-8 h-8" />}
            onClick={() => onNavigate("price-calculator")}
            delay="[animation-delay:300ms]"
          />
          <ToolCard 
            title="Análise Gratuita"
            description="Receba uma análise personalizada do seu perfil no iFood, sem custos e sem compromisso."
            icon={<Zap className="w-8 h-8" />}
            onClick={() => onNavigate("free-analysis")}
            delay="[animation-delay:350ms]"
          />
          <ToolCard 
            title="Análise de Cardápio"
            description="Deixe nossa IA avaliar suas fotos e descrições para tornar seu cardápio irresistível."
            icon={<BookOpenCheck className="w-8 h-8" />}
            onClick={() => onNavigate("menu-analysis")}
            locked={true}
            delay="[animation-delay:400ms]"
          />
          <ToolCard 
            title="Meu Perfil"
            description="Gerencie as informações básicas do seu estabelecimento e dados de faturamento mensal."
            icon={<Store className="w-8 h-8" />}
            onClick={() => onNavigate("restaurant")}
            delay="[animation-delay:500ms]"
          />
        </div>
      </div>
    </div>
  );
}
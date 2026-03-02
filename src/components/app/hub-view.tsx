
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
  User as UserIcon,
  Star
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

const ToolCard = ({ title, description, icon, onClick, locked, delay }: ToolCardProps) => (
  <div 
    onClick={!locked ? onClick : undefined}
    className={cn(
      "group relative overflow-hidden glass-card rounded-3xl p-8 transition-all duration-500 border-white/10",
      locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-white/40 hover:bg-white/5 hover:-translate-y-1",
      "animate-fade-up",
      delay
    )}
  >
    <div className="flex flex-col h-full justify-between gap-6">
      <div className="flex justify-between items-start">
        <div className="p-4 rounded-2xl bg-white/10 text-white transition-colors group-hover:bg-white/20">
          {icon}
        </div>
        {locked ? (
          <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-bold uppercase tracking-widest border border-amber-500/30">
            Em Breve
          </div>
        ) : (
          <ArrowRight className="w-5 h-5 text-white/30 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-white" />
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/60 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

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
    <div className="min-h-screen bg-primary pt-32 pb-20 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Seção Usuário */}
        <header className="mb-16 animate-fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-widest border border-white/20">
                  Bem-vindo de volta
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter">
                Olá, <span className="opacity-60">{user?.email?.split('@')[0]}</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
               <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                 <Star className="w-7 h-7 fill-white/20" />
               </div>
               <div>
                 <span className="text-white/40 text-xs uppercase tracking-widest font-bold block mb-1">Status da Conta</span>
                 <p className="text-white font-bold text-xl">{planName}</p>
               </div>
            </div>
          </div>
        </header>

        {/* Grid de Ferramentas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            title="Análise de Cardápio"
            description="Deixe nossa IA avaliar suas fotos e descrições para tornar seu cardápio irresistível."
            icon={<BookOpenCheck className="w-8 h-8" />}
            onClick={() => onNavigate("menu-analysis")}
            locked={true}
            delay="[animation-delay:400ms]"
          />
          <ToolCard 
            title="Meu Restaurante"
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

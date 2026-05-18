"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Rocket,
  Calculator,
  MessageSquare,
  Star,
  ArrowLeft,
  ChevronRight,
  SearchCheck,
  Infinity as InfinityIcon,
  Edit2,
  Check,
  X
} from "lucide-react";
import { useUser, useMemoFirebase, useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useCollection } from "@/firebase/firestore/use-collection";
import { doc, collection, query, orderBy, limit, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAccessControl } from "@/hooks/use-access-control";

type RestaurantViewProps = {
  onBack: () => void;
  onNavigate: (view: any) => void;
};

const planLabels: Record<string, string> = {
  convidado: "Convidado",
  plano_unico: "Plano Essencial",
  plano_duplo: "Plano Performance",
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

export function RestaurantView({ onBack, onNavigate }: RestaurantViewProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editedName, setEditedName] = React.useState("");

  // User Profile Data
  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<any>(userDocRef);

  // Latest Diagnostics (Migrated to tenants/{tenantId}/diagnostics)
  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.tenantId) return null;
    return query(
      collection(firestore, `tenants/${userProfile.tenantId}/diagnostics`),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
  }, [firestore, userProfile?.tenantId]);
  const { data: reports } = useCollection<any>(reportsQuery);

  // Latest Price Calculations
  const calcsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/priceCalculations`),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
  }, [firestore, user]);
  const { data: calculations } = useCollection<any>(calcsQuery);
  
  // Latest General Analyses
  const analysesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/analyses`),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
  }, [firestore, user]);
  const { data: analyses } = useCollection<any>(analysesQuery);

  const planName = userProfile?.plan ? planLabels[userProfile.plan] : "Plano AsaFood";
  const isDeveloper = userProfile?.plan === 'desenvolvedor';
  const { diagnostics, pricing, freeAnalysis } = useAccessControl();

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) return;
    try {
      await updateDoc(doc(firestore, 'users', user.uid), { name: editedName.trim() });
      setIsEditingName(false);
    } catch (e) {
      console.error("Erro ao salvar nome:", e);
    }
  };

  return (
    <div className="min-h-screen bg-primary pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header com Botão Voltar */}
        <header className="flex items-center gap-6 animate-fade-up">
          <Button
            onClick={onBack}
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            Meu <span className="text-white/40">Perfil</span>
          </h1>
        </header>

        {/* Grid de Informações Macro */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Card de Usuário/Perfil */}
          <div className="lg:col-span-1 space-y-8 animate-fade-up [animation-delay:100ms]">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-white text-3xl font-black mb-6 border-2 border-white/20">
                  {user?.email?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex items-center justify-center gap-3 mb-1">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-xl px-3 py-1 text-white font-extrabold text-xl focus:outline-none focus:border-white/50 w-full max-w-[200px] text-center"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      />
                      <button onClick={handleSaveName} className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setIsEditingName(false)} className="p-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-extrabold text-white">
                        {userProfile?.name || user?.email?.split('@')[0]}
                      </h2>
                      <button 
                        onClick={() => {
                          setEditedName(userProfile?.name || user?.email?.split('@')[0] || "");
                          setIsEditingName(true);
                        }}
                        className="p-1.5 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-white/50 text-sm font-medium mb-8">
                  {user?.email}
                </p>
                <div className="w-full pt-8 border-t border-white/10 flex flex-col gap-4">
                  <div className="flex justify-between items-center text-xs uppercase tracking-widest font-black text-white/70">
                    <span>Plano Atual</span>
                    <span className="text-white">{planName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs uppercase tracking-widest font-black text-white/70">
                    <span>Membro desde</span>
                    <span className="text-white">
                      {userProfile?.createdAt?.toDate().toLocaleDateString('pt-BR') || '---'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-4">
              <Button
                onClick={() => window.open('https://wa.me/556193788529', '_blank')}
                className="w-full h-20 rounded-[2rem] bg-white text-primary hover:bg-white/90 font-black text-lg gap-4 shadow-xl transition-all hover:scale-[1.02] active:scale-95"
              >
                <MessageSquare className="w-6 h-6" />
                Falar com Especialista
              </Button>

              <Button
                onClick={() => window.open('/planos', '_blank')}
                className="w-full h-16 rounded-[2rem] bg-transparent border-2 border-white/20 text-white hover:bg-white/10 font-bold text-base gap-3 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Rocket className="w-5 h-5" />
                Fazer Upgrade de Plano
              </Button>
            </div>
          </div>

          {/* Seção de Dados e Histórico */}
          <div className="lg:col-span-2 space-y-8 animate-fade-up [animation-delay:200ms]">

            {/* Card de Uso por Recurso */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-[10px] uppercase tracking-[0.2em] font-black">Uso de Recursos</span>
                <div className="p-3 rounded-2xl bg-white/10 text-white">
                  <Star className="w-5 h-5 fill-white/20" />
                </div>
              </div>

              {/* Diagnóstico */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-bold text-white/80">Diagnóstico</span>
                  </div>
                  <span className="text-sm font-black text-white">
                    {isDeveloper ? (
                      <span className="text-white/60">∞</span>
                    ) : (
                      <>{diagnostics.used}<span className="text-white/30"> / {diagnostics.max}</span></>
                    )}
                  </span>
                </div>
                <Progress
                  value={isDeveloper ? 100 : diagnostics.max > 0 ? (diagnostics.used / diagnostics.max) * 100 : 0}
                  className="h-2.5 bg-white/10 [&>div]:bg-white rounded-full"
                />
                {!isDeveloper && (
                  <p className="text-[10px] text-white/30 font-medium">
                    {diagnostics.remaining} restante{diagnostics.remaining !== 1 ? 's' : ''} neste ciclo
                  </p>
                )}
              </div>

              {/* Análise Geral */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SearchCheck className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-bold text-white/80">Análise Geral</span>
                  </div>
                  <span className="text-sm font-black text-white">
                    {isDeveloper ? (
                      <span className="text-white/60">∞</span>
                    ) : (
                      <>{freeAnalysis.used}<span className="text-white/30"> / {freeAnalysis.max}</span></>
                    )}
                  </span>
                </div>
                <Progress
                  value={isDeveloper ? 100 : freeAnalysis.max > 0 ? (freeAnalysis.used / freeAnalysis.max) * 100 : 0}
                  className="h-2.5 bg-white/10 [&>div]:bg-white rounded-full"
                />
                {!isDeveloper && (
                  <p className="text-[10px] text-white/30 font-medium">
                    {freeAnalysis.remaining} restante{freeAnalysis.remaining !== 1 ? 's' : ''} neste ciclo
                  </p>
                )}
              </div>

              {/* Precificação */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-bold text-white/80">Precificação</span>
                  </div>
                  <span className="text-sm font-black text-white">
                    {isDeveloper ? (
                      <span className="text-white/60">∞</span>
                    ) : (
                      <>{pricing.used}<span className="text-white/30"> / {pricing.max}</span></>
                    )}
                  </span>
                </div>
                <Progress
                  value={isDeveloper ? 100 : pricing.max > 0 ? (pricing.used / pricing.max) * 100 : 0}
                  className="h-2.5 bg-white/10 [&>div]:bg-white rounded-full"
                />
                {!isDeveloper && (
                  <p className="text-[10px] text-white/30 font-medium">
                    {pricing.remaining} restante{pricing.remaining !== 1 ? 's' : ''} neste ciclo
                  </p>
                )}
              </div>

              <p className="text-[10px] text-white/30 font-medium border-t border-white/10 pt-4">
                Cotas reiniciam automaticamente todo dia 1º de cada mês.
              </p>
            </div>

            {/* Histórico Simplificado */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              {/* Últimos Diagnósticos */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-white/70" />
                  <h4 className="text-sm font-black text-white/70 uppercase tracking-widest">Últimos Diagnósticos</h4>
                </div>
                <div className="space-y-3">
                  {reports && reports.length > 0 ? reports.map((report: any) => (
                    <div
                      key={report.id}
                      onClick={() => onNavigate('action-plan')}
                      className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                    >
                      <span className="text-white font-bold text-sm truncate pr-4">{report.nome || report.input?.restaurantName}</span>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                    </div>
                  )) : (
                    <div className="p-5 rounded-2xl border border-dashed border-white/10 text-center text-xs text-white/30 font-medium">
                      Nenhum diagnóstico ainda
                    </div>
                  )}
                  {reports && reports.length > 0 && (
                    <button onClick={() => onNavigate('action-plan')} className="text-[10px] text-white/70 uppercase font-black hover:text-white transition-colors pl-1">
                      Ver todos
                    </button>
                  )}
                </div>
              </div>

              {/* Últimas Análises Gerais */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <SearchCheck className="w-5 h-5 text-white/70" />
                  <h4 className="text-sm font-black text-white/70 uppercase tracking-widest">Análises Gerais</h4>
                </div>
                <div className="space-y-3">
                  {analyses && analyses.length > 0 ? analyses.map((analysis: any) => (
                    <div
                      key={analysis.id}
                      onClick={() => onNavigate('my-analyses')}
                      className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                    >
                      <span className="text-white font-bold text-sm truncate pr-4">{analysis.restaurantName || "Restaurante"}</span>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                    </div>
                  )) : (
                    <div className="p-5 rounded-2xl border border-dashed border-white/10 text-center text-xs text-white/30 font-medium">
                      Nenhuma análise ainda
                    </div>
                  )}
                  {analyses && analyses.length > 0 && (
                    <button onClick={() => onNavigate('my-analyses')} className="text-[10px] text-white/70 uppercase font-black hover:text-white transition-colors pl-1">
                      Ver todos
                    </button>
                  )}
                </div>
              </div>

              {/* Últimas Precificações */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Calculator className="w-5 h-5 text-white/70" />
                  <h4 className="text-sm font-black text-white/70 uppercase tracking-widest">Produtos Precificados</h4>
                </div>
                <div className="space-y-3">
                  {calculations && calculations.length > 0 ? calculations.map((calc: any) => (
                    <div
                      key={calc.id}
                      onClick={() => onNavigate('price-calculator')}
                      className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                    >
                      <span className="text-white font-bold text-sm truncate pr-4">{calc.productName}</span>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                    </div>
                  )) : (
                    <div className="p-5 rounded-2xl border border-dashed border-white/10 text-center text-xs text-white/30 font-medium">
                      Nenhum produto salvo
                    </div>
                  )}
                  {calculations && calculations.length > 0 && (
                    <button onClick={() => onNavigate('price-calculator')} className="text-[10px] text-white/70 uppercase font-black hover:text-white transition-colors pl-1">
                      Ver todos
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
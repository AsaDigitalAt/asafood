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
  User,
  History
} from "lucide-react";
import { useUser, useMemoFirebase, useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useCollection } from "@/firebase/firestore/use-collection";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type RestaurantViewProps = {
  onBack: () => void;
  onNavigate: (view: any) => void;
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

export function RestaurantView({ onBack, onNavigate }: RestaurantViewProps) {
  const { user } = useUser();
  const firestore = useFirestore();

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

  const planName = userProfile?.plan ? planLabels[userProfile.plan] : "Plano AsaFood";
  const usageCount = userProfile?.usage?.reportsThisCycle ?? 0;
  const usageLimit = userProfile?.plan ? planLimits[userProfile.plan] : 0;
  const isDeveloper = userProfile?.plan === 'desenvolvedor';
  const progressValue = isDeveloper ? 100 : (usageCount / usageLimit) * 100;

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
                <h2 className="text-2xl font-extrabold text-white mb-1">
                  {user?.email?.split('@')[0]}
                </h2>
                <p className="text-white/50 text-sm font-medium mb-8">
                  {user?.email}
                </p>
                <div className="w-full pt-8 border-t border-white/10 flex flex-col gap-4">
                  <div className="flex justify-between items-center text-xs uppercase tracking-widest font-black text-white/40">
                    <span>Plano Atual</span>
                    <span className="text-white">{planName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs uppercase tracking-widest font-black text-white/40">
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
                onClick={() => alert("Em breve: Página de planos!")}
                className="w-full h-16 rounded-[2rem] bg-transparent border-2 border-white/20 text-white hover:bg-white/10 font-bold text-base gap-3 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Rocket className="w-5 h-5" />
                Fazer Upgrade de Plano
              </Button>
            </div>
          </div>

          {/* Seção de Dados e Histórico */}
          <div className="lg:col-span-2 space-y-8 animate-fade-up [animation-delay:200ms]">

            {/* Card de Uso e Gerações */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-black block mb-1">Gerações Mensais</span>
                  <h3 className="text-3xl font-black text-white">
                    {usageCount} <span className="text-white/20">/</span> {isDeveloper ? '∞' : usageLimit}
                  </h3>
                </div>
                <div className="p-3 rounded-2xl bg-white/10 text-white">
                  <Star className="w-6 h-6 fill-white/20" />
                </div>
              </div>
              <Progress value={progressValue} className="h-4 bg-white/10 [&>div]:bg-white rounded-full" />
              <p className="mt-4 text-xs text-white/50 font-medium">
                Sua cota de diagnósticos reinicia automaticamente todo dia 1º de cada mês.
              </p>
            </div>

            {/* Histórico Simplificado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Últimos Diagnósticos */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-white/40" />
                  <h4 className="text-sm font-black text-white/40 uppercase tracking-widest">Últimos Diagnósticos</h4>
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
                    <button onClick={() => onNavigate('action-plan')} className="text-[10px] text-white/40 uppercase font-black hover:text-white transition-colors pl-1">
                      Ver todos
                    </button>
                  )}
                </div>
              </div>

              {/* Últimas Precificações */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Calculator className="w-5 h-5 text-white/40" />
                  <h4 className="text-sm font-black text-white/40 uppercase tracking-widest">Produtos Precificados</h4>
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
                    <button onClick={() => onNavigate('price-calculator')} className="text-[10px] text-white/40 uppercase font-black hover:text-white transition-colors pl-1">
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
"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessControl } from "@/hooks/use-access-control";

export function RenewalAlert() {
  const { subscriptionDetail, isDeveloper, isLoading } = useAccessControl();
  const [isVisible, setIsVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (isLoading || isDeveloper || closed) return;

    const { daysRemaining, isExpired } = subscriptionDetail;

    // Só mostra se estiver nos intervalos críticos
    if (isExpired || (daysRemaining !== null && daysRemaining <= 7)) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [subscriptionDetail, isDeveloper, isLoading, closed]);

  if (!isVisible) return null;

  const { daysRemaining, isExpired } = subscriptionDetail;

  let content = {
    title: "Atenção",
    message: "",
    variant: "warning" as "warning" | "danger",
  };

  if (isExpired) {
    content = {
      title: "Plano Expirado",
      message: "Seu acesso expirou. O Asa Food não sumiu, só está fazendo charme até você renovar.",
      variant: "danger",
    };
  } else if (daysRemaining === 0) {
    content = {
      title: "Vence Hoje",
      message: "Tá no fim: seu plano vence hoje. Renove agora e evite um climão entre você e seus relatórios.",
      variant: "danger",
    };
  } else if (daysRemaining === 1) {
    content = {
      title: "Vence Amanhã",
      message: "Amanhã seu plano vence. Ainda dá tempo de renovar sem transformar isso em episódio final de novela.",
      variant: "warning",
    };
  } else if (daysRemaining === 4) {
    content = {
      title: "Faltam 4 Dias",
      message: "Faltam 4 dias. Ainda dá tempo de renovar tranquilo, sem precisar correr igual motoboy em horário de pico.",
      variant: "warning",
    };
  } else if (daysRemaining === 7) {
    content = {
      title: "Falta 1 Semana",
      message: "Seu restaurante não para. Seu plano também não precisa parar. Renove e continue tendo controle do seu negócio.",
      variant: "warning",
    };
  } else {
    // Se não for um dos dias exatos mas for < 7, podemos mostrar um genérico ou nada
    // O usuário especificou dias exatos, mas geralmente queremos cobrir o intervalo
    if (daysRemaining !== null && daysRemaining < 7) {
        content = {
            title: `Faltam ${daysRemaining} dias`,
            message: `Seu plano vence em breve. Renove agora para garantir seu acesso contínuo.`,
            variant: "warning",
        };
    } else {
        return null;
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500 max-w-[400px]">
      <div className={cn(
        "relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-2xl transition-all",
        content.variant === "danger" 
          ? "bg-red-950/40 border-red-500/30" 
          : "bg-white/5 border-white/10"
      )}>
        {/* Background Glow */}
        <div className={cn(
          "absolute -top-10 -right-10 w-32 h-32 blur-[50px] opacity-20 rounded-full",
          content.variant === "danger" ? "bg-red-500" : "bg-amber-500"
        )} />

        <button 
          onClick={() => setClosed(true)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-5">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
            content.variant === "danger" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
          )}>
            {isExpired ? <AlertTriangle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
          </div>

          <div className="flex-1 space-y-2">
            <h4 className="text-lg font-black text-white tracking-tight">
              {content.title}
            </h4>
            <p className="text-sm text-white/60 leading-relaxed font-medium">
              {content.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button 
            className="flex-1 h-12 rounded-xl bg-white text-primary hover:bg-white/90 font-black text-sm uppercase tracking-wider"
            onClick={() => window.open('https://wa.me/556193788529', '_blank')}
          >
            Renovar Agora
          </Button>
          <Button 
            variant="ghost"
            className="h-12 px-6 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 hover:text-white font-bold text-xs uppercase"
            onClick={() => setClosed(true)}
          >
            Depois
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Bell, Clock, AlertTriangle, X, Star } from "lucide-react";
import { useAccessControl } from "@/hooks/use-access-control";

export function NotificationCenter() {
  const { subscriptionDetail, isDeveloper, isLoading } = useAccessControl();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Som de notificação
  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  }, []);

  useEffect(() => {
    if (isLoading || isDeveloper) return;

    const { daysRemaining, isExpired } = subscriptionDetail;
    const newNotifications = [];

    if (isExpired || (daysRemaining !== null && daysRemaining <= 7)) {
      let title = "";
      let message = "";
      let type = "warning";

      if (isExpired) {
        title = "Plano Expirado";
        message = "Seu acesso expirou. O Asa Food não sumiu, só está fazendo charme até você renovar.";
        type = "danger";
      } else if (daysRemaining === 0) {
        title = "Vence Hoje";
        message = "Tá no fim: seu plano vence hoje. Renove agora e evite um climão entre você e seus relatórios.";
        type = "danger";
      } else if (daysRemaining === 1) {
        title = "Vence Amanhã";
        message = "Amanhã seu plano vence. Ainda dá tempo de renovar sem transformar isso em episódio final de novela.";
      } else if (daysRemaining === 4) {
        title = "Faltam 4 Dias";
        message = "Faltam 4 dias. Ainda dá tempo de renovar tranquilo, sem precisar correr igual motoboy em horário de pico.";
      } else if (daysRemaining === 7) {
        title = "Falta 1 Semana";
        message = "Seu restaurante não para. Seu plano também não precisa parar. Renove e continue tendo controle do seu negócio.";
      }

      if (title) {
        newNotifications.push({ id: 'sub-alert', title, message, type, icon: type === 'danger' ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" /> });
      }
    }

    // Se mudou o alerta (ex: passou de 7 para 4 dias), toca o som
    if (newNotifications.length > notifications.length || (newNotifications.length > 0 && newNotifications[0].title !== notifications[0]?.title)) {
      setHasNew(true);
      if (audioRef.current && !isOpen) {
        audioRef.current.play().catch(e => console.log("Audio play blocked"));
      }
    }

    setNotifications(newNotifications);
  }, [subscriptionDetail, isDeveloper, isLoading]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => {
            setIsOpen(!isOpen);
            setHasNew(false);
        }}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative",
          "bg-white/10 border border-white/20 text-white hover:bg-white/20",
          hasNew && "animate-bounce"
        )}
      >
        <Bell className={cn("w-5 h-5", hasNew && "text-amber-400")} />
        {notifications.length > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
        )}
      </button>

      {/* Dropdown Panel */}
      <div className={cn(
        "absolute top-full right-0 mt-4 bg-black/80 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-2xl border border-white/10 w-80 z-50 transition-all duration-500",
        "opacity-0 invisible -translate-y-2",
        isOpen && "opacity-100 visible translate-y-0"
      )}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-white tracking-tight">Notificações</h3>
          <span className="text-[10px] text-white/40 uppercase font-black px-3 py-1 rounded-full bg-white/5 border border-white/10">
            {notifications.length} nova{notifications.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {notifications.length > 0 ? notifications.map((notif) => (
            <div 
              key={notif.id}
              className={cn(
                "p-4 rounded-3xl border transition-all hover:scale-[1.02]",
                notif.type === 'danger' ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/10"
              )}
            >
              <div className="flex gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                  notif.type === 'danger' ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                )}>
                  {notif.icon}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">{notif.title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{notif.message}</p>
                </div>
              </div>
              <button 
                onClick={() => window.open('https://wa.me/556193788529', '_blank')}
                className="w-full mt-4 py-2 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                Renovar Agora
              </button>
            </div>
          )) : (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                <Bell className="w-8 h-8" />
              </div>
              <p className="text-xs text-white/30 font-medium">Você não tem novas notificações</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

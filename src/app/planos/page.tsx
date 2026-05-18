"use client";

import Image from "next/image";
import { ArrowRight, Check, Sparkles } from "lucide-react";

export default function PlanosPage() {
  const planos = [
    {
      nome: "Essencial",
      subtitulo: "Para começar com inteligência.",
      preco: "R$ 99,00",
      periodo: "/mês",
      features: [
        "2 Diagnósticos de Performance",
        "10 Diagnósticos Gerais",
        "25 Precificações",
      ],
      ideal: "Ideal para restaurantes em fase de melhoria, gestores que acompanham poucas operações ou consultores que desejam testar a metodologia Asa Food com seus primeiros clientes.",
      cta: "COMEÇAR COM O ESSENCIAL",
      link: "https://checkout4.xgrow.com/pt/727d6c86-f33e-406e-9154-77efc7829088/MTAxNzE1",
      cor: "text-[#2e4c8c]",
      bgCor: "bg-[#2e4c8c]",
      borderCor: "border-[#2e4c8c]/20",
      btnStyle: "border-2 border-[#2e4c8c] text-[#2e4c8c] hover:bg-[#2e4c8c] hover:text-white",
      badge: null,
      shadow: "shadow-xl shadow-black/5",
    },
    {
      nome: "Performance",
      subtitulo: "Mais análises, mais consistência.",
      preco: "R$ 149,00",
      periodo: "/mês",
      features: [
        "4 Diagnósticos de Performance",
        "25 Diagnósticos Gerais",
        "100 Precificações",
      ],
      ideal: "Ideal para quem precisa acompanhar restaurantes com mais frequência, comparar cenários, revisar cardápios e gerar recomendações com mais volume ao longo do mês.",
      cta: "ESCALAR MINHAS ANÁLISES",
      link: "https://checkout4.xgrow.com/pt/727d6c86-f33e-406e-9154-77efc7829088/MTAxNzE3",
      cor: "text-[#5bbcd6]",
      bgCor: "bg-[#5bbcd6]",
      borderCor: "border-[#5bbcd6]/30",
      btnStyle: "bg-[#5bbcd6] text-white hover:bg-[#4aaac4] hover:-translate-y-1 shadow-lg shadow-[#5bbcd6]/30",
      badge: null,
      shadow: "shadow-2xl shadow-[#5bbcd6]/10",
    },
    {
      nome: "Acelerador",
      subtitulo: "Gestão e consultoria em escala.",
      preco: "R$ 247,00",
      periodo: "/mês",
      features: [
        "10 Diagnósticos de Performance",
        "50 Diagnósticos Gerais",
        "200 Precificações",
      ],
      ideal: "Ideal para consultores, assessorias, gestores de múltiplas operações e profissionais que precisam transformar análise de restaurantes em rotina estratégica de crescimento.",
      cta: "QUERO ACELERAR",
      link: "https://checkout4.xgrow.com/pt/727d6c86-f33e-406e-9154-77efc7829088/MTAxNzE5",
      cor: "text-[#ea1d2c]",
      bgCor: "bg-[#ea1d2c]",
      borderCor: "border-[#ea1d2c]/40",
      btnStyle: "bg-[#ea1d2c] text-white hover:bg-[#d01926] text-[13px] hover:-translate-y-1 shadow-[0_0_20px_rgba(234,29,44,0.4)] animate-pulse-glow",
      badge: "MAIS COMPLETO",
      shadow: "shadow-[0_0_40px_rgba(234,29,44,0.15)] border-[#ea1d2c]/30",
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf6f0] font-sans text-slate-800">
      {/* ─── HEADER ─── */}
      <header className="absolute top-0 w-full p-6 flex justify-center z-50">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/base-arquivos.firebasestorage.app/o/Logo%20ASA%20OFF.png?alt=media&token=62ef02f9-1b75-4a7a-b496-b56184407e2f"
          alt="Asa Food Logo"
          width={120}
          height={34}
          className="brightness-0" 
        />
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="pt-32 pb-16 px-6 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            <Sparkles className="w-3 h-3" />
            Escolha seu Plano
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight text-slate-900 mb-6">
            Inteligência de dados para <span className="text-[#ea1d2c]">escalar o seu lucro.</span>
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            Selecione o plano ideal para a sua necessidade e comece a transformar as métricas do seu restaurante em dinheiro hoje mesmo.
          </p>
        </div>
      </section>

      {/* ─── PLANOS ─── */}
      <section className="pb-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8 items-stretch">
          {planos.map((plano) => (
            <div
              key={plano.nome}
              className={`relative rounded-[2.5rem] p-8 md:p-10 flex flex-col h-full bg-[#f8f4eb] border transition-all duration-500 hover:-translate-y-2 ${plano.shadow} ${plano.borderCor}`}
            >
              {plano.badge && (
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                  <span className={`${plano.bgCor} text-white text-[11px] font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg`}>
                    {plano.badge}
                  </span>
                </div>
              )}

              <div className="mb-6 mt-4">
                <h3 className={`text-3xl font-black mb-2 ${plano.cor}`}>{plano.nome}</h3>
                <p className="text-slate-500 text-sm min-h-[40px] font-medium leading-relaxed">{plano.subtitulo}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className={`text-5xl font-black tracking-tighter ${plano.cor}`}>{plano.preco}</span>
                <span className="text-slate-500 font-bold">{plano.periodo}</span>
              </div>

              <a
                href={plano.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs transition-all duration-300 mb-10 ${plano.btnStyle}`}
              >
                {plano.cta} <ArrowRight className="w-4 h-4" />
              </a>

              <div className="flex flex-col gap-4 mb-8 flex-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">O que inclui:</h4>
                {plano.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className={`p-1 rounded-full ${plano.bgCor} ${plano.cor} bg-opacity-10 shrink-0 mt-0.5`}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 leading-snug">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-200 mt-auto">
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  <span className="font-black text-slate-800">Recomendação:</span> {plano.ideal}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 px-6 text-center border-t border-slate-200">
        <p className="text-slate-400 font-medium text-sm">
          © {new Date().getFullYear()} AsaFood. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

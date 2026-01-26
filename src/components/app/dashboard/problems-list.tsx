'use client'

import { AlertTriangle } from "lucide-react"

export const ProblemsList = ({ problems }: { problems: any[] }) => (
    <div>
        <h3 className="text-2xl font-bold text-center mb-8 text-gradient">🚨 Pontos Críticos Identificados</h3>
        <div className="space-y-4">
            {problems.map((prob, index) => (
                <div key={index} className="danger-bg border p-6 rounded-2xl flex items-start gap-4 transition-all hover:bg-destructive/20 hover:border-destructive/30">
                    <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-bold text-red-400 uppercase mb-2">{prob.etapa}</h4>
                        <p className="text-slate-200 mb-3">{prob.descricao}</p>
                        <span className="inline-block bg-red-500 text-white text-xs font-bold uppercase py-1 px-3 rounded-full">Impacto: {prob.impacto}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
)

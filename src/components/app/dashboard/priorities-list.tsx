'use client'

import { Target } from "lucide-react"

export const PrioritiesList = ({ priorities }: { priorities: string[] }) => (
    <div className="success-bg border rounded-2xl p-6 md:p-8">
        <h3 className="text-2xl font-bold text-center mb-6 text-gradient">🎯 Prioridades para Hoje</h3>
        <ul className="space-y-3">
            {priorities.map((p, index) => (
                <li key={index} className="flex items-start gap-3 text-green-200 pb-3 border-b border-green-500/20 last:border-b-0">
                    <Target className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                    <span className="flex-1">{p}</span>
                </li>
            ))}
        </ul>
    </div>
)

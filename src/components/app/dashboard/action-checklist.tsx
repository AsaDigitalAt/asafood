'use client'

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const ActionChecklist = ({ actions }: { actions: any[] }) => {
    const [checkedItems, setCheckedItems] = useState<number[]>([]);

    const toggleItem = (index: number) => {
        setCheckedItems(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    if (!actions || actions.length === 0) return null;

    return (
        <div className="glass-card rounded-2xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-center mb-8 text-gradient">⚡ Plano de Ação Completo</h3>
            <div className="space-y-4">
                {actions.map((action, index) => {
                    if (!action || !action.descricao) return null;
                    const isChecked = checkedItems.includes(index);
                    return (
                        <div 
                            key={index} 
                            onClick={() => toggleItem(index)}
                            className={cn(
                                "bg-card/80 p-6 rounded-2xl flex items-start gap-4 cursor-pointer transition-all border border-transparent hover:bg-accent/5 hover:border-primary/20",
                                isChecked && "opacity-60"
                            )}
                        >
                            <div className={cn(
                                "w-7 h-7 mt-0.5 border-2 border-primary rounded-lg flex-shrink-0 flex items-center justify-center transition-all",
                                isChecked && "bg-primary border-primary"
                            )}>
                                {isChecked && <Check className="w-5 h-5 text-background font-black" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    {action.prioridade && <span className="py-0.5 px-2 bg-primary text-primary-foreground rounded-full text-xs font-bold">Prioridade {action.prioridade}</span>}
                                    {action.categoria && <span className="py-0.5 px-2 bg-muted text-muted-foreground rounded-full text-xs font-bold uppercase">{action.categoria}</span>}
                                </div>
                                <p className={cn(
                                    "text-foreground/80 transition-all",
                                    isChecked && "line-through text-muted-foreground"
                                )}>{action.descricao}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';

export const ActionChecklist = ({ actions, analysisId }: { actions: any[], analysisId?: string }) => {
    const [checkedItems, setCheckedItems] = useState<number[]>([]);
    const { firestore } = useFirebase();
    const { user } = useUser();

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<any>(userDocRef);

    useEffect(() => {
        if (!firestore || !userProfile?.tenantId || !analysisId) return;
        
        const docRef = doc(firestore, `tenants/${userProfile.tenantId}/diagnostics`, analysisId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.checkedActions && Array.isArray(data.checkedActions)) {
                    setCheckedItems(data.checkedActions);
                }
            }
        });

        return () => unsubscribe();
    }, [firestore, userProfile?.tenantId, analysisId]);

    const toggleItem = async (index: number) => {
        const newChecked = checkedItems.includes(index) 
            ? checkedItems.filter(i => i !== index) 
            : [...checkedItems, index];
            
        setCheckedItems(newChecked); // Optimistic update

        if (firestore && userProfile?.tenantId && analysisId) {
            try {
                const docRef = doc(firestore, `tenants/${userProfile.tenantId}/diagnostics`, analysisId);
                await updateDoc(docRef, { checkedActions: newChecked });
            } catch (error) {
                console.error("Erro ao salvar progresso:", error);
            }
        }
    };

    if (!actions || actions.length === 0) return null;

    const progressPercentage = Math.round((checkedItems.length / actions.length) * 100);

    return (
        <div className="glass-card rounded-2xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-center mb-6 text-gradient">⚡ Plano de Ação Completo</h3>
            
            <div className="mb-8 space-y-2">
                <div className="flex justify-between text-sm font-semibold text-muted-foreground">
                    <span>Progresso do Plano</span>
                    <span className={cn("transition-colors", progressPercentage === 100 ? "text-green-500 font-bold" : "")}>
                        {progressPercentage}%
                    </span>
                </div>
                <Progress value={progressPercentage} className={cn("h-3", progressPercentage === 100 ? "[&>div]:bg-green-500" : "")} />
            </div>

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
                                isChecked && "opacity-60 bg-accent/5"
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

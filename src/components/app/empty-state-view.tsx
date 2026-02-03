"use client"

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EmptyStateViewProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onBack: () => void;
}

export default function EmptyStateView({ icon, title, description, onBack }: EmptyStateViewProps) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center text-center p-4">
            <div className="glass-card max-w-lg w-full p-10 md:p-16 rounded-3xl shadow-2xl opacity-0 animate-fade-up">
                <div className="text-6xl mb-6 text-slate-500/50">
                    {icon}
                </div>
                <h2 className="text-3xl font-bold text-primary mb-2">{title}</h2>
                <p className="text-muted-foreground mb-8">{description}</p>
                <Button 
                    onClick={onBack}
                    variant="outline"
                    className="rounded-full bg-transparent border-white/20 hover:bg-primary/10 hover:border-primary hover:text-primary h-12 px-8 uppercase font-bold tracking-wider"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
            </div>
        </div>
    );
}

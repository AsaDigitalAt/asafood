'use client';

import { useState } from 'react';
import type { FormState } from "@/app/actions/generate-diagnosis";
import { DashboardView } from '@/components/app/dashboard/dashboard-view';
import ActionPlanList from '@/components/app/action-plan/action-plan-list';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ActionPlanViewProps {
    onBack: () => void;
}

export default function ActionPlanView({ onBack }: ActionPlanViewProps) {
    const [selectedReport, setSelectedReport] = useState<FormState | null>(null);

    if (selectedReport) {
        return (
            <div className="relative">
                 <div className="absolute top-24 md:top-32 left-4 md:left-10 z-20">
                    <Button 
                        onClick={() => setSelectedReport(null)} 
                        variant="outline"
                        className="rounded-full bg-black/20 border-white/20 hover:bg-primary/10 hover:border-primary hover:text-primary h-12 px-6 uppercase font-bold tracking-wider"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para a Lista
                    </Button>
                </div>
                <DashboardView data={selectedReport} />
            </div>
        );
    }

    return <ActionPlanList onSelectReport={setSelectedReport} onBack={onBack} />;
}

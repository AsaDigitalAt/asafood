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
                <div className="absolute top-24 md:top-32 left-4 md:left-10 z-20 print:hidden">
                    <Button
                        onClick={() => setSelectedReport(null)}
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-2xl bg-black/5 border-black/10 text-primary hover:bg-black/10 transition-all backdrop-blur-md shadow-sm"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </div>
                <DashboardView data={selectedReport} />
            </div>
        );
    }

    return <ActionPlanList onSelectReport={setSelectedReport} onBack={onBack} />;
}


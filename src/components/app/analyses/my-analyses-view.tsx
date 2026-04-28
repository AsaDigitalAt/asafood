'use client';

import { useState } from 'react';
import MyAnalysesList from './my-analyses-list';
import { ReportView, AnalysisReport } from '@/components/app/free-analysis/report-view';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface MyAnalysesViewProps {
    onBack: () => void;
}

export default function MyAnalysesView({ onBack }: MyAnalysesViewProps) {
    const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);

    if (selectedReport) {
        return (
            <div className="relative">
                <div className="absolute top-24 md:top-32 left-4 md:left-10 z-20 print:hidden">
                    <Button
                        onClick={() => setSelectedReport(null)}
                        variant="outline"
                        className="rounded-full bg-black/20 border-white/20 hover:bg-primary/10 hover:border-primary hover:text-primary h-12 px-6 uppercase font-bold tracking-wider text-white"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para a Lista
                    </Button>
                </div>
                <ReportView report={selectedReport} showReset={false} />
            </div>
        );
    }

    return <MyAnalysesList onSelectAnalysis={setSelectedReport} onBack={onBack} />;
}

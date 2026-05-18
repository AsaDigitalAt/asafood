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
                        size="icon"
                        className="h-12 w-12 rounded-2xl bg-black/5 border-black/10 text-primary hover:bg-black/10 transition-all backdrop-blur-md shadow-sm"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </div>
                <ReportView report={selectedReport} showReset={false} />
            </div>
        );
    }

    return <MyAnalysesList onSelectAnalysis={setSelectedReport} onBack={onBack} />;
}

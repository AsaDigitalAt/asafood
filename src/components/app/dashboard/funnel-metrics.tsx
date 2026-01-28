
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const getStatusClass = (status?: string) => {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('critico') || s.includes('ruim') || s.includes('risco')) return '!border-destructive danger-text';
    if (s.includes('atenção') || s.includes('medio')) return '!border-amber-500 warning-text';
    if (s.includes('bom') || s.includes('otimo') || s.includes('ideal')) return '!border-green-500 success-text';
    return '!border-amber-500 warning-text';
};

const getStatusLabel = (status?: string) => {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('critico') || s.includes('ruim') || s.includes('risco')) return 'Crítico';
    if (s.includes('atenção') || s.includes('medio')) return 'Atenção';
    if (s.includes('bom') || s.includes('otimo') || s.includes('ideal')) return 'Bom';
    return 'Em Análise';
};


const getChartColor = (status?: string) => {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('critico') || s.includes('ruim') || s.includes('risco')) return '#ef4444'; // Red
    if (s.includes('atenção') || s.includes('medio')) return '#f59e0b'; // Amber
    if (s.includes('bom') || s.includes('otimo') || s.includes('ideal')) return '#10b981'; // Green
    return '#2e4c8c'; // Dark Blue
}

const MetricCard = ({ label, metricData }: { label: string, metricData: any }) => {
    if (!metricData) return null;
    const color = getChartColor(metricData.status);
    const pct = metricData.percentual || 0;

    return (
        <div className="bg-card/80 border border-border/50 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left transition-all hover:border-primary/20 hover:-translate-y-1">
            <div className="relative w-28 h-28 flex-shrink-0">
                <div 
                    className="w-full h-full rounded-full flex items-center justify-center border-2"
                    style={{
                        background: `conic-gradient(${color} ${pct}%, hsl(var(--muted) / 0.1) 0)`,
                        borderColor: color,
                    }}
                >
                    <div className="w-[85%] h-[85%] bg-card rounded-full flex items-center justify-center">
                        <div className="flex items-baseline font-saira font-extrabold" style={{ color: color }}>
                            <span className="text-4xl">{`+${pct}`}</span>
                            <span className="text-xl">%</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1">
                <h4 className="text-sm text-muted-foreground uppercase tracking-widest font-bold mb-1">{label}</h4>
                <p className="text-xs text-muted-foreground mb-3">Meta: {metricData.referencia_minima || '-'}%</p>
                <div className={`inline-block border text-xs font-bold uppercase py-1 px-3 rounded-full ${getStatusClass(metricData.status)}`}>
                    {getStatusLabel(metricData.status)}
                </div>
                <p className="text-sm text-slate-500 mt-4">{metricData.comentario || ''}</p>
            </div>
        </div>
    )
}

export const FunnelMetrics = ({ conversions }: { conversions: any }) => {
    if (!conversions) return null;

    return (
        <div>
            <h3 className="text-2xl font-bold text-center mb-8 text-gradient">Funil de Vendas</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetricCard label="Visitas → Visualização" metricData={conversions.view} />
                <MetricCard label="Visitas → Sacola" metricData={conversions.cart} />
                <MetricCard label="Visitas → Revisão" metricData={conversions.review} />
                <MetricCard label="Taxa de Conversão" metricData={conversions.done} />
            </div>
        </div>
    )
}

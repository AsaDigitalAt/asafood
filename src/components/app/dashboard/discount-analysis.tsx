'use client'

const getStatusClass = (status?: string) => {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('critico') || s.includes('ruim') || s.includes('risco')) return 'danger-text';
    if (s.includes('atenção') || s.includes('medio')) return 'warning-text';
    if (s.includes('bom') || s.includes('otimo') || s.includes('ideal')) return 'success-text';
    return 'warning-text';
};

const DiscountCard = ({ title, value, classification }: { title: string, value?: number, classification?: string }) => {
    if (value === undefined || value === null) return (
        <div className="bg-slate-900/50 p-6 rounded-2xl text-center">
            <h4 className="text-sm uppercase font-bold text-muted-foreground mb-2">{title}</h4>
            <p className="text-4xl font-extrabold text-muted-foreground">-</p>
        </div>
    );

    return (
        <div className="bg-slate-900/50 p-6 rounded-2xl text-center">
            <h4 className="text-sm uppercase font-bold text-muted-foreground mb-2">{title}</h4>
            <p className={`text-4xl font-extrabold ${getStatusClass(classification)}`}>{value}%</p>
            <p className="text-xs text-muted-foreground">do faturamento em descontos</p>
        </div>
    )
}

export const DiscountAnalysis = ({ discounts }: { discounts: any }) => {
    if (!discounts || !discounts.mes_atual || !discounts.mes_anterior || !discounts.comparativo) return null;

    return (
        <div className="glass-card rounded-2xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-center mb-8 text-gradient">Análise de Descontos</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <DiscountCard title="Mês Atual" value={discounts.mes_atual.percentual_descontos} classification={discounts.mes_atual.classificacao} />
                <DiscountCard title="Mês Anterior" value={discounts.mes_anterior.percentual_descontos} classification={discounts.mes_anterior.classificacao} />
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center">
                <p className="font-bold text-white mb-1">Tendência: <span className="uppercase">{discounts.comparativo.tendencia}</span></p>
                <p className="text-sm text-muted-foreground">{discounts.comparativo.analise}</p>
            </div>
        </div>
    )
}

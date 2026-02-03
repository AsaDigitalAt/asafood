'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle, ArrowLeft, Calculator, ListChecks, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Ingredient {
  id: number;
  name: string;
  totalCost: number;
  totalWeight: number;
  plateWeight: number;
}

interface FixedCost {
  id: number;
  name: string;
  monthlyCost: number;
}

interface CalculationResult {
    totalIngredientCost: number;
    totalFixedCostPerDish: number;
    totalCostPerDish: number;
    suggestedPrice: number;
}

interface PriceCalculatorViewProps {
    onBack: () => void;
}

export default function PriceCalculatorView({ onBack }: PriceCalculatorViewProps) {
  const [view, setView] = useState<'initial' | 'new_calculation' | 'view_prices'>('initial');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [dishesPerMonth, setDishesPerMonth] = useState<number>(100);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const { toast } = useToast();

  const handleNewCalculation = () => {
    setIngredients([{ id: Date.now(), name: '', totalCost: 0, totalWeight: 1000, plateWeight: 0 }]);
    setFixedCosts([]);
    setDishesPerMonth(100);
    setProfitMargin(30);
    setResult(null);
    setView('new_calculation');
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now(), name: '', totalCost: 0, totalWeight: 1000, plateWeight: 0 },
    ]);
  };

  const updateIngredient = (id: number, field: keyof Ingredient, value: string) => {
    setIngredients(
      ingredients.map(ing => {
        if (ing.id === id) {
          if (field === 'name') {
            return { ...ing, name: value };
          }
          const numericValue = parseFloat(value);
          return { ...ing, [field]: isNaN(numericValue) ? 0 : numericValue };
        }
        return ing;
      })
    );
  };

  const removeIngredient = (id: number) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const getIngredientCostPerPlate = (ingredient: Ingredient) => {
    if (ingredient.totalWeight === 0) return 0;
    return (ingredient.totalCost / ingredient.totalWeight) * ingredient.plateWeight;
  };

  const addFixedCost = () => {
    setFixedCosts([...fixedCosts, { id: Date.now(), name: '', monthlyCost: 0 }]);
  };

  const updateFixedCost = (id: number, field: keyof FixedCost, value: string) => {
    setFixedCosts(
      fixedCosts.map(cost => {
        if (cost.id === id) {
          if (field === 'name') {
            return { ...cost, name: value };
          }
          const numericValue = parseFloat(value);
          return { ...cost, [field]: isNaN(numericValue) ? 0 : numericValue };
        }
        return cost;
      })
    );
  };

  const removeFixedCost = (id: number) => {
    setFixedCosts(fixedCosts.filter(cost => cost.id !== id));
  };
  
  const calculatePrice = async () => {
    setIsCalculating(true);
    setResult(null);

    const payload = {
      ingredients,
      fixedCosts,
      dishesPerMonth,
      profitMargin,
    };

    try {
      const response = await fetch('https://unreleasible-pocked-azucena.ngrok-free.dev/webhook/preconovo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro no Webhook (${response.status}): ${errorText || response.statusText}`);
      }

      const data = await response.json();
      setResult(data);

    } catch (error: any) {
      console.error("Erro ao calcular preço:", error);
      toast({
        variant: "destructive",
        title: "Erro no Cálculo",
        description: error.message || "Não foi possível conectar ao serviço de cálculo de preços.",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  if (view === 'new_calculation') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
        <div className="flex items-center mb-12">
             <Button onClick={() => setView('initial')} variant="outline" size="icon" className="h-12 w-12 rounded-full mr-6">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-left">
                 <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
                    <span className="text-gradient">Calcular Novo </span> 
                    <span className="text-primary">Produto</span>
                </h1>
                <p className="text-lg text-muted-foreground">Preencha os dados para encontrar o preço ideal.</p>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Forms Column */}
            <div className="space-y-8">
                {/* Ingredients Card */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Insumos do Prato</CardTitle>
                        <CardDescription>Adicione os ingredientes e seus custos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {ingredients.map(ing => (
                            <Card key={ing.id} className="p-4 bg-card/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-grow pr-4">
                                        <Label htmlFor={`ingredient-name-${ing.id}`}>Nome do Insumo</Label>
                                        <Input id={`ingredient-name-${ing.id}`} placeholder="Ex: Arroz" value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)} className="text-base" />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeIngredient(ing.id)} className="mt-5">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <Label htmlFor={`total-cost-${ing.id}`}>Custo Total (R$)</Label>
                                        <Input id={`total-cost-${ing.id}`} type="number" placeholder="20,00" value={ing.totalCost || ''} onChange={e => updateIngredient(ing.id, 'totalCost', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor={`total-weight-${ing.id}`}>Peso Total (g/ml)</Label>
                                        <Input id={`total-weight-${ing.id}`} type="number" placeholder="1000" value={ing.totalWeight || ''} onChange={e => updateIngredient(ing.id, 'totalWeight', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor={`plate-weight-${ing.id}`}>Qtd. no Prato (g/ml)</Label>
                                        <Input id={`plate-weight-${ing.id}`} type="number" placeholder="150" value={ing.plateWeight || ''} onChange={e => updateIngredient(ing.id, 'plateWeight', e.target.value)} />
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border/50 flex justify-end items-center">
                                    <span className="text-sm text-muted-foreground mr-2">Custo deste insumo no prato:</span>
                                    <span className="font-bold text-lg">R$ {getIngredientCostPerPlate(ing).toFixed(2)}</span>
                                </div>
                            </Card>
                        ))}
                        <Button variant="outline" className="mt-4 w-full" onClick={addIngredient}>
                            <PlusCircle className="mr-2" /> Adicionar Insumo
                        </Button>
                    </CardContent>
                </Card>

                {/* Fixed Costs Card */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Custos Fixos e Variáveis</CardTitle>
                        <CardDescription>Adicione os custos mensais da sua operação.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fixedCosts.map(cost => (
                             <div key={cost.id} className="flex items-end gap-4 p-4 rounded-lg bg-card/50">
                                <div className="flex-grow">
                                    <Label htmlFor={`cost-name-${cost.id}`}>Descrição do Custo</Label>
                                    <Input id={`cost-name-${cost.id}`} placeholder="Ex: Aluguel" value={cost.name} onChange={e => updateFixedCost(cost.id, 'name', e.target.value)} />
                                </div>
                                <div className="w-48">
                                    <Label htmlFor={`cost-value-${cost.id}`}>Valor Mensal (R$)</Label>
                                    <Input id={`cost-value-${cost.id}`} type="number" placeholder="1500,00" value={cost.monthlyCost || ''} onChange={e => updateFixedCost(cost.id, 'monthlyCost', e.target.value)} />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeFixedCost(cost.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="outline" className="mt-4 w-full" onClick={addFixedCost}>
                            <PlusCircle className="mr-2" /> Adicionar Custo
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Calculation and Result Column */}
            <div className="space-y-8">
                <Card className="glass-card sticky top-32">
                    <CardHeader>
                        <CardTitle>Configuração da Precificação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="dishes-per-month">Média de pratos vendidos por mês</Label>
                            <Input id="dishes-per-month" type="number" value={dishesPerMonth || ''} onChange={e => setDishesPerMonth(Number(e.target.value))} />
                        </div>
                        <div>
                            <Label htmlFor="profit-margin">Margem de lucro desejada (%)</Label>
                            <Input id="profit-margin" type="number" value={profitMargin || ''} onChange={e => setProfitMargin(Number(e.target.value))} />
                        </div>
                         <Button className="w-full h-12 text-lg font-bold" onClick={calculatePrice} disabled={isCalculating}>
                            {isCalculating ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Calculando...
                                </>
                            ) : (
                                "Calcular Preço Ideal"
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {result && (
                    <Card className="bg-primary/10 border-primary/20 animate-fade-up">
                        <CardHeader>
                            <CardTitle className="text-center text-gradient text-2xl">Resultado da Precificação</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-lg">
                            <div className="flex justify-between">
                                <span>Custo de Insumos p/ Prato:</span>
                                <span className="font-bold">R$ {result.totalIngredientCost.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span>Custo Fixo p/ Prato:</span>
                                <span className="font-bold">R$ {result.totalFixedCostPerDish.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold border-t border-primary/20 pt-4 mt-4">
                                <span>CUSTO TOTAL POR PRATO:</span>
                                <span>R$ {result.totalCostPerDish.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-2xl font-extrabold text-primary border-t-2 border-primary pt-4 mt-4">
                                <span>PREÇO DE VENDA SUGERIDO:</span>
                                <span>R$ {result.suggestedPrice.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
      </div>
    );
  }

  if (view === 'view_prices') {
      return (
        <div className="max-w-5xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
            <div className="flex items-center mb-12">
                 <Button onClick={() => setView('initial')} variant="outline" size="icon" className="h-12 w-12 rounded-full mr-6">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="text-left">
                     <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
                        <span className="text-gradient">Cálculos </span> 
                        <span className="text-primary">Anteriores</span>
                    </h1>
                    <p className="text-lg text-muted-foreground">Seus cálculos salvos aparecerão aqui.</p>
                </div>
            </div>
            <Card className="glass-card">
                <CardContent className="text-center text-muted-foreground p-16">
                    Em breve.
                </CardContent>
            </Card>
        </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
        <div className="flex items-center mb-12">
             <Button onClick={onBack} variant="outline" size="icon" className="h-12 w-12 rounded-full mr-6">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-left">
                 <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
                    <span className="text-gradient">Calculadora de </span> 
                    <span className="text-primary">Preços</span>
                </h1>
                <p className="text-lg text-muted-foreground">O que você gostaria de fazer?</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card 
                className="glass-card p-8 text-center flex flex-col justify-center items-center cursor-pointer group hover:border-primary hover:-translate-y-2 transition-all"
                onClick={handleNewCalculation}
            >
                <Calculator className="w-16 h-16 mb-6 text-primary/50 group-hover:text-primary transition-colors" />
                <h2 className="text-2xl font-bold mb-2 text-foreground">Calcular Novo Produto</h2>
                <p className="text-muted-foreground">Comece do zero a precificação de um novo item do seu cardápio.</p>
            </Card>
            <Card 
                className="glass-card p-8 text-center flex flex-col justify-center items-center cursor-pointer group hover:border-primary hover:-translate-y-2 transition-all"
                onClick={() => setView('view_prices')}
            >
                <ListChecks className="w-16 h-16 mb-6 text-primary/50 group-hover:text-primary transition-colors" />
                <h2 className="text-2xl font-bold mb-2 text-foreground">Conferir Preços</h2>
                <p className="text-muted-foreground">Visualize e gerencie os produtos que você já precificou.</p>
            </Card>
        </div>
    </div>
  );
}

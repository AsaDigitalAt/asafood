'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle, ArrowLeft } from 'lucide-react';

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
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [dishesPerMonth, setDishesPerMonth] = useState<number>(100);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [result, setResult] = useState<CalculationResult | null>(null);

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
  
  const calculatePrice = () => {
    const totalIngredientCost = ingredients.reduce((acc, ing) => acc + getIngredientCostPerPlate(ing), 0);
    const totalMonthlyFixedCost = fixedCosts.reduce((acc, cost) => acc + cost.monthlyCost, 0);
    const totalFixedCostPerDish = dishesPerMonth > 0 ? totalMonthlyFixedCost / dishesPerMonth : 0;
    const totalCostPerDish = totalIngredientCost + totalFixedCostPerDish;
    const suggestedPrice = totalCostPerDish / (1 - profitMargin / 100);

    setResult({
      totalIngredientCost,
      totalFixedCostPerDish,
      totalCostPerDish,
      suggestedPrice,
    });
  };

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
                <p className="text-lg text-muted-foreground">Calcule o preço de venda ideal para seus pratos.</p>
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
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Insumo</TableHead>
                                <TableHead>Custo Total (R$)</TableHead>
                                <TableHead>Peso Total (g)</TableHead>
                                <TableHead>Qtd. Prato (g)</TableHead>
                                <TableHead>Custo/Prato</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ingredients.map(ing => (
                                <TableRow key={ing.id}>
                                    <TableCell><Input placeholder="Ex: Arroz" value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)} /></TableCell>
                                    <TableCell><Input type="number" placeholder="20,00" value={ing.totalCost || ''} onChange={e => updateIngredient(ing.id, 'totalCost', e.target.value)} /></TableCell>
                                    <TableCell><Input type="number" placeholder="1000" value={ing.totalWeight || ''} onChange={e => updateIngredient(ing.id, 'totalWeight', e.target.value)} /></TableCell>
                                    <TableCell><Input type="number" placeholder="150" value={ing.plateWeight || ''} onChange={e => updateIngredient(ing.id, 'plateWeight', e.target.value)} /></TableCell>
                                    <TableCell className="font-bold">R$ {getIngredientCostPerPlate(ing).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeIngredient(ing.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descrição do Custo</TableHead>
                                <TableHead>Valor Mensal (R$)</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fixedCosts.map(cost => (
                                <TableRow key={cost.id}>
                                    <TableCell><Input placeholder="Ex: Aluguel" value={cost.name} onChange={e => updateFixedCost(cost.id, 'name', e.target.value)} /></TableCell>
                                    <TableCell><Input type="number" placeholder="1500,00" value={cost.monthlyCost || ''} onChange={e => updateFixedCost(cost.id, 'monthlyCost', e.target.value)} /></TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeFixedCost(cost.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Button variant="outline" className="mt-4 w-full" onClick={addFixedCost}>
                        <PlusCircle className="mr-2" /> Adicionar Custo
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Calculation and Result Column */}
        <div className="space-y-8">
            {/* Configuration Card */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Configuração da Precificação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Média de pratos vendidos por mês</label>
                        <Input type="number" value={dishesPerMonth || ''} onChange={e => setDishesPerMonth(Number(e.target.value))} />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Margem de lucro desejada (%)</label>
                        <Input type="number" value={profitMargin || ''} onChange={e => setProfitMargin(Number(e.target.value))} />
                    </div>
                    <Button className="w-full h-12 text-lg font-bold" onClick={calculatePrice}>Calcular Preço Ideal</Button>
                </CardContent>
            </Card>

            {/* Result Card */}
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
             {/* Previous calculations (placeholder) */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Cálculos Anteriores</CardTitle>
                    <CardDescription>Seus cálculos salvos aparecerão aqui.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    Em breve.
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

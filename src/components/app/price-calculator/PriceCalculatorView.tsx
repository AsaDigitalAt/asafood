'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, PlusCircle, ArrowLeft, Calculator, ListChecks, Loader2, Save, Edit, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Ingredient, type CalculationPayload, type PriceCalculationState } from '@/app/actions/calculate-price';
import { runPricingCalculation } from '@/lib/pricingFlow';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface PriceCalculatorViewProps {
    onBack: () => void;
}

// --- Types ---
type PriceCalculationResult = any[];
type View = 'initial' | 'calculation' | 'view_prices';
type CalculationStep = 'form' | 'result';
type SavedCalculation = {
    id: string;
    productName: string;
    calculationData: any;
    createdAt: { toDate: () => Date } | null;
};

// --- Main Component ---
export default function PriceCalculatorView({ onBack }: PriceCalculatorViewProps) {
  // --- Hooks ---
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  // --- State ---
  const [view, setView] = useState<View>('initial');
  const [step, setStep] = useState<CalculationStep>('form');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isFromSaved, setIsFromSaved] = useState<boolean>(false);

  // Form State
  const [productName, setProductName] = useState<string>('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [taxes, setTaxes] = useState<number>(7);
  const [deliveryType, setDeliveryType] = useState<'propria' | 'ifood'>('ifood');
  const [result, setResult] = useState<PriceCalculationResult | null>(null);

  // --- Profile Verification ---
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userDocRef);

  const isSuspended = userProfile?.planStatus === 'inactive' || userProfile?.planStatus === 'past_due';
  const pricingEnabled = userProfile?.features?.pricingEnabled !== false;

  // --- Firestore Data ---
  const calculationsQuery = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      // Usamos path absoluto para garantir compatibilidade com as regras
      return query(collection(firestore, 'users', user.uid, 'priceCalculations'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);
  
  // Capturamos erro aqui para evitar que a página inteira trave, mas com as regras corrigidas o erro não deve ocorrer
  const { data: savedCalculations, isLoading: areCalculationsLoading, error: calculationsError } = useCollection<SavedCalculation>(calculationsQuery);


  // --- Handlers ---
  const handleNewCalculation = () => {
    setProductName('');
    setIngredients([{ id: Date.now(), name: '', totalCost: 0, totalWeight: 1000, plateWeight: 0 }]);
    setProfitMargin(30);
    setTaxes(7);
    setDeliveryType('ifood');
    setResult(null);
    setStep('form');
    setView('calculation');
    setIsFromSaved(false);
  };

  const handleCalculatePrice = async () => {
    if (isSuspended || !pricingEnabled) {
        toast({ variant: "destructive", title: "Acesso Bloqueado", description: isSuspended ? "Seu plano está inativo." : "Esta ferramenta não está inclusa no seu plano atual." });
        return;
    }

    if (!productName.trim()) {
        toast({ variant: "destructive", title: "Campo Obrigatório", description: "Por favor, preencha o nome do produto." });
        return;
    }

    setIsCalculating(true);
    setResult(null);

    const payload: CalculationPayload = {
      productName,
      ingredients,
      profitMargin,
      taxes,
      deliveryType,
    };

    try {
      const data = await runPricingCalculation(payload);
      const webhookResponse = data?.[0];

      if (!webhookResponse || !webhookResponse.output) {
        throw new Error("Resposta do servidor inválida ou vazia.");
      }
      
      if(webhookResponse.output.erros && webhookResponse.output.erros.length > 0) {
        throw new Error(webhookResponse.output.erros.join(', '));
      }
      
      setResult(data);
      setStep('result');
      toast({ title: "Cálculo bem-sucedido!", description: "O dashboard de precificação foi gerado." });

    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no Cálculo", description: error.message || "Não foi possível conectar ao serviço." });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveCalculation = async () => {
    if (!user || !firestore || !result) return;
    setIsSaving(true);
    try {
        const docToSave = {
            userId: user.uid,
            productName: productName,
            calculationData: result[0],
            createdAt: serverTimestamp(),
        };
        await addDoc(collection(firestore, 'users', user.uid, 'priceCalculations'), docToSave);
        toast({ title: 'Sucesso!', description: `O produto '${productName}' foi salvo.` });
        setView('view_prices');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao Salvar', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteCalculation = async (id: string) => {
    if (!user || !firestore) return;
    try {
        await deleteDoc(doc(firestore, 'users', user.uid, 'priceCalculations', id));
        toast({ title: 'Produto Removido', description: 'O cálculo foi removido com sucesso.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao Remover', description: error.message });
    }
  };
  
  const handleViewSaved = (calculation: SavedCalculation) => {
    setProductName(calculation.productName);
    setResult([calculation.calculationData]);
    setStep('result');
    setView('calculation');
    setIsFromSaved(true); 
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
          if (field === 'name') return { ...ing, name: value };
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

  // --- Render Functions ---
  const renderInitial = () => (
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

  const renderCalculationForm = () => (
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

        {(isSuspended || !pricingEnabled) && !isProfileLoading && (
             <Alert variant="destructive" className="mb-8 danger-bg border-destructive/30 text-red-400">
                <ShieldAlert className="h-5 w-5 !text-red-400" />
                <AlertTitle className="font-bold">{isSuspended ? "Plano Inativo" : "Ferramenta Bloqueada"}</AlertTitle>
                <AlertDescription>
                    {isSuspended ? "Seu plano está inativo. Regularize sua assinatura." : "Esta ferramenta não está inclusa no seu plano. Faça um upgrade para liberar."}
                </AlertDescription>
            </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Dados do Produto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label htmlFor="product-name">Nome do Produto</Label>
                            <Input id="product-name" placeholder="Ex: X-Tudo da Casa" value={productName} onChange={e => setProductName(e.target.value)} className="text-base" />
                        </div>
                        <div>
                            <Label className="uppercase text-xs tracking-widest font-bold mb-3 block">Tipo de Entrega</Label>
                            <RadioGroup value={deliveryType} onValueChange={(v: any) => setDeliveryType(v)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Label htmlFor="propria" className="flex items-center justify-center gap-3 p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-primary has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:border-primary">
                                    <RadioGroupItem value="propria" id="propria" /> Entrega Própria
                                </Label>
                                <Label htmlFor="ifood" className="flex items-center justify-center gap-3 p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-primary has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:border-primary">
                                    <RadioGroupItem value="ifood" id="ifood" /> Entrega Parceira
                                </Label>
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>

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
                                        <Input id={`total-cost-${ing.id}`} type="number" value={ing.totalCost || ''} onChange={e => updateIngredient(ing.id, 'totalCost', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor={`total-weight-${ing.id}`}>Peso Total (g/ml)</Label>
                                        <Input id={`total-weight-${ing.id}`} type="number" value={ing.totalWeight || ''} onChange={e => updateIngredient(ing.id, 'totalWeight', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor={`plate-weight-${ing.id}`}>Qtd. no Prato (g/ml)</Label>
                                        <Input id={`plate-weight-${ing.id}`} type="number" value={ing.plateWeight || ''} onChange={e => updateIngredient(ing.id, 'plateWeight', e.target.value)} />
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
            </div>

            <div className="space-y-8">
                <Card className="glass-card sticky top-32">
                    <CardHeader>
                        <CardTitle>Configuração da Precificação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="text-center bg-card/50 p-4 rounded-xl">
                               <Label htmlFor="profit-margin" className="text-sm font-bold text-muted-foreground">MARGEM DE LUCRO</Label>
                               <div className="relative mt-1">
                                   <Input id="profit-margin" type="number" value={profitMargin || ''} onChange={e => setProfitMargin(Number(e.target.value))} className="text-3xl font-bold h-16 text-center bg-transparent border-0 pl-8" />
                                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">%</span>
                               </div>
                           </div>
                           <div className="text-center bg-card/50 p-4 rounded-xl">
                               <Label htmlFor="taxes" className="text-sm font-bold text-muted-foreground">IMPOSTOS</Label>
                               <div className="relative mt-1">
                                   <Input id="taxes" type="number" value={taxes || ''} onChange={e => setTaxes(Number(e.target.value))} className="text-3xl font-bold h-16 text-center bg-transparent border-0 pl-8" />
                                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">%</span>
                               </div>
                           </div>
                        </div>
                         <Button 
                            className="w-full h-12 text-lg font-bold" 
                            onClick={handleCalculatePrice} 
                            disabled={isCalculating || isSuspended || !pricingEnabled}
                        >
                            {isCalculating ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Calculando...</>
                            ) : (
                                "Calcular Preço Ideal"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
  );
  
  const renderResultDashboard = () => {
    const data = result?.[0]?.output;
    if (!data) return null;
    const { precoSugerido, custos, valores, inputs, insights } = data;
    
    return (
        <div className="max-w-5xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
            <div className="glass-card rounded-3xl p-6 md:p-10 shadow-2xl">
                <header className="text-center mb-12">
                     <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
                        <span className="text-gradient">Análise de Preço: </span> 
                        <span className="text-primary">{productName}</span>
                    </h1>
                </header>
                <div className="space-y-8">
                    <Card className="bg-primary/10 border-primary/20 text-center p-8">
                        <CardDescription className="text-lg uppercase font-bold tracking-widest text-primary">Preço de Venda Sugerido</CardDescription>
                        <CardTitle className="text-7xl font-extrabold text-primary">R$ {(precoSugerido ?? 0).toFixed(2)}</CardTitle>
                    </Card>
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="bg-card/80 p-6 text-center">
                            <CardDescription>Custo (CMV)</CardDescription>
                            <CardTitle className="text-3xl font-bold">R$ {(custos?.cmv ?? 0).toFixed(2)}</CardTitle>
                        </Card>
                         <Card className="bg-card/80 p-6 text-center">
                            <CardDescription>Impostos ({inputs?.impostoPercentual ?? 0}%)</CardDescription>
                            <CardTitle className="text-3xl font-bold">R$ {(valores?.valorImposto ?? 0).toFixed(2)}</CardTitle>
                        </Card>
                        <Card className="bg-card/80 p-6 text-center">
                            <CardDescription>Margem ({inputs?.margemPercentual ?? 0}%)</CardDescription>
                            <CardTitle className="text-3xl font-bold">R$ {(valores?.valorMargem ?? 0).toFixed(2)}</CardTitle>
                        </Card>
                    </div>
                    {insights && (
                    <Card className="glass-card">
                         <CardHeader><CardTitle>Insights do Custo</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">{insights.impactoImpostoResumo}</p>
                            {insights.impactoRetencaoResumo && <p className="font-bold text-primary animate-pulse">{insights.impactoRetencaoResumo}</p>}
                            <div>
                                <h4 className="font-bold mb-2">Maiores Custos (Ingredientes):</h4>
                                <div className="space-y-2">
                                {insights.topIngredientes.map((ing: any) => (
                                    <div key={ing.id} className="flex justify-between p-3 bg-card/50 rounded-lg">
                                        <span>{ing.name}</span>
                                        <span className="font-bold">R$ {(ing.custoNoPrato ?? 0).toFixed(2)} ({(ing.shareCmvPercent ?? 0).toFixed(1)}% do CMV)</span>
                                    </div>
                                ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    )}
                    <div className="flex flex-col md:flex-row justify-center gap-4 pt-8">
                        {!isFromSaved && (
                             <Button variant="outline" size="lg" className="h-12" onClick={() => setStep('form')}><Edit className="mr-2"/> Refazer Cálculo</Button>
                        )}
                         <Button size="lg" className="h-12 bg-green-600 hover:bg-green-700" onClick={handleSaveCalculation} disabled={isSaving || isFromSaved}>
                            {isSaving ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2" />} {isFromSaved ? 'Produto Salvo' : 'Aprovar e Salvar'}
                        </Button>
                    </div>
                     {isFromSaved && (
                        <div className="text-center mt-4">
                            <Button variant="link" onClick={() => setView('view_prices')}><ArrowLeft className="mr-2"/> Voltar para a lista</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
  };

  const renderViewPrices = () => (
    <div className="max-w-5xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
        <div className="flex items-center mb-12">
            <Button onClick={() => setView('initial')} variant="outline" size="icon" className="h-12 w-12 rounded-full mr-6"><ArrowLeft className="h-5 w-5" /></Button>
            <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-2"><span className="text-gradient">Cálculos </span> <span className="text-primary">Salvos</span></h1>
                <p className="text-lg text-muted-foreground">Aqui estão os produtos que você já precificou.</p>
            </div>
        </div>
        {areCalculationsLoading && <p>Carregando produtos...</p>}
        {calculationsError && (
             <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao carregar cálculos</AlertTitle>
                <AlertDescription>Ocorreu um problema ao carregar seus dados salvos. Tente recarregar a página.</AlertDescription>
            </Alert>
        )}
        {(!savedCalculations || savedCalculations.length === 0) && !areCalculationsLoading && !calculationsError && (
            <Card className="glass-card text-center p-16">
                 <p className="text-muted-foreground">Nenhum produto salvo ainda.</p>
                 <Button variant="link" className="mt-4" onClick={handleNewCalculation}>Calcular seu primeiro produto</Button>
            </Card>
        )}
        <div className="space-y-4">
            {savedCalculations && savedCalculations.map(calc => (
                <Card key={calc.id} className="glass-card p-4 group cursor-pointer hover:border-primary" onClick={() => handleViewSaved(calc)}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold group-hover:text-primary">{calc.productName}</h3>
                            <p className="text-sm text-muted-foreground">Salvo em: {calc.createdAt ? format(calc.createdAt.toDate(), 'dd/MM/yyyy') : 'Data pendente'}</p>
                        </div>
                        <div className='flex items-center gap-4'>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Preço Sugerido</p>
                                <p className="text-xl font-bold">R$ {(calc.calculationData?.output?.precoSugerido ?? 0).toFixed(2)}</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="opacity-50 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}><Trash2 className="h-5 w-5 text-destructive" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isso removerá permanentemente o produto <strong> {calc.productName}</strong>.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCalculation(calc.id)} className="bg-destructive hover:bg-destructive/90">Sim, remover</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    </div>
  );

  const renderContent = () => {
    switch(view) {
        case 'calculation': return step === 'form' ? renderCalculationForm() : renderResultDashboard();
        case 'view_prices': return renderViewPrices();
        case 'initial':
        default: return renderInitial();
    }
  }

  return renderContent();
}
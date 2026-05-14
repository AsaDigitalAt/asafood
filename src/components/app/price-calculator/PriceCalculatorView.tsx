'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, PlusCircle, ArrowLeft, Calculator, ListChecks, Loader2, Save, Edit, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Ingredient } from '@/app/actions/calculate-price';
import { runPricingCalculation } from '@/lib/pricingFlow';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useAccessControl } from '@/hooks/use-access-control';
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

type PriceCalculationResult = any[];
type View = 'initial' | 'calculation' | 'view_prices';
type CalculationStep = 'form' | 'result';
type SavedCalculation = {
    id: string;
    productName: string;
    calculationData: any;
    createdAt: { toDate: () => Date } | null;
};

export default function PriceCalculatorView({ onBack }: PriceCalculatorViewProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const [view, setView] = useState<View>('initial');
  const [step, setStep] = useState<CalculationStep>('form');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isFromSaved, setIsFromSaved] = useState<boolean>(false);

  const [productName, setProductName] = useState<string>('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [taxes, setTaxes] = useState<number>(7);
  const [deliveryType, setDeliveryType] = useState<'propria' | 'ifood'>('ifood');
  const [result, setResult] = useState<PriceCalculationResult | null>(null);

  // Perfil do usuário verificado via hook global
  const { isDeveloper, pricing, isSuspended, isLoading } = useAccessControl();

  // Busca o histórico do usuário
  const calculationsQuery = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return query(collection(firestore, 'users', user.uid, 'priceCalculations'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);
  
  const { data: savedCalculations, isLoading: areCalculationsLoading } = useCollection<SavedCalculation>(calculationsQuery);

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
    // A restrição agora ocorre apenas no momento de disparar o cálculo
    if (!isLoading && !pricing.canGenerate && !isDeveloper) {
        toast({ 
          variant: "destructive", 
          title: "Ação Bloqueada", 
          description: isSuspended ? "Seu plano está inativo. Regularize sua assinatura para prosseguir." : "Você atingiu o limite ou este recurso não faz parte do seu plano." 
        });
        return;
    }

    if (!productName.trim()) {
        toast({ variant: "destructive", title: "Campo Obrigatório", description: "O nome do produto é necessário para o cálculo." });
        return;
    }

    setIsCalculating(true);
    setResult(null);

    try {
      const data = await runPricingCalculation({
        productName,
        ingredients,
        profitMargin,
        taxes,
        deliveryType,
      });

      if (!data?.[0]?.output) throw new Error("Falha ao obter resposta do motor de cálculo.");
      
      setResult(data);
      setStep('result');
      toast({ title: "Cálculo Finalizado!", description: "Análise de precificação gerada com sucesso." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no Motor de Cálculo", description: error.message });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveCalculation = async () => {
    if (!user || !firestore || !result) return;
    setIsSaving(true);
    try {
        await addDoc(collection(firestore, 'users', user.uid, 'priceCalculations'), {
            userId: user.uid,
            productName: productName,
            calculationData: result[0],
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Salvo!', description: `Produto '${productName}' armazenado no histórico.` });
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
        toast({ title: 'Removido', description: 'O registro foi excluído do histórico.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao Excluir', description: error.message });
    }
  };
  
  const handleViewSaved = (calculation: SavedCalculation) => {
    setProductName(calculation.productName);
    setResult([calculation.calculationData]);
    setStep('result');
    setView('calculation');
    setIsFromSaved(true); 
  };

  const updateIngredient = (id: number, field: keyof Ingredient, value: string) => {
    setIngredients(ingredients.map(ing => {
      if (ing.id === id) {
        if (field === 'name') return { ...ing, name: value };
        const num = parseFloat(value);
        return { ...ing, [field]: isNaN(num) ? 0 : num };
      }
      return ing;
    }));
  };

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
                <p className="text-lg text-muted-foreground">Analise sua margem e defina o preço ideal.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-card p-8 text-center flex flex-col items-center cursor-pointer group hover:border-primary transition-all" onClick={handleNewCalculation}>
                <Calculator className="w-16 h-16 mb-6 text-primary/50 group-hover:text-primary transition-colors" />
                <h2 className="text-2xl font-bold mb-2">Novo Cálculo</h2>
                <p className="text-muted-foreground">Precifique um novo item do zero.</p>
            </Card>
            <Card className="glass-card p-8 text-center flex flex-col items-center cursor-pointer group hover:border-primary transition-all" onClick={() => setView('view_prices')}>
                <ListChecks className="w-16 h-16 mb-6 text-primary/50 group-hover:text-primary transition-colors" />
                <h2 className="text-2xl font-bold mb-2">Conferir Preços</h2>
                <p className="text-muted-foreground">Histórico de produtos salvos.</p>
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
                    <span className="text-gradient">Novo </span> 
                    <span className="text-primary">Cálculo</span>
                </h1>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
                <Card className="glass-card">
                    <CardHeader><CardTitle>Informações Gerais</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label>Nome do Produto</Label>
                            <Input placeholder="Ex: Burger Bacon" value={productName} onChange={e => setProductName(e.target.value)} />
                        </div>
                        <div>
                            <Label className="block mb-3">Logística de Entrega</Label>
                            <RadioGroup value={deliveryType} onValueChange={(v: any) => setDeliveryType(v)} className="grid grid-cols-2 gap-4">
                                <Label htmlFor="propria" className="flex items-center justify-center p-4 border rounded-xl cursor-pointer has-[[data-state=checked]]:bg-primary/10">
                                    <RadioGroupItem value="propria" id="propria" className="mr-2" /> Própria
                                </Label>
                                <Label htmlFor="ifood" className="flex items-center justify-center p-4 border rounded-xl cursor-pointer has-[[data-state=checked]]:bg-primary/10">
                                    <RadioGroupItem value="ifood" id="ifood" className="mr-2" /> Parceira
                                </Label>
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader><CardTitle>Ficha Técnica (Insumos)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {ingredients.map(ing => (
                            <Card key={ing.id} className="p-4 bg-card/50">
                                <div className="flex justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <Label>Insumo</Label>
                                        <Input placeholder="Ex: Carne Moída" value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)} />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))} className="mt-6">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><Label>Preço (R$)</Label><Input type="number" value={ing.totalCost || ''} onChange={e => updateIngredient(ing.id, 'totalCost', e.target.value)} /></div>
                                    <div><Label>Peso Tot. (g)</Label><Input type="number" value={ing.totalWeight || ''} onChange={e => updateIngredient(ing.id, 'totalWeight', e.target.value)} /></div>
                                    <div><Label>No Prato (g)</Label><Input type="number" value={ing.plateWeight || ''} onChange={e => updateIngredient(ing.id, 'plateWeight', e.target.value)} /></div>
                                </div>
                            </Card>
                        ))}
                        <Button variant="outline" className="w-full" onClick={() => setIngredients([...ingredients, { id: Date.now(), name: '', totalCost: 0, totalWeight: 1000, plateWeight: 0 }])}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Insumo
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                <Card className="glass-card sticky top-32">
                    <CardHeader><CardTitle>Metas Financeiras</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-card/50 p-4 rounded-xl text-center">
                               <Label className="text-xs font-bold">LUCRO DESEJADO (%)</Label>
                               <Input type="number" value={profitMargin || ''} onChange={e => setProfitMargin(Number(e.target.value))} className="text-2xl font-bold h-12 text-center mt-2" />
                           </div>
                           <div className="bg-card/50 p-4 rounded-xl text-center">
                               <Label className="text-xs font-bold">IMPOSTOS (%)</Label>
                               <Input type="number" value={taxes || ''} onChange={e => setTaxes(Number(e.target.value))} className="text-2xl font-bold h-12 text-center mt-2" />
                           </div>
                        </div>
                        <Button className="w-full h-14 font-bold text-lg" onClick={handleCalculatePrice} disabled={isCalculating}>
                            {isCalculating ? <Loader2 className="animate-spin" /> : "Gerar Preço Ideal"}
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
    return (
        <div className="max-w-5xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
            <div className="glass-card rounded-3xl p-6 md:p-10 shadow-2xl">
                <header className="text-center mb-12 relative flex items-center justify-center">
                     <Button 
                        onClick={() => isFromSaved ? setView('view_prices') : setStep('form')} 
                        variant="outline" 
                        size="icon" 
                        className="absolute left-0 h-12 w-12 rounded-full hidden md:flex"
                     >
                        <ArrowLeft className="h-5 w-5" />
                     </Button>
                     <div className="w-full flex justify-between items-center md:hidden mb-6">
                         <Button 
                            onClick={() => isFromSaved ? setView('view_prices') : setStep('form')} 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 rounded-full shrink-0"
                         >
                            <ArrowLeft className="h-4 w-4" />
                         </Button>
                     </div>
                     <h1 className="text-3xl md:text-4xl font-extrabold mb-0 md:mb-3 flex-1 text-center md:text-center mt-2 md:mt-0">Preço Ideal: <span className="text-primary block md:inline">{productName}</span></h1>
                </header>
                <div className="space-y-8">
                    <div className="bg-primary/10 border-primary/20 rounded-3xl text-center p-10">
                        <span className="uppercase text-xs font-black tracking-widest text-primary opacity-60">Preço Sugerido Asa Food</span>
                        <h2 className="text-7xl font-black text-primary">R$ {(data.precoSugerido ?? 0).toFixed(2)}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6 text-center">
                            <Label className="text-muted-foreground">Custo Unitário (CMV)</Label>
                            <p className="text-2xl font-bold">R$ {(data.custos?.cmv ?? 0).toFixed(2)}</p>
                        </Card>
                         <Card className="p-6 text-center">
                            <Label className="text-muted-foreground">Margem de Lucro</Label>
                            <p className="text-2xl font-bold">R$ {(data.valores?.valorMargem ?? 0).toFixed(2)}</p>
                        </Card>
                        <Card className="p-6 text-center">
                            <Label className="text-muted-foreground">Impostos/Taxas</Label>
                            <p className="text-2xl font-bold">R$ {(data.valores?.valorImposto ?? 0).toFixed(2)}</p>
                        </Card>
                    </div>
                    <div className="flex justify-center gap-4 pt-8">
                        {!isFromSaved && <Button variant="outline" size="lg" onClick={() => setStep('form')}><Edit className="mr-2 h-4 w-4"/> Editar</Button>}
                        <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={handleSaveCalculation} disabled={isSaving || isFromSaved}>
                            {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Save className="mr-2 h-4 w-4" />} {isFromSaved ? 'Salvo no Histórico' : 'Salvar Resultado'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
  };

  const renderViewPrices = () => (
    <div className="max-w-5xl mx-auto px-4 py-24 md:py-32 opacity-0 animate-fade-up">
        <div className="flex items-center mb-12">
            <Button onClick={() => setView('initial')} variant="outline" size="icon" className="h-12 w-12 rounded-full mr-6"><ArrowLeft className="h-5 w-5" /></Button>
            <h1 className="text-4xl font-extrabold">Histórico de <span className="text-primary">Preços</span></h1>
        </div>
        {areCalculationsLoading ? <p className="text-center py-10">Carregando seus registros...</p> : (
            <div className="space-y-4">
                {savedCalculations?.map(calc => (
                    <Card key={calc.id} className="p-6 hover:border-primary cursor-pointer transition-all" onClick={() => handleViewSaved(calc)}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">{calc.productName}</h3>
                                <p className="text-sm text-muted-foreground">{calc.createdAt ? format(calc.createdAt.toDate(), 'dd/MM/yyyy') : '---'}</p>
                            </div>
                            <div className='flex items-center gap-6'>
                                <div className="text-right">
                                    <p className="text-2xl font-black">R$ {(calc.calculationData?.output?.precoSugerido ?? 0).toFixed(2)}</p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><Trash2 className="h-5 w-5 text-destructive" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Excluir Cálculo?</AlertDialogTitle><AlertDialogDescription>Deseja remover o produto <strong> {calc.productName}</strong> do histórico?</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCalculation(calc.id)} className="bg-destructive">Excluir</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        )}
    </div>
  );

  if (view === 'calculation') return step === 'form' ? renderCalculationForm() : renderResultDashboard();
  if (view === 'view_prices') return renderViewPrices();
  return renderInitial();
}
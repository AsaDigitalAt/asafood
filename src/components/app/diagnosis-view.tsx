"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BarChart3, CheckCircle, Loader2, UploadCloud, UtensilsCrossed, ChevronDown, ShieldAlert } from "lucide-react";
import { useState } from "react";
import Image from 'next/image';
import { generateDiagnosis, FormState } from "@/app/actions/generate-diagnosis";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirebase, useUser, useMemoFirebase, FirestorePermissionError, errorEmitter } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// --- Schema ---
const diagnosisSchema = z.object({
  restaurantName: z.string().min(1, "O nome do restaurante é obrigatório."),
  foodCategory: z.string().min(1, "O nicho de comida é obrigatório."),
  deliveryType: z.enum(["propria", "ifood"], {
    required_error: "Selecione o tipo de entrega.",
  }),
  currentMonthRevenue: z.coerce.number().min(0, "O faturamento deve ser positivo."),
  currentMonthDiscounts: z.coerce.number().min(0, "O desconto deve ser positivo."),
  previousMonthRevenue: z.coerce.number().min(0, "O faturamento deve ser positivo."),
  previousMonthDiscounts: z.coerce.number().min(0, "O desconto deve ser positivo."),
  funnelImage: z.any().refine((file) => file instanceof File, "A imagem do funil é obrigatória."),
  productImage: z.any().refine((file) => file instanceof File, "A imagem do produto é obrigatória."),
});

// --- Components ---

const HeroSection = () => (
  <div className="relative min-h-screen w-full flex flex-col justify-center items-center text-center px-4 overflow-hidden">
    <div className="relative z-10 max-w-3xl mt-16">
      <span className="inline-block py-2 px-6 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-bold uppercase tracking-widest mb-8 opacity-0 animate-fade-up shadow-lg backdrop-blur-sm">
        Área Exclusiva
      </span>
      <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 opacity-0 animate-fade-up [animation-delay:200ms]">
        <span className="text-gradient">Diagnóstico de </span> 
        <span className="text-primary text-shadow-[0_0_40px_var(--tw-shadow-color)] shadow-primary/50">Performance</span>
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 opacity-0 animate-fade-up [animation-delay:400ms]">
        Sua consultoria está ativa. Insira os dados operacionais abaixo para processar seu plano de ação estratégico.
      </p>
    </div>
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground text-xs tracking-widest uppercase opacity-0 animate-fade-in [animation-delay:1500ms]">
        <div className="animate-bounce-indicator">
            <ChevronDown className="h-6 w-6 mx-auto" />
            Role para preencher
        </div>
    </div>
  </div>
);

const Marquee = () => {
    const items = ["Aumento de Conversão", "Margem Saudável", "Visibilidade no Topo", "Cardápio Atrativo", "Avaliação 5 Estrelas", "Menos Cancelamentos"];
    const icons = ["🚀", "💰", "📈", "🍔", "⭐", "📉"];
    const marqueeItems = [...items, ...items].map((item, index) => (
      <div key={index} className="flex items-center gap-4 font-bold text-muted-foreground text-base uppercase tracking-wider whitespace-nowrap">
        <span className="text-primary text-xl">{icons[index % icons.length]}</span>
        {item}
      </div>
    ));
    
    return (
        <section className="w-full bg-slate-900/40 border-y border-white/5 backdrop-blur-lg py-6 overflow-hidden relative z-10 mb-20 md:mb-32">
            <div className="flex gap-20 animate-scroll-marquee">
                {marqueeItems}
            </div>
        </section>
    );
}

const UploadCard = ({ name, title, description, icon, form }: { name: "funnelImage" | "productImage", title: string, description: string, icon: React.ReactNode, form: any }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const file = form.watch(name);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue(name, file, { shouldValidate: true });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
      <div className="opacity-0 animate-pop-up">
        <FormItem>
          <FormLabel className="sr-only">{title}</FormLabel>
          <FormControl>
            <div 
              className={cn(
                "glass-card rounded-3xl p-8 text-center min-h-[350px] flex flex-col justify-center items-center transition-all duration-300 cursor-pointer relative overflow-hidden group",
                "hover:border-primary hover:bg-slate-800/80 hover:-translate-y-2 hover:shadow-2xl",
                file && "border-primary"
              )}
              onClick={() => document.getElementById(name)?.click()}
            >
              <input
                  type="file"
                  id={name}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
              />
              {preview ? (
                  <>
                    <Image src={preview} alt="Preview" fill className="object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
                    <div className="relative z-10 flex flex-col items-center justify-center bg-black/50 p-6 rounded-full border border-primary">
                        <CheckCircle className="w-12 h-12 text-primary mb-2" />
                        <span className="font-bold text-white">Imagem Carregada</span>
                    </div>
                  </>
              ) : (
                  <>
                      <div className="absolute top-6 left-6 py-1 px-3 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest">Obrigatório</div>
                      <div className="text-5xl mb-6 text-slate-400 group-hover:text-primary transition-colors duration-300 group-hover:drop-shadow-[0_0_15px_var(--tw-shadow-color)] shadow-primary/50">
                          {icon}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                      <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: description }}/>
                  </>
              )}
            </div>
          </FormControl>
          <FormMessage className="text-center mt-2" />
        </FormItem>
      </div>
    );
};

const fileToDataURI = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

// --- Main Component ---
interface DiagnosisViewProps {
  onFormSubmitStart: () => void;
  onFormSubmitEnd: (data: FormState) => void;
}

export function DiagnosisView({ onFormSubmitStart, onFormSubmitEnd }: DiagnosisViewProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<{status: string}>(userDocRef);

  const isSuspended = userProfile?.status === 'suspended';

  const form = useForm<z.infer<typeof diagnosisSchema>>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      restaurantName: "",
      foodCategory: "",
      currentMonthRevenue: undefined,
      currentMonthDiscounts: undefined,
      previousMonthRevenue: undefined,
      previousMonthDiscounts: undefined,
    },
  });

  const onFormSubmit = async (data: FormData) => {
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não encontrado." });
        return;
    }
     if (isSuspended) {
        toast({ variant: "destructive", title: "Conta Suspensa", description: "Sua conta está suspensa. Contate o suporte." });
        return;
    }

    onFormSubmitStart();

    let usageEventId: string | null = null;
    try {
        const rawFormData = Object.fromEntries(data.entries());
        const validatedFields = diagnosisSchema.safeParse(rawFormData);

        let requestPayload: any = {};
        
        if (validatedFields.success) {
            const { funnelImage, productImage, ...rest } = validatedFields.data;
            const funnelImageURI = await fileToDataURI(funnelImage);
            const productImageURI = await fileToDataURI(productImage);
            requestPayload = { ...rest, funnelImage: funnelImageURI, productImage: productImageURI };
        } else {
            const { funnelImage, productImage, ...rest } = rawFormData;
            requestPayload = rest;
        }

        const usageEventsColRef = collection(firestore, `users/${user.uid}/usageEvents`);
        const usageEventData = {
            userId: user.uid,
            action: 'generate_diagnosis',
            status: 'started',
            timestamp: serverTimestamp(),
            metadata: { requestPayload }
        };
        const usageEventRef = await addDoc(usageEventsColRef, usageEventData)
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: usageEventsColRef.path,
                    operation: 'create',
                    requestResourceData: usageEventData,
                });
                errorEmitter.emit('permission-error', permissionError);
                // Re-throw a user-friendly error to be caught by the outer try-catch
                throw new Error('Falha ao registrar o evento de uso. Verifique suas permissões.');
            });

        usageEventId = usageEventRef.id;

        const result = await generateDiagnosis(data);
        
        const eventDocRef = doc(firestore, `users/${user.uid}/usageEvents`, usageEventId);
        const updateData = {
            status: result.error ? 'failure' : 'success',
            'metadata.responsePayload': result.error ? { error: result.error } : result,
        };
        
        updateDoc(eventDocRef, updateData)
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: eventDocRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
                // This is a non-critical logging error, so we don't disrupt the user flow.
                // The global error listener will catch it for dev purposes.
            });
        
        onFormSubmitEnd(result);

        if (result?.error) {
            toast({
                variant: "destructive",
                title: "Erro na Análise",
                description: result.error,
            });
        }
    } catch (e: any) {
        const errorMessage = e.message || 'Ocorreu um erro ao gerar o diagnóstico. Tente novamente.';
        
        if (usageEventId) {
            const eventDocRef = doc(firestore, `users/${user.uid}/usageEvents`, usageEventId);
            const updateData = { status: 'failure', 'metadata.responsePayload': { error: errorMessage }};
            
            updateDoc(eventDocRef, updateData)
                .catch(serverError => {
                    const permissionError = new FirestorePermissionError({
                        path: eventDocRef.path,
                        operation: 'update',
                        requestResourceData: updateData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
        }
        
        toast({ variant: "destructive", title: "Erro Inesperado", description: errorMessage });
        onFormSubmitEnd({ error: errorMessage, nome: '', statusGeral: '', conversions: {}, discounts: {}, problems: [], actions: [], priorities: [], aiGeneratedPlan: null });
    }
  };

  return (
    <>
      <HeroSection />
      <Marquee />
      <section className="px-4 pb-24 md:pb-32 max-w-4xl mx-auto">
        {isSuspended && (
             <Alert variant="destructive" className="mb-12 danger-bg border-destructive/30 text-red-400">
                <ShieldAlert className="h-5 w-5 !text-red-400" />
                <AlertTitle className="font-bold">Conta Suspensa</AlertTitle>
                <AlertDescription>
                    Sua conta foi suspensa e você não pode mais gerar diagnósticos. Por favor, entre em contato com o suporte para mais informações.
                </AlertDescription>
            </Alert>
        )}
        <div className="text-center mb-16 md:mb-20 opacity-0 animate-fade-up [animation-delay:500ms]">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5"><span className="text-gradient">LEVEL UP: ANÁLISE DE PERFORMANCE</span></h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">Complete os dados da missão abaixo para desbloquear seu plano de ação.</p>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-8 shadow-[0_0_20px_var(--tw-shadow-color)] shadow-primary/50"></div>
        </div>

        <Form {...form}>
          <form action={onFormSubmit} className="space-y-12">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                <UploadCard 
                    name="funnelImage"
                    title="Funil de Vendas"
                    description="Print do Portal do Parceiro<br/>(Desempenho > Cardápio)"
                    icon={<BarChart3 />}
                    form={form}
                />
                <UploadCard 
                    name="productImage"
                    title="Produto Campeão"
                    description="Foto do item mais vendido<br/>do seu cardápio"
                    icon={<UtensilsCrossed />}
                    form={form}
                />
            </div>
            
            <div className="space-y-8 opacity-0 animate-fade-up [animation-delay:700ms]">
              <FormField
                control={form.control}
                name="restaurantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">Nome do Restaurante</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Hamburgueria do João" {...field} className="bg-black/20 border-white/10 rounded-full py-7 px-7 text-base focus:bg-primary/5 focus:border-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foodCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">Nicho de comida</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Hamburgueria, Sushi..." {...field} className="bg-black/20 border-white/10 rounded-full py-7 px-7 text-base focus:bg-primary/5 focus:border-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="deliveryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">Tipo de Entrega</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <FormLabel htmlFor="propria" className="flex items-center justify-center gap-3 p-5 bg-black/20 border border-white/10 rounded-full cursor-pointer hover:bg-primary/5 hover:border-primary has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:text-white">
                           <RadioGroupItem value="propria" id="propria" className="sr-only"/>
                           Entrega Própria
                        </FormLabel>
                        <FormLabel htmlFor="ifood" className="flex items-center justify-center gap-3 p-5 bg-black/20 border border-white/10 rounded-full cursor-pointer hover:bg-primary/5 hover:border-primary has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:text-white">
                           <RadioGroupItem value="ifood" id="ifood" className="sr-only"/>
                           Entrega do iFood
                        </FormLabel>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="space-y-6">
                <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
                     <h3 className="font-bold text-white text-lg">📅 Mês Atual</h3>
                     <FormField
                        control={form.control}
                        name="currentMonthRevenue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">Faturamento Bruto (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0,00" {...field} className="bg-black/20 border-white/10 rounded-full py-7 px-7 text-base focus:bg-primary/5 focus:border-primary" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="currentMonthDiscounts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">Descontos iFood (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0,00" {...field} className="bg-black/20 border-white/10 rounded-full py-7 px-7 text-base focus:bg-primary/5 focus:border-primary" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                </div>
                <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
                    <h3 className="font-bold text-white text-lg">📅 Mês Anterior</h3>
                    <FormField
                        control={form.control}
                        name="previousMonthRevenue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">Faturamento Bruto (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0,00" {...field} className="bg-black/20 border-white/10 rounded-full py-7 px-7 text-base focus:bg-primary/5 focus:border-primary" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="previousMonthDiscounts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">Descontos iFood (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0,00" {...field} className="bg-black/20 border-white/10 rounded-full py-7 px-7 text-base focus:bg-primary/5 focus:border-primary" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                </div>
            </div>

            <div className="pt-8 opacity-0 animate-fade-up [animation-delay:900ms]">
                <div className="relative p-0.5 rounded-full overflow-hidden group">
                  <div className="absolute inset-[-150%] animate-border-spin bg-[conic-gradient(from_90deg_at_50%_50%,#38BDF8_0%,#0F172A_50%,#38BDF8_100%)]"/>
                  <Button 
                    type="submit" 
                    className="relative w-full h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-lg font-bold uppercase tracking-widest transition-colors duration-300"
                    disabled={form.formState.isSubmitting || isSuspended}
                  >
                    {form.formState.isSubmitting ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      "Gerar Diagnóstico Completo"
                    )}
                  </Button>
                </div>
               </div>
            </div>
          </form>
        </Form>
      </section>
    </>
  );
}

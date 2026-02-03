"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BarChart3, CheckCircle, Loader2, UploadCloud, UtensilsCrossed, ChevronDown, ShieldAlert, Mail } from "lucide-react";
import { useState, useEffect } from "react";
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
  email: z.string().email("O e-mail é obrigatório."),
  uid: z.string().min(1, "UID do usuário é obrigatório."),
});

// --- Components ---
const HeroSection = () => {
    return (
        <div className="relative bg-primary text-primary-foreground min-h-screen flex flex-col justify-center items-center text-center overflow-hidden p-4">
            <Image
                src="https://firebasestorage.googleapis.com/v0/b/base-arquivos.firebasestorage.app/o/Camada%202.png?alt=media&token=b5e254f5-2ef5-4d35-9c71-ee095ed5795a"
                alt="Elemento decorativo de fundo 1"
                width={400}
                height={400}
                className="absolute top-0 left-0 w-auto h-auto max-w-[300px] md:max-w-[400px] -translate-x-1/4 -translate-y-1/4 opacity-100"
            />
            <Image
                src="https://firebasestorage.googleapis.com/v0/b/base-arquivos.firebasestorage.app/o/Camada%201.png?alt=media&token=718c45d7-1da6-478b-8168-f3f5423416b7"
                alt="Elemento decorativo de fundo 2"
                width={400}
                height={400}
                className="absolute bottom-0 right-0 w-auto h-auto max-w-[300px] md:max-w-[400px] translate-x-1/4 translate-y-1/4 opacity-100"
            />
            <div className="relative z-10 max-w-4xl mx-auto opacity-0 animate-fade-up">
                <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter">
                    Diagnóstico de Performance
                </h1>
                <p className="mt-4 text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                    Veja o que está travando seus resultados e saiba onde agir para destravar suas vendas no iFood.
                </p>
            </div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
                <div className="w-8 h-8 text-primary-foreground/50 animate-bounce-indicator">
                    <ChevronDown className="w-full h-full" />
                </div>
            </div>
        </div>
    );
};

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
        <section className="w-full bg-card/50 border-y border-border backdrop-blur-lg py-6 overflow-hidden">
            <div className="flex gap-20 animate-scroll-marquee">
                {marqueeItems}
            </div>
        </section>
    );
}

const UploadCard = ({ name, title, description, icon, form }: { name: "funnelImage", title: string, description: string, icon: React.ReactNode, form: any }) => {
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
                "hover:border-primary hover:-translate-y-1 hover:shadow-xl",
                file && "border-solid border-primary/50"
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
                    <Image src={preview} alt="Preview" layout="fill" className="object-cover opacity-10 group-hover:opacity-20 transition-opacity" />
                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                        <span className="font-bold text-foreground">Imagem Carregada</span>
                        <span className="text-xs text-muted-foreground mt-1">Clique para alterar</span>
                    </div>
                  </>
              ) : (
                  <>
                      <div className="text-5xl mb-6 text-primary transition-colors duration-300 group-hover:drop-shadow-[0_0_15px_var(--tw-shadow-color)] shadow-primary/50">
                          {icon}
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                      <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: description }}/>
                      <div className="mt-4 py-2 px-4 bg-muted text-muted-foreground rounded-full text-sm font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <UploadCloud className="inline-block mr-2 h-4 w-4" />
                        Fazer Upload
                      </div>
                  </>
              )}
            </div>
          </FormControl>
          <FormMessage className="text-center mt-2" />
        </FormItem>
      </div>
    );
};

// --- Main Component ---
interface DiagnosisViewProps {
  onFormSubmitStart: () => void;
  onFormSubmitEnd: (data: FormState) => void;
}

const planLimits: Record<string, number> = {
  convidado: 10,
  plano_unico: 1,
  plano_duplo: 2,
  plano_acelerador: 4,
  desenvolvedor: Infinity,
};

export function DiagnosisView({ onFormSubmitStart, onFormSubmitEnd }: DiagnosisViewProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<any>(userDocRef);

  const isSuspended = userProfile?.planStatus !== 'active';
  
  const form = useForm<z.infer<typeof diagnosisSchema>>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      restaurantName: "",
      foodCategory: "",
      deliveryType: "ifood",
      currentMonthRevenue: 0,
      currentMonthDiscounts: 0,
      previousMonthRevenue: 0,
      previousMonthDiscounts: 0,
      email: user?.email || "",
      uid: user?.uid || "",
    },
  });

  useEffect(() => {
    if (user?.email && user?.uid) {
      form.reset({ 
          ...form.getValues(), 
          email: user.email,
          uid: user.uid
      });
    }
     // Monthly usage reset logic
    if (userProfile && firestore && user) {
        const cycleDate = userProfile.usage?.cycleStart?.toDate();
        const now = new Date();
        if (cycleDate && (cycleDate.getMonth() !== now.getMonth() || cycleDate.getFullYear() !== now.getFullYear())) {
            const userRef = doc(firestore, "users", user.uid);
            updateDoc(userRef, {
                usage: {
                  reportsThisCycle: 0,
                  cycleStart: serverTimestamp()
                }
            }).catch(error => console.error("Failed to reset usage stats:", error));
        }
    }
  }, [user, userProfile, firestore, form]);
  
  const usageCount = userProfile?.usage?.reportsThisCycle ?? 0;
  const plan = userProfile?.plan || 'plano_acelerador'; // Default to accelerator
  const usageLimit = planLimits[plan] || 0;
  const isDeveloper = plan === 'desenvolvedor';
  const isLimitReached = !isDeveloper && usageCount >= usageLimit;


  const onFormSubmit = async (values: z.infer<typeof diagnosisSchema>) => {
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não encontrado." });
        return;
    }
     if (isSuspended) {
        toast({ variant: "destructive", title: "Conta Inativa", description: "Seu plano não está ativo. Contate o suporte." });
        return;
    }
    if (isLimitReached) {
        toast({ variant: "destructive", title: "Limite Atingido", description: "Você atingiu o limite de diagnósticos para este mês." });
        return;
    }

    onFormSubmitStart();

    const formData = new FormData();
    for (const key in values) {
      const typedKey = key as keyof typeof values;
      const value = values[typedKey];
      if (value) {
        formData.append(typedKey, value as string | Blob);
      }
    }

    let usageEventId: string | null = null;
    try {
        const usageEventsColRef = collection(firestore, `users/${user.uid}/usageEvents`);
        const usageEventData = {
            userId: user.uid,
            action: 'generate_diagnosis',
            status: 'started',
            timestamp: serverTimestamp(),
            metadata: { requestPayload: { ...values, funnelImage: values.funnelImage.name } }
        };
        const usageEventRef = await addDoc(usageEventsColRef, usageEventData)
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: usageEventsColRef.path,
                    operation: 'create',
                    requestResourceData: usageEventData,
                });
                errorEmitter.emit('permission-error', permissionError);
                // Translate permission error for the user
                throw new Error('Você atingiu o limite de diagnósticos do seu plano este mês.');
            });

        usageEventId = usageEventRef.id;

        const result = await generateDiagnosis(formData);
        
        const eventDocRef = doc(firestore, `users/${user.uid}/usageEvents`, usageEventId);
        const updateData = {
            status: result.error ? 'failure' : 'success',
            'metadata.responsePayload': result.error ? { error: result.error } : { success: true },
        };
        
        updateDoc(eventDocRef, updateData)
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: eventDocRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
        
        if (!result.error && userProfile) {
            const reportCollectionRef = collection(firestore, `users/${user.uid}/diagnosisReports`);
            const reportData = {
                ...result,
                userId: user.uid,
                createdAt: serverTimestamp(),
            };
            addDoc(reportCollectionRef, reportData).catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: reportCollectionRef.path,
                    operation: 'create',
                    requestResourceData: reportData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
            // Increment usage counter on success
            const userRef = doc(firestore, "users", user.uid);
            if (userProfile.usage && userProfile.usage.cycleStart) {
                // Normal increment for users with existing usage object
                const newUsage = {
                    reportsThisCycle: userProfile.usage.reportsThisCycle + 1,
                    cycleStart: userProfile.usage.cycleStart, // Keep the same timestamp object
                };
                updateDoc(userRef, { usage: newUsage });
            } else {
                // First-time usage for an existing user (create usage object)
                const newUsage = {
                    reportsThisCycle: 1,
                    cycleStart: serverTimestamp(),
                };
                updateDoc(userRef, { usage: newUsage });
            }
        }
        
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
  
  const isButtonDisabled = form.formState.isSubmitting || isSuspended || isLimitReached;

  return (
    <>
      <HeroSection />
      <Marquee />
      <section className="bg-background px-4 py-24 md:py-32 max-w-4xl mx-auto">
        {(isSuspended || isLimitReached) && (
             <Alert variant="destructive" className="mb-12 danger-bg border-destructive/30 text-red-400">
                <ShieldAlert className="h-5 w-5 !text-red-400" />
                <AlertTitle className="font-bold">
                    {isSuspended ? "Plano Inativo" : "Limite de Diagnósticos Atingido"}
                </AlertTitle>
                <AlertDescription>
                    {isSuspended 
                        ? "Seu plano atual não permite gerar novos diagnósticos. Por favor, contate o suporte."
                        : `Você atingiu seu limite de ${usageLimit} diagnósticos para este mês. Para gerar mais, considere fazer um upgrade no seu plano.`}
                </AlertDescription>
            </Alert>
        )}
        <div className="text-center mb-16 md:mb-20 opacity-0 animate-fade-up [animation-delay:500ms]">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-5"><span className="text-gradient">Complete sua Missão</span></h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">Complete os dados da missão abaixo para desbloquear seu plano de ação.</p>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-8 shadow-[0_0_20px_var(--tw-shadow-color)] shadow-primary/50"></div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-12">
            <input type="hidden" {...form.register("uid")} />
            <div className="flex justify-center">
                <div className="w-full max-w-md">
                    <UploadCard 
                        name="funnelImage"
                        title="Funil de Vendas"
                        description="Print do Portal do Parceiro<br/>(Desempenho > Cardápio)"
                        icon={<BarChart3 />}
                        form={form}
                    />
                </div>
            </div>
            
            <div className="space-y-8 opacity-0 animate-fade-up [animation-delay:700ms]">
              <FormField
                control={form.control}
                name="restaurantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">Nome do Restaurante</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Hamburgueria do João" {...field} className="bg-card text-foreground placeholder:text-muted-foreground border-input rounded-full py-7 px-7 text-base focus:border-primary" />
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
                      <Input placeholder="Ex: Hamburgueria, Sushi..." {...field} className="bg-card text-foreground placeholder:text-muted-foreground border-input rounded-full py-7 px-7 text-base focus:border-primary" />
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
                        <FormLabel htmlFor="propria" className="flex items-center justify-center gap-3 p-5 bg-card border border-border rounded-full cursor-pointer hover:border-primary has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-primary-foreground has-[[data-state=checked]]:border-primary">
                           <RadioGroupItem value="propria" id="propria" />
                           Entrega Própria
                        </FormLabel>
                        <FormLabel htmlFor="ifood" className="flex items-center justify-center gap-3 p-5 bg-card border border-border rounded-full cursor-pointer hover:border-primary has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-primary-foreground has-[[data-state=checked]]:border-primary">
                           <RadioGroupItem value="ifood" id="ifood" />
                           Entrega do iFood
                        </FormLabel>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">E-mail de Contato</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="seu@email.com" {...field} readOnly className="bg-muted/50 border-border rounded-full py-7 px-7 pl-14 text-base cursor-not-allowed" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


            <div className="space-y-6">
                <div className="bg-card border border-primary/20 p-6 md:p-8 rounded-3xl space-y-6">
                     <h3 className="font-bold text-foreground text-lg">📅 Mês Atual</h3>
                     <FormField
                        control={form.control}
                        name="currentMonthRevenue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold text-muted-foreground">Faturamento Bruto (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0,00" {...field} className="bg-background text-foreground placeholder:text-muted-foreground border-input rounded-full py-7 px-7 text-base focus:border-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="currentMonthDiscounts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold text-muted-foreground">Descontos iFood (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0,00" {...field} className="bg-background text-foreground placeholder:text-muted-foreground border-input rounded-full py-7 px-7 text-base focus:border-primary" />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                </div>
                <div className="bg-card border border-primary/20 p-6 md:p-8 rounded-3xl space-y-6">
                    <h3 className="font-bold text-foreground text-lg">📅 Mês Anterior</h3>
                    <FormField
                        control={form.control}
                        name="previousMonthRevenue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold text-muted-foreground">Faturamento Bruto (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0,00" {...field} className="bg-background text-foreground placeholder:text-muted-foreground border-input rounded-full py-7 px-7 text-base focus:border-primary" />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="previousMonthDiscounts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold text-muted-foreground">Descontos iFood (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0,00" {...field} className="bg-background text-foreground placeholder:text-muted-foreground border-input rounded-full py-7 px-7 text-base focus:border-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                </div>
            </div>

            <div className="pt-8 opacity-0 animate-fade-up [animation-delay:900ms]">
                <div className="relative p-0.5 rounded-full overflow-hidden group">
                  <div className="absolute inset-[-150%] animate-border-spin bg-[conic-gradient(from_90deg_at_50%_50%,#FE1413_0%,#2E4C8C_50%,#FE1413_100%)]"/>
                  <Button 
                    type="submit" 
                    className="relative w-full h-16 rounded-full bg-background hover:bg-card text-primary text-lg font-bold uppercase tracking-widest transition-colors duration-300 disabled:text-muted-foreground disabled:bg-slate-200/50 disabled:cursor-not-allowed"
                    disabled={isButtonDisabled}
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

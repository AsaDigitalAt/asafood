"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BarChart3, CheckCircle, Loader2, UploadCloud, ChevronDown, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import Image from 'next/image';
import type { FormState } from "@/app/actions/generate-diagnosis";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirebase, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { uploadDiagnosticImage } from "@/lib/uploadDiagnosticImage";
import { runFullDiagnostic } from "@/lib/diagnosticFlow";

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

const HeroSection = () => (
    <div className="relative bg-primary text-primary-foreground min-h-screen flex flex-col justify-center items-center text-center overflow-hidden p-4">
        <Image
            src="https://firebasestorage.googleapis.com/v0/b/base-arquivos.firebasestorage.app/o/Camada%202.png?alt=media&token=b5e254f5-2ef5-4d35-9c71-ee095ed5795a"
            alt="Decoração 1"
            width={400}
            height={400}
            className="absolute top-0 left-0 w-auto h-auto max-w-[300px] md:max-w-[400px] -translate-x-1/4 -translate-y-1/4 opacity-100"
        />
        <Image
            src="https://firebasestorage.googleapis.com/v0/b/base-arquivos.firebasestorage.app/o/Camada%201.png?alt=media&token=718c45d7-1da6-478b-8168-f3f5423416b7"
            alt="Decoração 2"
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

const Marquee = () => {
    const items = ["Aumento de Conversão", "Margem Saudável", "Visibilidade no Topo", "Cardápio Atrativo", "Avaliação 5 Estrelas", "Menos Cancelamentos"];
    return (
        <section className="w-full bg-card/50 border-y border-border backdrop-blur-lg py-6 overflow-hidden">
            <div className="flex gap-20 animate-scroll-marquee">
                {[...items, ...items].map((item, index) => (
                    <div key={index} className="flex items-center gap-4 font-bold text-muted-foreground text-base uppercase tracking-wider whitespace-nowrap">
                        <span className="text-primary text-xl">🚀</span>
                        {item}
                    </div>
                ))}
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
            reader.onloadend = () => setPreview(reader.result as string);
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
              <input type="file" id={name} accept="image/*" className="hidden" onChange={handleFileChange} />
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
                      <div className="text-5xl mb-6 text-primary transition-colors duration-300 group-hover:drop-shadow-[0_0_15px_var(--tw-shadow-color)] shadow-primary/50">{icon}</div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                      <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: description }}/>
                      <div className="mt-4 py-2 px-4 bg-muted text-muted-foreground rounded-full text-sm font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <UploadCloud className="inline-block mr-2 h-4 w-4" /> Fazer Upload
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
  const { firestore, storage } = useFirebase();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userDocRef);

  const isSuspended = userProfile?.planStatus !== 'active' && !!userProfile;
  const usageCount = userProfile?.usage?.reportsThisCycle ?? 0;
  const plan = userProfile?.plan || 'plano_acelerador';
  const usageLimit = planLimits[plan] ?? 4;
  const isDeveloper = plan === 'desenvolvedor';
  const isLimitReached = !isDeveloper && usageCount >= usageLimit;

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
  }, [user, form]);
  
  const onFormSubmit = async (values: z.infer<typeof diagnosisSchema>) => {
    if (!user || !firestore || !storage) return;

    // A restrição agora ocorre apenas no momento de disparar a geração
    if (isSuspended || isLimitReached) {
        toast({ 
          variant: "destructive", 
          title: "Ação Bloqueada", 
          description: isSuspended ? "Seu plano está inativo." : `Você atingiu seu limite mensal de ${usageLimit} diagnósticos.` 
        });
        return;
    }

    onFormSubmitStart();

    try {
        const uploadRes = await uploadDiagnosticImage(storage, values.funnelImage);

        const { final } = await runFullDiagnostic({
            restaurantName: values.restaurantName,
            foodCategory: values.foodCategory,
            deliveryType: values.deliveryType,
            currentMonthRevenue: values.currentMonthRevenue,
            currentMonthDiscounts: values.currentMonthDiscounts,
            previousMonthRevenue: values.previousMonthRevenue,
            previousMonthDiscounts: values.previousMonthDiscounts,
            email: values.email,
            uid: values.uid,
            storagePath: uploadRes.storagePath,
            imageContentType: uploadRes.imageContentType,
            imageOriginalName: uploadRes.imageOriginalName
        });

        const result: FormState = {
            nome: final.nome || values.restaurantName,
            statusGeral: final.statusGeral || "Análise Concluída",
            conversions: final.conversions || final.output?.conversoes || {},
            discounts: final.discounts || final.output?.analise_descontos || {},
            problems: final.problems || final.output?.principais_problemas || [],
            actions: final.actions || final.output?.acoes_imediatas || [],
            priorities: final.priorities || final.output?.prioridades_hoje || [],
            aiGeneratedPlan: final.aiGeneratedPlan || final.output?.plano_de_acao_ia || null
        };

        onFormSubmitEnd(result);

    } catch (e: any) {
        console.error("Erro no fluxo de diagnóstico:", e);
        const errorMessage = e.message || 'Erro inesperado ao processar o diagnóstico.';
        toast({ variant: "destructive", title: "Erro na Operação", description: errorMessage });
        
        onFormSubmitEnd({ 
            error: errorMessage, 
            nome: '', 
            statusGeral: '', 
            conversions: {}, 
            discounts: {}, 
            problems: [], 
            actions: [], 
            priorities: [], 
            aiGeneratedPlan: null 
        });
    }
  };
  
  return (
    <>
      <HeroSection />
      <Marquee />
      <section className="bg-background px-4 py-24 md:py-32 max-w-4xl mx-auto">
        {/* Aviso informativo - não bloqueia a página */}
        {(isSuspended || isLimitReached) && !isProfileLoading && (
             <Alert variant="destructive" className="mb-12 danger-bg border-destructive/30 text-red-400">
                <ShieldAlert className="h-5 w-5 !text-red-400" />
                <AlertTitle className="font-bold">{isSuspended ? "Plano Inativo" : "Limite Atingido"}</AlertTitle>
                <AlertDescription>
                    {isSuspended ? "Seu plano está inativo. Contate o suporte para regularizar." : `Você atingiu seu limite mensal de ${usageLimit} diagnósticos.`}
                </AlertDescription>
            </Alert>
        )}
        <div className="text-center mb-16 md:mb-20 opacity-0 animate-fade-up">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-5"><span className="text-gradient">Complete sua Missão</span></h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">Complete os dados para desbloquear seu plano de ação.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-12">
            <input type="hidden" {...form.register("uid")} />
            <div className="flex justify-center">
                <div className="w-full max-w-md">
                    <UploadCard name="funnelImage" title="Funil de Vendas" description="Print do Portal do Parceiro" icon={<BarChart3 />} form={form} />
                </div>
            </div>
            
            <div className="space-y-8 opacity-0 animate-fade-up">
              <FormField
                control={form.control}
                name="restaurantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs font-bold">Nome do Restaurante</FormLabel>
                    <FormControl><Input {...field} className="rounded-full py-7 px-7" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foodCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs font-bold">Nicho de comida</FormLabel>
                    <FormControl><Input {...field} className="rounded-full py-7 px-7" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="deliveryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs font-bold">Tipo de Entrega</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                        <FormLabel htmlFor="propria" className="flex items-center justify-center p-5 border rounded-full cursor-pointer has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-white"><RadioGroupItem value="propria" id="propria" className="hidden" /> Entrega Própria</FormLabel>
                        <FormLabel htmlFor="ifood" className="flex items-center justify-center p-5 border rounded-full cursor-pointer has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-white"><RadioGroupItem value="ifood" id="ifood" className="hidden" /> Entrega do iFood</FormLabel>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs font-bold">E-mail de Contato</FormLabel>
                    <FormControl><Input {...field} readOnly className="bg-muted cursor-not-allowed rounded-full py-7 px-7" /></FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card border p-6 rounded-3xl space-y-4">
                    <h3 className="font-bold">Mês Atual</h3>
                    <FormField control={form.control} name="currentMonthRevenue" render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="Faturamento" {...field} className="rounded-full" /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="currentMonthDiscounts" render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="Descontos" {...field} className="rounded-full" /></FormControl></FormItem>)} />
                  </div>
                  <div className="bg-card border p-6 rounded-3xl space-y-4">
                    <h3 className="font-bold">Mês Anterior</h3>
                    <FormField control={form.control} name="previousMonthRevenue" render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="Faturamento" {...field} className="rounded-full" /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="previousMonthDiscounts" render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="Descontos" {...field} className="rounded-full" /></FormControl></FormItem>)} />
                  </div>
              </div>

              <div className="pt-8">
                <Button 
                  type="submit" 
                  className="w-full h-16 rounded-full text-lg font-bold uppercase tracking-widest"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Gerar Diagnóstico"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </section>
    </>
  );
}
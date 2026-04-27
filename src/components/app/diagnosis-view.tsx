"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, CheckCircle, Loader2, UploadCloud, ChevronDown, ShieldAlert, ArrowLeft, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Image from 'next/image';
import type { FormState } from "@/app/actions/generate-diagnosis";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirebase, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAccessControl } from "@/hooks/use-access-control";
import { mapPlanV3ToFormState } from "@/lib/diagnosticPlanMapper";

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

const HeroSection = ({ onBack }: { onBack: () => void }) => (
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
        <button
            onClick={onBack}
            className="fixed top-24 md:top-[120px] left-6 md:left-[128px] z-50 flex justify-center items-center w-12 h-12 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors border border-white/20 shadow-xl"
        >
            <ArrowLeft className="w-5 h-5" />
        </button>
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

const ZoomableImage = ({ src, alt }: { src: string, alt: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <img 
                src={src} 
                alt={alt} 
                className="w-full h-auto object-contain cursor-zoom-in transition-transform hover:scale-[1.02]"
                onClick={() => setIsOpen(true)}
                onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/800x300/f8fafc/0f172a?text=Exemplo+do+Print+do+Funil";
                }}
            />
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 md:p-8 cursor-zoom-out animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                >
                    <img src={src} alt={alt} className="w-full h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" />
                </div>
            )}
        </>
    );
};

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
  onBack: () => void;
  onFormSubmitStart: () => void;
  onFormSubmitEnd: (data: FormState) => void;
}

export function DiagnosisView({ onBack, onFormSubmitStart, onFormSubmitEnd }: DiagnosisViewProps) {
  const { toast } = useToast();
  const { firestore, storage } = useFirebase();
  const { user } = useUser();
  const { isDeveloper, isSuspended, diagnostics, isLoading } = useAccessControl();

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
    if (!diagnostics.canGenerate && !isDeveloper) {
        toast({ 
          variant: "destructive", 
          title: "Ação Bloqueada", 
          description: isSuspended ? "Seu plano está inativo." : "Você atingiu seu limite mensal de diagnósticos ou seu plano não dá direito." 
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
            storagePath: uploadRes.storagePath,
            imageContentType: uploadRes.imageContentType,
            imageOriginalName: uploadRes.imageOriginalName
        });

        // Delega o mapeamento v3 → FormState ao utilitário compartilhado
        const result = mapPlanV3ToFormState(final, values.restaurantName);

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
      <HeroSection onBack={onBack} />
      <Marquee />
      <section className="bg-background px-4 py-24 md:py-32 max-w-4xl mx-auto">
        {/* Restrição apenas informada no Card (não restringe acesso da página) */}
        {!isLoading && !diagnostics.canGenerate && !isDeveloper && (
            <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/20 text-red-500">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Seu Limite foi atingido</AlertTitle>
                <AlertDescription>
                    Você já utilizou toda sua cota de diagnósticos do ciclo atual ou seu plano expirou. Faça o upgrade para continuar gerando análises.
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
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-full max-w-md">
                    <UploadCard name="funnelImage" title="Funil de Vendas" description="Print do Portal do Parceiro" icon={<BarChart3 />} form={form} />
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-full text-sm font-bold w-full max-w-md flex items-center justify-center gap-2 border-primary/50 hover:bg-primary/10">
                      <HelpCircle className="w-4 h-4" />
                      Como pegar essa imagem do funil de vendas?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Como capturar o Funil de Vendas</DialogTitle>
                      <DialogDescription>
                        Siga as instruções abaixo para pegar a imagem corretamente.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm text-muted-foreground mt-2 max-h-[60vh] overflow-y-auto pr-2">
                      <p>
                        Oi! Para fazermos a análise do seu restaurante, preciso que você envie um print da tela <strong className="text-foreground">Conversão do cardápio</strong> no Portal do iFood.
                      </p>
                      <p>
                        O print precisa ser exatamente daquela tela do funil, mostrando:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 font-semibold text-foreground">
                        <li>Visitas</li>
                        <li>Visualizações</li>
                        <li>Sacola</li>
                        <li>Revisão</li>
                        <li>Concluídos</li>
                      </ul>
                      <p>
                        Também precisa aparecer a aba <strong className="text-foreground">Sua loja</strong> selecionada e as porcentagens na parte inferior de cada etapa.
                      </p>
                      <p className="italic">
                        Não precisa aparecer o nome da loja.
                      </p>
                      
                      <div className="bg-muted p-4 rounded-xl mt-4">
                        <h4 className="font-bold text-foreground mb-2">Passo a passo:</h4>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>Acesse o <a href="https://partners-auth.ifood.com.br/realms/partners/protocol/openid-connect/auth?client_id=partner-portal&redirect_uri=https%3A%2F%2Fportal.ifood.com.br%2Fpartners%2Fsso%2Fcallback&response_type=code&scope=openid+profile+email+merchants+profile_permissions&state=13f543b3d7c2420e826b27be1cab85bc&code_challenge=w_-HjQ0pgzWN2iMGe30wzbft5wbC4WmnOa4rwx2VKnY&code_challenge_method=S256" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Portal do Parceiro iFood</a> pelo computador.</li>
                          <li>Entre na conta da sua loja.</li>
                          <li>Vá até a área de <strong className="text-foreground">Desempenho</strong>.</li>
                          <li>Procure a tela <strong className="text-foreground">Conversão do cardápio</strong>.</li>
                          <li>Selecione a aba <strong className="text-foreground">Sua loja</strong>.</li>
                          <li>Escolha o período desejado, de preferência <strong className="text-foreground">últimos 30 dias</strong>.</li>
                          <li>Tire um print mostrando todo o funil, igual ao exemplo: de <strong className="text-foreground">Visitas</strong> até <strong className="text-foreground">Concluídos</strong>.</li>
                          <li>Me envie a imagem por aqui.</li>
                        </ol>
                      </div>

                      <p className="text-xs text-amber-500 font-bold mt-4">
                        Importante: confira se os números e porcentagens estão legíveis antes de enviar.
                      </p>
                      
                      <div className="mt-6">
                        <h4 className="font-bold text-foreground mb-2">Print de Exemplo:</h4>
                        <div className="border rounded-xl overflow-hidden shadow-sm bg-muted/50 p-1">
                          <ZoomableImage 
                            src="https://firebasestorage.googleapis.com/v0/b/studio-8790382792-31236.firebasestorage.app/o/diagnostics%2Fuploads%2FL7jV9uB1qaW0M7TpRLpe7Z5muiB2%2Fexemplo-funil-ifood.png.jpg?alt=media&token=6db9200b-3f35-495b-befb-32c876e78445" 
                            alt="Exemplo de como deve ser o print do funil" 
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">Clique na imagem para ampliar</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                    <FormField control={form.control} name="currentMonthRevenue" render={({ field }) => (<FormItem><FormLabel className="ml-1 uppercase text-xs font-bold tracking-wider text-muted-foreground">Faturamento Bruto (R$)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} className="rounded-full" /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="currentMonthDiscounts" render={({ field }) => (<FormItem><FormLabel className="ml-1 uppercase text-xs font-bold tracking-wider text-muted-foreground">Descontos (R$)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} className="rounded-full" /></FormControl></FormItem>)} />
                  </div>
                  <div className="bg-card border p-6 rounded-3xl space-y-4">
                    <h3 className="font-bold">Mês Anterior</h3>
                    <FormField control={form.control} name="previousMonthRevenue" render={({ field }) => (<FormItem><FormLabel className="ml-1 uppercase text-xs font-bold tracking-wider text-muted-foreground">Faturamento Bruto (R$)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} className="rounded-full" /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="previousMonthDiscounts" render={({ field }) => (<FormItem><FormLabel className="ml-1 uppercase text-xs font-bold tracking-wider text-muted-foreground">Descontos (R$)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} className="rounded-full" /></FormControl></FormItem>)} />
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
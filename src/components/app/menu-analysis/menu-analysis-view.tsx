"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, CheckCircle, BookOpen, Star } from "lucide-react";
import { useState } from "react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";

const menuAnalysisSchema = z.object({
  menuFile: z.any().refine((file) => file instanceof File, "O arquivo do cardápio é obrigatório."),
  bestSellerImage: z.any().refine((file) => file instanceof File, "A imagem do produto campeão é obrigatória."),
});

const UploadCard = ({ name, title, description, icon, form, accept }: { name: "menuFile" | "bestSellerImage", title: string, description: string, icon: React.ReactNode, form: any, accept: string }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const file = form.watch(name);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue(name, file, { shouldValidate: true });
            setFileName(file.name);
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setPreview(null);
            }
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
                  accept={accept}
                  className="hidden"
                  onChange={handleFileChange}
              />
              {file ? (
                  <>
                    {preview && <Image src={preview} alt="Preview" layout="fill" className="object-cover opacity-10 group-hover:opacity-20 transition-opacity" />}
                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                        <span className="font-bold text-foreground">{fileName || 'Arquivo Carregado'}</span>
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

interface MenuAnalysisViewProps {
    onBack: () => void;
}

export default function MenuAnalysisView({ onBack }: MenuAnalysisViewProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof menuAnalysisSchema>>({
    resolver: zodResolver(menuAnalysisSchema),
  });

  const onFormSubmit = async (values: z.infer<typeof menuAnalysisSchema>) => {
    setIsSubmitting(true);
    console.log(values);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({
      title: "Análise em Andamento!",
      description: "Seu cardápio e produto estão sendo analisados. Você receberá o resultado em breve.",
    });
    setIsSubmitting(false);
  };

  return (
    <section className="bg-background px-4 py-24 md:py-32 max-w-4xl mx-auto">
      <div className="text-center mb-16 md:mb-20 opacity-0 animate-fade-up">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            <span className="text-gradient">Análise de</span> 
            <span className="text-primary"> Cardápio</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Descubra o potencial escondido no seu cardápio e no seu produto campeão.
        </p>
        <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-8 shadow-[0_0_20px_var(--tw-shadow-color)] shadow-primary/50"></div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-12">
          <div className="space-y-12 max-w-md mx-auto">
              <UploadCard 
                  name="menuFile"
                  title="Cardápio Completo"
                  description="Envie uma imagem ou PDF do seu cardápio atual"
                  icon={<BookOpen />}
                  form={form}
                  accept="image/*,.pdf"
              />
              <UploadCard 
                  name="bestSellerImage"
                  title="Produto Campeão"
                  description="Envie uma foto do seu item mais vendido"
                  icon={<Star />}
                  form={form}
                  accept="image/*"
              />
          </div>

          <div className="pt-8 opacity-0 animate-fade-up [animation-delay:900ms] max-w-md mx-auto">
              <div className="relative p-0.5 rounded-full overflow-hidden group">
                <div className="absolute inset-[-150%] animate-border-spin bg-[conic-gradient(from_90deg_at_50%_50%,#FE1413_0%,#2E4C8C_50%,#FE1413_100%)]"/>
                <Button 
                  type="submit" 
                  className="relative w-full h-16 rounded-full bg-background hover:bg-card text-primary text-lg font-bold uppercase tracking-widest transition-colors duration-300 disabled:text-muted-foreground disabled:bg-slate-200/50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "Gerar Análise do Cardápio"
                  )}
                </Button>
              </div>
          </div>
        </form>
      </Form>
    </section>
  );
}

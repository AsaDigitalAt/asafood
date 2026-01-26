"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  password: z.string().min(1, "A senha é obrigatória."),
});

type LoginViewProps = {
  onLogin: () => void;
};

export function LoginView({ onLogin }: LoginViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate API call for login
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (values.email === "demo@asafood.com" && values.password === "password") {
      onLogin();
    } else {
      setError("E-mail e/ou senha incorreta.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 opacity-0 animate-fade-up animation-delay-[300ms]">
      <div className="w-full max-w-md text-center">
        <div className="glass-card p-10 md:p-14 rounded-3xl shadow-2xl">
          <h1 className="text-4xl font-extrabold mb-2">
            <span className="text-primary">Asa</span> Food
          </h1>
          <p className="text-muted-foreground mb-8">
            Acesse sua conta para gerenciar a performance do seu delivery.
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-left">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">E-mail</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="seu@email.com" 
                        className="bg-black/20 border-white/10 rounded-full py-6 px-7 text-base focus:bg-primary/5 focus:border-primary"
                        {...field} />
                    </FormControl>
                    <FormMessage className="ml-4" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="bg-black/20 border-white/10 rounded-full py-6 px-7 text-base focus:bg-primary/5 focus:border-primary"
                        {...field} />
                    </FormControl>
                    <FormMessage className="ml-4" />
                  </FormItem>
                )}
              />
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
               <div className="pt-4">
                <div className="relative p-0.5 rounded-full overflow-hidden group">
                  <div className="absolute inset-[-150%] animate-border-spin bg-[conic-gradient(from_90deg_at_50%_50%,#38BDF8_0%,#0F172A_50%,#38BDF8_100%)]"/>
                  <Button 
                    type="submit" 
                    className="relative w-full h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-lg font-bold uppercase tracking-widest transition-colors duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      "Acessar Plataforma"
                    )}
                  </Button>
                </div>
               </div>
            </form>
          </Form>
        </div>
        <p className="text-sm text-muted-foreground mt-6">Use <code className="bg-muted px-1.5 py-0.5 rounded-md">demo@asafood.com</code> e <code className="bg-muted px-1.5 py-0.5 rounded-md">password</code></p>
      </div>
    </div>
  );
}

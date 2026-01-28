"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/firebase";
import { 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  User
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { upsertUserProfileOnLogin } from "@/firebase/user";

const loginSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

export function LoginView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const auth = useAuth();
  const { toast } = useToast();

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
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      // This now handles profile creation on first login
      await upsertUserProfileOnLogin(auth.app, userCredential.user);
    } catch (e: any) {
      console.error("Auth error:", e);
      switch (e.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError("E-mail ou senha incorretos.");
          break;
        default:
          setError("Ocorreu um erro. Tente novamente.");
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = form.getValues("email");
    if (!email) {
      setError("Por favor, insira seu e-mail para redefinir a senha.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "E-mail enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error) {
      setError("Falha ao enviar e-mail de redefinição. Verifique o e-mail inserido.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-primary text-primary-foreground opacity-0 animate-fade-up animation-delay-[300ms]">
      <div className="w-full max-w-md text-center">
          <Image
            src="https://tmpfiles.org/dl/21575704/logoasaoff.png"
            alt="Asa Food Logo"
            width={180}
            height={50}
            className="mx-auto mb-4"
            priority
          />
          <p className="text-primary-foreground/80 mb-8">
            Acesse sua conta para gerenciar.
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
                        className="bg-white/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 rounded-full py-6 px-7 text-base focus:bg-white/20 focus:ring-1 focus:ring-primary-foreground focus:border-transparent"
                        {...field} />
                    </FormControl>
                    <FormMessage className="ml-4 text-primary-foreground/80" />
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
                        className="bg-white/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 rounded-full py-6 px-7 text-base focus:bg-white/20 focus:ring-1 focus:ring-primary-foreground focus:border-transparent"
                        {...field} />
                    </FormControl>
                    <FormMessage className="ml-4 text-primary-foreground/80" />
                  </FormItem>
                )}
              />
              {error && (
                <Alert variant="destructive" className="bg-transparent border-primary-foreground/50 text-primary-foreground">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
               <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-16 rounded-full bg-primary-foreground hover:bg-primary-foreground/90 text-primary text-lg font-bold uppercase tracking-widest transition-colors duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Acessar Plataforma"}
                  </Button>
               </div>
            </form>
          </Form>

          <div className="mt-6 text-sm">
            <button onClick={handlePasswordReset} className="text-primary-foreground/80 hover:text-primary-foreground hover:underline">
              Esqueceu a senha?
            </button>
          </div>
      </div>
    </div>
  );
}

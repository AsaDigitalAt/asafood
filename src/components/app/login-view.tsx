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
import { useAuth, useFirestore } from "@/firebase";
import { 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { checkUserExists } from "@/app/actions/auth-actions";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { upsertUserProfileOnLogin } from "@/firebase/user";

const loginSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

const primeiroAcessoSchema = z.object({
  email: z.string().trim().toLowerCase().email("Por favor, insira um e-mail válido."),
});

export function LoginView() {
  const [view, setView] = useState<'login' | 'primeiro_acesso'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const primeiroAcessoForm = useForm<z.infer<typeof primeiroAcessoSchema>>({
    resolver: zodResolver(primeiroAcessoSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const onSubmitLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
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

  const onSubmitPrimeiroAcesso = async (values: z.infer<typeof primeiroAcessoSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Verifica se o e-mail existe no Firebase (via Server Action que roda com permissões de Admin)
      const userExists = await checkUserExists(values.email);

      if (!userExists) {
        setError("Não encontramos nenhuma conta vinculada a este e-mail. Verifique o e-mail cadastrado na compra.");
        setIsLoading(false);
        return;
      }
      
      // 2. Se existe, envia o e-mail de redefinição de senha
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/action`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, values.email, actionCodeSettings);
      
      toast({
        title: "Link enviado!",
        description: "Enviamos um link de redefinição de senha para o seu e-mail.",
        duration: 5000,
      });

      // Retorna para a tela de login
      setView('login');
      primeiroAcessoForm.reset();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao verificar sua conta. Tente novamente mais tarde.");
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
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/action`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
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
            src="https://firebasestorage.googleapis.com/v0/b/base-arquivos.firebasestorage.app/o/Logo%20ASA%20OFF.png?alt=media&token=62ef02f9-1b75-4a7a-b496-b56184407e2f"
            alt="Asa Food Logo"
            width={180}
            height={50}
            className="mx-auto mb-4"
            priority
          />
          
          <p className="text-primary-foreground/80 mb-8">
            {view === 'login' ? "Acesse sua conta para gerenciar." : "Cadastre-se para solicitar acesso."}
          </p>

          {view === 'login' ? (
            <Form key="login-form" {...form}>
              <form onSubmit={form.handleSubmit(onSubmitLogin)} className="space-y-6 text-left">
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
                 <div className="pt-4 flex flex-col gap-3">
                    <Button 
                      type="submit" 
                      className="w-full h-16 rounded-full bg-primary-foreground hover:bg-primary-foreground/90 text-primary text-lg font-bold uppercase tracking-widest transition-colors duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Acessar Plataforma"}
                    </Button>

                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setView('primeiro_acesso');
                        setError(null);
                      }}
                      className="w-full h-16 rounded-full bg-transparent border-2 border-primary-foreground/50 text-primary-foreground hover:bg-white/10 text-lg font-bold uppercase tracking-widest transition-colors duration-300"
                      disabled={isLoading}
                    >
                      Primeiro Acesso
                    </Button>
                 </div>
              </form>
            </Form>
          ) : (
            <Form key="primeiro-acesso-form" {...primeiroAcessoForm}>
              <form onSubmit={primeiroAcessoForm.handleSubmit(onSubmitPrimeiroAcesso)} className="space-y-6 text-left animate-fade-up">
                <FormField
                  control={primeiroAcessoForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">E-mail Cadastrado na Compra</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          autoComplete="email"
                          placeholder="seu@email.com" 
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
                 <div className="pt-4 flex flex-col gap-3">
                    <Button 
                      type="submit" 
                      className="w-full h-16 rounded-full bg-primary-foreground hover:bg-primary-foreground/90 text-primary text-lg font-bold uppercase tracking-widest transition-colors duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Solicitar Acesso"}
                    </Button>

                    <Button 
                      type="button" 
                      variant="ghost"
                      onClick={() => {
                        setView('login');
                        setError(null);
                      }}
                      className="w-full h-12 rounded-full text-primary-foreground hover:bg-white/10 hover:text-primary-foreground font-bold uppercase tracking-widest transition-colors duration-300"
                      disabled={isLoading}
                    >
                      Voltar para o Login
                    </Button>
                 </div>
              </form>
            </Form>
          )}

          {view === 'login' && (
            <div className="mt-6 text-sm">
              <button onClick={handlePasswordReset} className="text-primary-foreground/80 hover:text-primary-foreground hover:underline">
                Esqueceu a senha?
              </button>
            </div>
          )}
      </div>
    </div>
  );
}

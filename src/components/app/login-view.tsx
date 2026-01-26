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
import { useAuth } from "@/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/firebase/user";

const loginSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

export function LoginView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoginView, setIsLoginView] = useState(true);
  
  const auth = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const handleAuthSuccess = async (uid: string, email: string | null) => {
    if (!email) return;
    try {
      await updateUserProfile(auth.app, uid, { email });
      // The onAuthStateChanged listener in the provider will handle the redirect.
    } catch (e) {
      console.error("Failed to update user profile", e);
      setError("Falha ao salvar dados do usuário.");
    }
  }

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isLoginView) {
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        await handleAuthSuccess(userCredential.user.uid, userCredential.user.email);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        await handleAuthSuccess(userCredential.user.uid, userCredential.user.email);
        toast({ title: "Conta criada!", description: "Você já pode fazer o login." });
        setIsLoginView(true); // Switch to login view after successful sign up
      }
    } catch (e: any) {
      switch (e.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError("E-mail ou senha incorretos.");
          break;
        case 'auth/email-already-in-use':
          setError("Este e-mail já está em uso.");
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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 opacity-0 animate-fade-up animation-delay-[300ms]">
      <div className="w-full max-w-md text-center">
        <div className="glass-card p-10 md:p-14 rounded-3xl shadow-2xl">
          <h1 className="text-4xl font-extrabold mb-2">
            <span className="text-primary">Asa</span> Food
          </h1>
          <p className="text-muted-foreground mb-8">
            {isLoginView ? "Acesse sua conta para gerenciar." : "Crie uma conta para começar."}
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
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isLoginView ? "Acessar Plataforma" : "Criar Conta")}
                  </Button>
                </div>
               </div>
            </form>
          </Form>

          <div className="mt-6 text-sm">
            <button onClick={() => setIsLoginView(!isLoginView)} className="text-primary hover:underline">
              {isLoginView ? "Não tem uma conta? Crie agora!" : "Já tem uma conta? Faça login."}
            </button>
            <span className="mx-2 text-muted-foreground">|</span>
            <button onClick={handlePasswordReset} className="text-muted-foreground hover:underline">
              Esqueceu a senha?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

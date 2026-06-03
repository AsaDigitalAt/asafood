"use client";

import { useState, Suspense } from "react";
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
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
    .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula.")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caractere especial."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof passwordSchema>) => {
    if (!oobCode || mode !== "resetPassword") {
      setError("Link de redefinição de senha inválido ou expirado.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Opcional: verificar o código primeiro
      await verifyPasswordResetCode(auth, oobCode);
      // Confirmar e alterar a senha
      await confirmPasswordReset(auth, oobCode, values.password);
      
      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi redefinida com sucesso. Você já pode fazer login.",
        duration: 5000,
      });

      router.push("/"); // redireciona para a tela principal (login)
    } catch (e: any) {
      console.error("Auth error:", e);
      switch (e.code) {
        case 'auth/expired-action-code':
        case 'auth/invalid-action-code':
          setError("O link de redefinição expirou ou é inválido. Solicite um novo link.");
          break;
        case 'auth/user-disabled':
          setError("Esta conta foi desativada.");
          break;
        case 'auth/user-not-found':
          setError("Usuário não encontrado.");
          break;
        case 'auth/weak-password':
          setError("A senha é muito fraca.");
          break;
        default:
          setError("Ocorreu um erro ao redefinir a senha. Tente novamente.");
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!oobCode || mode !== "resetPassword") {
    return (
      <div className="w-full max-w-md text-center">
        <Alert variant="destructive" className="bg-transparent border-primary-foreground/50 text-primary-foreground mb-6">
          <AlertDescription>
            Este link é inválido, expirou ou não é um link de redefinição de senha. Por favor, solicite a redefinição de senha novamente.
          </AlertDescription>
        </Alert>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.push("/")}
          className="w-full h-16 rounded-full bg-transparent border-2 border-primary-foreground/50 text-primary-foreground hover:bg-white/10 text-lg font-bold uppercase tracking-widest transition-colors duration-300"
        >
          Voltar para o Login
        </Button>
      </div>
    );
  }

  return (
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
        Crie uma nova senha forte para sua conta.
      </p>

      <Form key="reset-password-form" {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-left">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">Nova Senha</FormLabel>
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
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="ml-4 uppercase text-xs tracking-widest font-bold">Confirme a Senha</FormLabel>
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
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Salvar Nova Senha"}
              </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}

export function ResetPasswordView() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-primary text-primary-foreground opacity-0 animate-fade-up animation-delay-[300ms]">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

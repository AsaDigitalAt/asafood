import { ResetPasswordView } from "@/components/app/reset-password-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redefinir Senha | Asa Food",
  description: "Crie uma nova senha para sua conta.",
};

export default function AuthActionPage() {
  // A view vai ler os query params (mode, oobCode) via useSearchParams
  return <ResetPasswordView />;
}

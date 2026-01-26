"use client";

import { useState } from "react";
import type { FormState } from "@/app/actions/generate-diagnosis";
import { ThreeBackground } from "@/components/app/three-background";
import { AppHeader } from "@/components/app/app-header";
import { LoginView } from "@/components/app/login-view";
import { DiagnosisView } from "@/components/app/diagnosis-view";
import EmptyStateView from "@/components/app/empty-state-view";
import { Rocket, Store } from "lucide-react";
import LoadingScreen from "@/components/app/loading-screen";
import { DashboardView } from "@/components/app/dashboard/dashboard-view";

type View = "login" | "diagnosis" | "action-plan" | "restaurant";

export default function Home() {
  const [view, setView] = useState<View>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<FormState | null>(null);

  const handleLogin = () => {
    setView("diagnosis");
  };

  const handleNavigate = (newView: View) => {
    setView(newView);
    if(newView === 'diagnosis') {
      setDashboardData(null); // Reset form when navigating back
    }
  };

  const handleFormSubmitStart = () => {
    setIsLoading(true);
  };
  
  const handleFormSubmitEnd = (data: FormState) => {
    setDashboardData(data);
    setIsLoading(false);
  };

  return (
    <>
      <ThreeBackground />
      <LoadingScreen isVisible={isLoading} />
      
      <div className="relative z-10 min-h-screen">
        <AppHeader 
          currentView={view}
          onNavigate={handleNavigate} 
        />
        
        <main>
          {view === "login" && <LoginView onLogin={handleLogin} />}
          
          {view === "diagnosis" && !dashboardData && (
            <DiagnosisView onFormSubmitStart={handleFormSubmitStart} onFormSubmitEnd={handleFormSubmitEnd} />
          )}

          {view === "diagnosis" && dashboardData && (
            <DashboardView data={dashboardData} />
          )}

          {view === "action-plan" && (
            <EmptyStateView
              icon={<Rocket className="w-16 h-16" />}
              title="Meu Plano de Ação"
              description="Seus planos gerados ficarão salvos nesta área exclusiva."
              onBack={() => setView("diagnosis")}
            />
          )}

          {view === "restaurant" && (
            <EmptyStateView
              icon={<Store className="w-16 h-16" />}
              title="Meu Restaurante"
              description="Em breve você poderá gerenciar os dados do seu estabelecimento aqui."
              onBack={() => setView("diagnosis")}
            />
          )}
        </main>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import type { FormState } from "@/app/actions/generate-diagnosis";
import { AppHeader } from "@/components/app/app-header";
import { LoginView } from "@/components/app/login-view";
import { DiagnosisView } from "@/components/app/diagnosis-view";
import EmptyStateView from "@/components/app/empty-state-view";
import { Rocket, Store, Shield, Calculator } from "lucide-react";
import LoadingScreen from "@/components/app/loading-screen";
import { DashboardView } from "@/components/app/dashboard/dashboard-view";
import { useUser } from "@/firebase";
import AdminDashboard from "@/components/app/admin/admin-dashboard";
import ActionPlanView from "@/components/app/action-plan/action-plan-view";
import MenuAnalysisView from "@/components/app/menu-analysis/menu-analysis-view";

type View = "login" | "diagnosis" | "action-plan" | "restaurant" | "admin" | "menu-analysis" | "price-calculator";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const [currentView, setCurrentView] = useState<View>("diagnosis");
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<FormState | null>(null);

  const handleNavigate = (newView: View) => {
    setCurrentView(newView);
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
    if (!data.error) {
      setCurrentView('diagnosis'); // Ensure view is diagnosis to show dashboard
    }
  };

  const renderContent = () => {
    if (isUserLoading || (user && currentView === 'login')) {
      return <LoadingScreen isVisible={true} />;
    }

    if (!user) {
      return <LoginView />;
    }

    switch (currentView) {
      case "diagnosis":
        return dashboardData ? <DashboardView data={dashboardData} /> : <DiagnosisView onFormSubmitStart={handleFormSubmitStart} onFormSubmitEnd={handleFormSubmitEnd} />;
      case "action-plan":
        return <ActionPlanView onBack={() => setCurrentView("diagnosis")} />;
      case "menu-analysis":
        return <MenuAnalysisView onBack={() => setCurrentView("diagnosis")} />;
      case "price-calculator":
        return <EmptyStateView icon={<Calculator className="w-16 h-16" />} title="Calculadora de Preços" description="Em breve você poderá calcular a precificação ideal dos seus pratos aqui." onBack={() => setCurrentView("diagnosis")} />;
      case "restaurant":
        return <EmptyStateView icon={<Store className="w-16 h-16" />} title="Meu Restaurante" description="Em breve você poderá gerenciar os dados do seu estabelecimento aqui." onBack={() => setCurrentView("diagnosis")} />;
      case "admin":
        return <AdminDashboard onBack={() => setCurrentView("diagnosis")} />;
      default:
        return <LoginView />;
    }
  };
  
  const handleLogout = () => {
    // This will be implemented later with Firebase Auth
    window.location.reload();
  }

  return (
    <>
      <LoadingScreen isVisible={isLoading && !isUserLoading} />
      
      <div className="relative z-10 min-h-screen">
        <AppHeader 
          currentView={currentView}
          onNavigate={handleNavigate}
          isLoggedIn={!!user}
          onLogout={handleLogout}
        />
        
        <main>
          {renderContent()}
        </main>
      </div>
    </>
  );
}

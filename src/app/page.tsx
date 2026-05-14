
"use client";

import { useState } from "react";
import type { FormState } from "@/app/actions/generate-diagnosis";
import { AppHeader } from "@/components/app/app-header";
import { LoginView } from "@/components/app/login-view";
import { DiagnosisView } from "@/components/app/diagnosis-view";
import LoadingScreen from "@/components/app/loading-screen";
import { DashboardView } from "@/components/app/dashboard/dashboard-view";
import { useUser } from "@/firebase";
import AdminDashboard from "@/components/app/admin/admin-dashboard";
import ActionPlanView from "@/components/app/action-plan/action-plan-view";
import MenuAnalysisView from "@/components/app/menu-analysis/menu-analysis-view";
import PriceCalculatorView from "@/components/app/price-calculator/PriceCalculatorView";
import { HubView } from "@/components/app/hub-view";
import { RestaurantView } from "@/components/app/restaurant/restaurant-view";
import { FreeAnalysisView } from "@/components/app/free-analysis/free-analysis-view";
import MyAnalysesView from "@/components/app/analyses/my-analyses-view";
import { RenewalAlert } from "@/components/app/renewal-alert";
import { SurveyPopup } from "@/components/app/survey-popup";

import DeveloperDashboard from "@/components/app/admin/developer-dashboard";
import LeadsDashboard from "@/components/app/admin/leads-dashboard";
import MarketIntelligenceDashboard from "@/components/app/admin/market-intelligence-dashboard";

type View = "hub" | "login" | "diagnosis" | "action-plan" | "restaurant" | "admin" | "dev-dashboard" | "leads-dashboard" | "market-intelligence" | "menu-analysis" | "price-calculator" | "free-analysis" | "my-analyses";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const [currentView, setCurrentView] = useState<View>("hub");
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<FormState | null>(null);

  const handleNavigate = (newView: View) => {
    setCurrentView(newView);
    if(newView === 'diagnosis') {
      setDashboardData(null); // Reset form when navigating back to diagnosis from menu
    }
  };

  const handleFormSubmitStart = () => {
    setIsLoading(true);
  };
  
  const handleFormSubmitEnd = (data: FormState) => {
    setDashboardData(data);
    setIsLoading(false);
    if (!data.error) {
      setCurrentView('diagnosis'); // Stay in diagnosis to show the generated dashboard
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
      case "hub":
        return <HubView onNavigate={handleNavigate} />;
      case "diagnosis":
        return dashboardData ? <DashboardView data={dashboardData} /> : <DiagnosisView onBack={() => setCurrentView("hub")} onFormSubmitStart={handleFormSubmitStart} onFormSubmitEnd={handleFormSubmitEnd} />;
      case "action-plan":
        return <ActionPlanView onBack={() => setCurrentView("hub")} />;
      case "menu-analysis":
        return <MenuAnalysisView onBack={() => setCurrentView("hub")} />;
      case "price-calculator":
        return <PriceCalculatorView onBack={() => setCurrentView("hub")} />;
      case "restaurant":
        return <RestaurantView onNavigate={handleNavigate} onBack={() => setCurrentView("hub")} />;
      case "admin":
        return <AdminDashboard onBack={() => setCurrentView("hub")} />;
      case "dev-dashboard":
        return <DeveloperDashboard onBack={() => setCurrentView("hub")} />;
      case "leads-dashboard":
        return <LeadsDashboard onBack={() => setCurrentView("hub")} />;
      case "market-intelligence":
        return <MarketIntelligenceDashboard onBack={() => setCurrentView("hub")} />;
      case "free-analysis":
        return <FreeAnalysisView onBack={() => setCurrentView("hub")} />;
      case "my-analyses":
        return <MyAnalysesView onBack={() => setCurrentView("hub")} />;
      default:
        return <HubView onNavigate={handleNavigate} />;
    }
  };
  
  const handleLogout = () => {
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
        
        <SurveyPopup currentView={currentView} />
      </div>
    </>
  );
}

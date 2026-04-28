"use client";

import { AppHeader } from "@/components/app/app-header";
import MyAnalysesView from "@/components/app/analyses/my-analyses-view";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import LoadingScreen from "@/components/app/loading-screen";

export default function MinhasAnalisesPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  if (isUserLoading) return <LoadingScreen isVisible={true} />;
  if (!user) {
    router.push("/");
    return null;
  }

  const handleLogout = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        currentView="my-analyses"
        onNavigate={(view) => router.push("/")}
        isLoggedIn={!!user}
        onLogout={handleLogout}
      />
      <main>
        <MyAnalysesView onBack={() => router.push("/")} />
      </main>
    </div>
  );
}

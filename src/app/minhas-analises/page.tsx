"use client";

import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AnalysesHistoryView } from "@/components/app/analyses/analyses-history-view";

export default function MinhasAnalisesPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <AppSidebar />
      <div className="lg:pl-72">
        <AppHeader />
        <main className="p-4 md:p-8">
          <AnalysesHistoryView />
        </main>
      </div>
    </div>
  );
}

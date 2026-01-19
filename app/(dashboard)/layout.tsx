import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import "@/app/globals.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto px-6 pb-10">{children}</main>
      </div>
    </div>
  );
}

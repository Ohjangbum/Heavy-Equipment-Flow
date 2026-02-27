import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Quotations from "@/pages/quotations";
import CreateQuotation from "@/pages/create-quotation";
import WorkOrders from "@/pages/work-orders";
import CreateWorkOrder from "@/pages/create-work-order";
import InvoicesList from "@/pages/invoices";
import CreateInvoice from "@/pages/create-invoice";
import PurchaseOrdersList from "@/pages/purchase-orders";
import CreatePurchaseOrder from "@/pages/create-purchase-order";
import SearchPage from "@/pages/search";
import UsersPage from "@/pages/users";
import { QuotationDetail, WorkOrderDetail, InvoiceDetail, ProjectDetail, PurchaseOrderDetail } from "@/pages/document-detail";
import { Skeleton } from "@/components/ui/skeleton";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/quotations" component={Quotations} />
      <Route path="/quotations/new" component={CreateQuotation} />
      <Route path="/quotations/:id" component={QuotationDetail} />
      <Route path="/work-orders" component={WorkOrders} />
      <Route path="/work-orders/new" component={CreateWorkOrder} />
      <Route path="/work-orders/:id" component={WorkOrderDetail} />
      <Route path="/invoices" component={InvoicesList} />
      <Route path="/invoices/new" component={CreateInvoice} />
      <Route path="/invoices/:id" component={InvoiceDetail} />
      <Route path="/purchase-orders" component={PurchaseOrdersList} />
      <Route path="/purchase-orders/new" component={CreatePurchaseOrder} />
      <Route path="/purchase-orders/:id" component={PurchaseOrderDetail} />
      <Route path="/search" component={SearchPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/project/:projectNumber" component={ProjectDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function TechnicianRouter() {
  return (
    <Switch>
      <Route path="/" component={WorkOrders} />
      <Route path="/work-orders/:id" component={WorkOrderDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === "admin";

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center p-2 border-b shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-y-auto">
            {isAdmin ? <AdminRouter /> : <TechnicianRouter />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, FileText, BarChart3, Smartphone } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Workshop Manager</span>
          </div>
          <a href="/api/login">
            <Button data-testid="button-login">Sign In</Button>
          </a>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-6">
              Heavy Equipment Workshop Document Management
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Streamline your workshop operations. Create quotations, work orders, and invoices
              with professional templates. Track projects from start to finish, all from your phone.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/api/login">
                <Button size="lg" data-testid="button-get-started">
                  Get Started
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-muted-foreground">
              <span>Free to use</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
              <span>Mobile friendly</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
              <span>PDF export</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-card rounded-lg border p-8 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">QUO/10001</p>
                  <p className="text-sm text-muted-foreground">PT ABAD JAYA</p>
                </div>
                <span className="ml-auto text-sm px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Completed
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Quote Amount</span>
                  <span className="font-medium">Rp 27,850,000</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">WO Budget</span>
                  <span className="font-medium">Rp 3,000,000</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Technician Cost</span>
                  <span className="font-medium">Rp 2,500,000</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold">Profit</span>
                  <span className="font-bold text-green-600">Rp 22,350,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Document Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Professional templates for Quotations, Work Orders, and Invoices.
                  Export to PDF with your company branding.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Project Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Track every project from quotation to invoice.
                  See profit/loss calculations in real time.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Mobile Ready</h3>
                <p className="text-sm text-muted-foreground">
                  Access from anywhere. Technicians can update work orders
                  and input costs directly from their phones.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t text-center text-sm text-muted-foreground">
        <p>CV UTAMA SINERGI BERKARYA - Workshop Management System</p>
      </footer>
    </div>
  );
}

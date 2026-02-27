import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ClipboardList, Receipt, TrendingUp } from "lucide-react";
import { formatCurrency, WO_STATUS_MAP } from "@/lib/constants";
import { Link } from "wouter";
import { getQueryFn } from "@/lib/queryClient";

export default function Dashboard() {
  const { data: projects, isLoading } = useQuery<any[]>({
    queryKey: ["/api/dashboard"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const totalProjects = projects?.length || 0;
  const activeWOs = projects?.filter((p: any) => p.woStatus === "processing").length || 0;
  const totalRevenue = projects?.reduce((sum: number, p: any) => sum + (p.quoteAmount || 0), 0) || 0;
  const totalProfit = projects?.reduce((sum: number, p: any) => sum + (p.profitLoss || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold" data-testid="text-total-projects">{totalProjects}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-sm text-muted-foreground">Active WOs</p>
                <p className="text-2xl font-bold" data-testid="text-active-wos">{activeWOs}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold" data-testid="text-total-revenue">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className={`text-xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-total-profit">
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          {!projects || projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No projects yet. Start by creating a quotation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm" data-testid="table-projects">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-6 py-3 font-medium text-muted-foreground">No</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Client</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Quotation</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">WO Status</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground text-right">Quote Amount</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground text-right">WO Budget</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground text-right">Tech. Cost</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground text-right">Profit/Loss</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p: any) => {
                    const statusInfo = p.woStatus ? WO_STATUS_MAP[p.woStatus] : null;
                    return (
                      <tr key={p.projectNumber} className="border-b last:border-0" data-testid={`row-project-${p.projectNumber}`}>
                        <td className="px-6 py-3">
                          <Link href={`/project/${p.projectNumber}`} className="text-primary font-medium">
                            {p.projectNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-3 font-medium">{p.clientName}</td>
                        <td className="px-6 py-3">
                          {p.quotation ? (
                            <Link href={`/quotations/${p.quotationId}`} className="text-primary">
                              {p.quotation}
                            </Link>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="px-6 py-3">
                          {statusInfo ? (
                            <Badge variant="secondary" className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="px-6 py-3 text-right font-medium">{formatCurrency(p.quoteAmount)}</td>
                        <td className="px-6 py-3 text-right">{formatCurrency(p.woBudget)}</td>
                        <td className="px-6 py-3 text-right">{formatCurrency(p.technicianCost)}</td>
                        <td className={`px-6 py-3 text-right font-bold ${p.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(p.profitLoss)}
                        </td>
                        <td className="px-6 py-3">
                          {p.invoice ? (
                            <Link href={`/invoices/${p.invoiceId}`} className="text-primary">
                              {p.invoice}
                            </Link>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

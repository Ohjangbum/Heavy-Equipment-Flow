import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Receipt } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/constants";
import { getQueryFn } from "@/lib/queryClient";
import type { Invoice } from "@shared/schema";

export default function Invoices() {
  const { data: invoicesList, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-invoices-title">Invoices</h1>
        <Link href="/invoices/new">
          <Button data-testid="button-new-invoice">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !invoicesList || invoicesList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No invoices yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoicesList.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`}>
              <Card className="hover-elevate cursor-pointer" data-testid={`card-invoice-${inv.id}`}>
                <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold">INV/{inv.projectNumber}</p>
                      <p className="text-sm text-muted-foreground">{inv.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(inv.total)}</p>
                    <Badge variant="secondary" className="text-xs capitalize">{inv.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

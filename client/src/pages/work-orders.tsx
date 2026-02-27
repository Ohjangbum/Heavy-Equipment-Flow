import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ClipboardList } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency, WO_STATUS_MAP } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";
import type { WorkOrder } from "@shared/schema";

export default function WorkOrders() {
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === "admin";

  const { data: workOrders, isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-wo-title">
          {isAdmin ? "Work Orders" : "My Work Orders"}
        </h1>
        {isAdmin && (
          <Link href="/work-orders/new">
            <Button data-testid="button-new-wo">
              <Plus className="w-4 h-4 mr-2" />
              New Work Order
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !workOrders || workOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>{isAdmin ? "No work orders yet." : "No work orders assigned to you."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workOrders.map((wo) => {
            const statusInfo = WO_STATUS_MAP[wo.status] || WO_STATUS_MAP.assigned;
            return (
              <Link key={wo.id} href={`/work-orders/${wo.id}`}>
                <Card className="hover-elevate cursor-pointer" data-testid={`card-wo-${wo.id}`}>
                  <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold">WO/{wo.projectNumber}</p>
                        <p className="text-sm text-muted-foreground">{wo.customerName}</p>
                        <p className="text-xs text-muted-foreground">{wo.jobDescription}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-semibold">{formatCurrency(wo.totalBudget)}</p>
                      <Badge variant="secondary" className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

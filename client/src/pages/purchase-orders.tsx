import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import type { PurchaseOrder } from "@shared/schema";

export default function PurchaseOrdersList() {
  const { data: pos, isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-po-title">Purchase Orders</h1>
        <Link href="/purchase-orders/new">
          <Button data-testid="button-new-po">
            <Plus className="w-4 h-4 mr-2" />
            Input PO
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !pos || pos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No purchase orders yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pos.map((po) => (
            <Card key={po.id} className="hover-elevate" data-testid={`card-po-${po.id}`}>
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{po.poNumber}</p>
                    <p className="text-sm text-muted-foreground">Project: {po.projectNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{po.dateReceived}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

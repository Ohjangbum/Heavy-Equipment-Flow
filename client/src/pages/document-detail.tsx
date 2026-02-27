import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Check, Play, FileIcon, ExternalLink } from "lucide-react";
import { Link, useRoute } from "wouter";
import { formatCurrency, WO_STATUS_MAP } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { generateQuotationPDF, generateInvoicePDF, generateWorkOrderPDF } from "@/lib/pdf-generator";
import { useState } from "react";

export function QuotationDetail() {
  const [, params] = useRoute("/quotations/:id");
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/quotations", params?.id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!params?.id,
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!data) return <div className="p-6">Quotation not found</div>;

  const materialItems = data.items?.filter((i: any) => i.category === "material") || [];
  const serviceItems = data.items?.filter((i: any) => i.category === "service") || [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/quotations">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-quo-detail-title">QUO/{data.projectNumber}</h1>
            <p className="text-sm text-muted-foreground">{data.client?.name} - {data.date}</p>
          </div>
        </div>
        <Button onClick={() => generateQuotationPDF(data)} data-testid="button-download-pdf">
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </Button>
      </div>

      {data.equipmentDescription && (
        <p className="text-sm text-muted-foreground">
          Berikut Penawaran Material dan Jasa Perbaikan {data.equipmentDescription} dengan rincian sebagai berikut:
        </p>
      )}

      {materialItems.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">A. Material</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 w-8">No</th>
                    <th className="text-left py-2 px-2">Description</th>
                    <th className="text-right py-2 px-2">Qty</th>
                    <th className="text-left py-2 px-2">Unit</th>
                    <th className="text-right py-2 px-2">Unit Price</th>
                    <th className="text-right py-2 px-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {materialItems.map((item: any, idx: number) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 px-2">{idx + 1}</td>
                      <td className="py-2 px-2">{item.description}</td>
                      <td className="py-2 px-2 text-right">{item.quantity}</td>
                      <td className="py-2 px-2">{item.unit}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {serviceItems.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">B. Service</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 w-8">No</th>
                    <th className="text-left py-2 px-2">Description</th>
                    <th className="text-right py-2 px-2">Qty</th>
                    <th className="text-left py-2 px-2">Unit</th>
                    <th className="text-right py-2 px-2">Unit Price</th>
                    <th className="text-right py-2 px-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceItems.map((item: any, idx: number) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 px-2">{idx + 1}</td>
                      <td className="py-2 px-2">{item.description}</td>
                      <td className="py-2 px-2 text-right">{item.quantity}</td>
                      <td className="py-2 px-2">{item.unit}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-end">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(data.subtotal)}</span>
              </div>
              <div className="flex justify-between gap-8 text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function WorkOrderDetail() {
  const [, params] = useRoute("/work-orders/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const [techCost, setTechCost] = useState("");
  const isAdmin = (user as any)?.role === "admin";
  const isTechnician = (user as any)?.role === "technician";

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/work-orders", params?.id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!params?.id,
  });

  const acceptMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/work-orders/${params?.id}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({ title: "Work Order accepted" });
    },
  });

  const completeMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/work-orders/${params?.id}/complete`, {
        technicianCost: parseInt(techCost) || 0,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Work Order completed" });
    },
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!data) return <div className="p-6">Work Order not found</div>;

  const statusInfo = WO_STATUS_MAP[data.status] || WO_STATUS_MAP.assigned;
  const canAccept = isTechnician && data.status === "assigned" && data.assignedToId === (user as any)?.id;
  const canComplete = isTechnician && data.status === "processing" && data.assignedToId === (user as any)?.id;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/work-orders">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-wo-detail-title">WO/{data.projectNumber}</h1>
            <p className="text-sm text-muted-foreground">{data.customerName}</p>
          </div>
          <Badge variant="secondary" className={statusInfo.color}>{statusInfo.label}</Badge>
        </div>
        <Button onClick={() => generateWorkOrderPDF(data)} data-testid="button-download-pdf">
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground">Order Date</p><p className="font-medium">{data.orderDate}</p></div>
            <div><p className="text-muted-foreground">Completion Date</p><p className="font-medium">{data.completionDate || "-"}</p></div>
            <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{data.customerName}</p></div>
            <div><p className="text-muted-foreground">Site Unit</p><p className="font-medium">{data.siteUnit || "-"}</p></div>
            <div><p className="text-muted-foreground">Machine/SN</p><p className="font-medium">{data.machineSn || "-"}</p></div>
            <div><p className="text-muted-foreground">Hours Meter</p><p className="font-medium">{data.hoursMeter || "-"}</p></div>
            <div><p className="text-muted-foreground">Technicians</p><p className="font-medium">{data.technicianNames || "-"}</p></div>
            <div className="col-span-2"><p className="text-muted-foreground">Job</p><p className="font-medium">{data.jobDescription}</p></div>
          </div>
        </CardContent>
      </Card>

      {data.items && data.items.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Material Needs & Budget</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Description</th>
                  <th className="text-right py-2 px-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item: any) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 px-2">{item.description}</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-2 px-2">TOTAL</td>
                  <td className="py-2 px-2 text-right">{formatCurrency(data.totalBudget)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {data.technicianCost > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Technician Actual Cost</span>
              <span className="text-lg font-bold">{formatCurrency(data.technicianCost)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {canAccept && (
        <Card>
          <CardContent className="p-6 flex justify-center">
            <Button onClick={() => acceptMut.mutate()} disabled={acceptMut.isPending} data-testid="button-accept-wo">
              <Play className="w-4 h-4 mr-2" />
              {acceptMut.isPending ? "Accepting..." : "Accept & Start Work"}
            </Button>
          </CardContent>
        </Card>
      )}

      {canComplete && (
        <Card>
          <CardHeader><CardTitle className="text-base">Complete Work Order</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Total Actual Expenditure (Rp)</Label>
              <Input
                type="number"
                value={techCost}
                onChange={(e) => setTechCost(e.target.value)}
                placeholder="Enter total actual cost"
                data-testid="input-tech-cost"
              />
            </div>
            <Button onClick={() => completeMut.mutate()} disabled={completeMut.isPending} data-testid="button-complete-wo">
              <Check className="w-4 h-4 mr-2" />
              {completeMut.isPending ? "Completing..." : "Mark as Done"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function InvoiceDetail() {
  const [, params] = useRoute("/invoices/:id");
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/invoices", params?.id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!params?.id,
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!data) return <div className="p-6">Invoice not found</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-inv-detail-title">INV/{data.projectNumber}</h1>
            <p className="text-sm text-muted-foreground">{data.client?.name} - {data.date}</p>
          </div>
        </div>
        <Button onClick={() => generateInvoicePDF(data)} data-testid="button-download-pdf">
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </Button>
      </div>

      {data.poNumber && (
        <p className="text-sm text-muted-foreground">NO PO {data.poNumber}</p>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 w-8">No</th>
                  <th className="text-left py-2 px-2">Description</th>
                  <th className="text-right py-2 px-2">Qty</th>
                  <th className="text-left py-2 px-2">Unit</th>
                  <th className="text-right py-2 px-2">Unit Price</th>
                  <th className="text-right py-2 px-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.items?.map((item: any, idx: number) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 px-2">{idx + 1}</td>
                    <td className="py-2 px-2">{item.description}</td>
                    <td className="py-2 px-2 text-right">{item.quantity}</td>
                    <td className="py-2 px-2">{item.unit}</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 px-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-end">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(data.subtotal)}</span>
              </div>
              <div className="flex justify-between gap-8 text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProjectDetail() {
  const [, params] = useRoute("/project/:projectNumber");
  const pn = params?.projectNumber;

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/project", pn],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!pn,
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!data) return <div className="p-6">Project not found</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-project-title">Project {data.projectNumber}</h1>
          <p className="text-sm text-muted-foreground">{data.client?.name}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={data.quotation ? "hover-elevate" : ""}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Quotation</p>
            {data.quotation ? (
              <Link href={`/quotations/${data.quotation.id}`} className="text-primary font-semibold">
                QUO/{data.projectNumber} - {formatCurrency(data.quotation.total)}
              </Link>
            ) : <p className="text-muted-foreground">Not created</p>}
          </CardContent>
        </Card>

        <Card className={data.purchaseOrder ? "hover-elevate" : ""}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Purchase Order</p>
            {data.purchaseOrder ? (
              <p className="font-semibold">{data.purchaseOrder.poNumber}</p>
            ) : <p className="text-muted-foreground">Not received</p>}
          </CardContent>
        </Card>

        <Card className={data.workOrder ? "hover-elevate" : ""}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Work Order</p>
            {data.workOrder ? (
              <div>
                <Link href={`/work-orders/${data.workOrder.id}`} className="text-primary font-semibold">
                  WO/{data.projectNumber}
                </Link>
                <Badge variant="secondary" className={`ml-2 ${WO_STATUS_MAP[data.workOrder.status]?.color}`}>
                  {WO_STATUS_MAP[data.workOrder.status]?.label}
                </Badge>
                <p className="text-sm mt-1">Budget: {formatCurrency(data.workOrder.totalBudget)}</p>
                {data.workOrder.technicianCost > 0 && (
                  <p className="text-sm">Tech Cost: {formatCurrency(data.workOrder.technicianCost)}</p>
                )}
              </div>
            ) : <p className="text-muted-foreground">Not created</p>}
          </CardContent>
        </Card>

        <Card className={data.invoice ? "hover-elevate" : ""}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Invoice</p>
            {data.invoice ? (
              <Link href={`/invoices/${data.invoice.id}`} className="text-primary font-semibold">
                INV/{data.projectNumber} - {formatCurrency(data.invoice.total)}
              </Link>
            ) : <p className="text-muted-foreground">Not created</p>}
          </CardContent>
        </Card>
      </div>

      {data.quotation && data.workOrder && (
        <Card>
          <CardHeader><CardTitle className="text-base">Financial Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Quote Amount</span>
                <span className="font-medium">{formatCurrency(data.quotation.total)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">WO Budget</span>
                <span className="font-medium">{formatCurrency(data.workOrder.totalBudget)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Technician Cost</span>
                <span className="font-medium">{formatCurrency(data.workOrder.technicianCost || 0)}</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Profit/Loss</span>
                {(() => {
                  const profit = data.quotation.total - (data.workOrder.technicianCost || 0) - data.workOrder.totalBudget;
                  return <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(profit)}</span>;
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PurchaseOrderDetail() {
  const [, params] = useRoute("/purchase-orders/:id");
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/purchase-orders", params?.id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!params?.id,
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!data) return <div className="p-6">Purchase Order not found</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/purchase-orders">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-po-detail-title">{data.poNumber}</h1>
          <p className="text-sm text-muted-foreground">Project: {data.projectNumber} - {data.client?.name}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">PO Number</p>
              <p className="font-medium">{data.poNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Project Number</p>
              <Link href={`/project/${data.projectNumber}`} className="font-medium text-primary">
                {data.projectNumber}
              </Link>
            </div>
            <div>
              <p className="text-muted-foreground">Client</p>
              <p className="font-medium">{data.client?.name || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date Received</p>
              <p className="font-medium">{data.dateReceived}</p>
            </div>
            {data.notes && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Notes</p>
                <p className="font-medium">{data.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {data.fileUrl && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-3">Attached PO Document</p>
            <a
              href={data.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
              data-testid="link-po-file"
            >
              <FileIcon className="w-8 h-8 text-primary shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">PO Document</p>
                <p className="text-xs text-muted-foreground">Click to view/download</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

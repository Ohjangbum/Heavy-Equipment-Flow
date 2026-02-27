import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { BANK_ACCOUNTS } from "@/lib/constants";
import type { Client } from "@shared/schema";

interface LineItem {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  notes: string;
}

export default function CreateInvoice() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: clientsList } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const [projectNumber, setProjectNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
  const [bankChoice, setBankChoice] = useState("maybank");
  const [items, setItems] = useState<LineItem[]>([
    { category: "material", description: "", quantity: 1, unit: "Set", unitPrice: 0, amount: 0, notes: "" },
  ]);
  const [linkedData, setLinkedData] = useState<any>(null);

  const handleProjectNumberChange = async (val: string) => {
    setProjectNumber(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= 10000) {
      try {
        const res = await fetch(`/api/project/${num}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setLinkedData(data);
          if (data.client) {
            setClientId(String(data.client.id));
            setClientName(data.client.name);
          }
          if (data.purchaseOrder) {
            setPoNumber(data.purchaseOrder.poNumber);
          }
          if (data.quotation?.items) {
            const quoteItems = data.quotation.items.map((qi: any) => ({
              category: qi.category || "material",
              description: qi.description,
              quantity: qi.quantity,
              unit: qi.unit,
              unitPrice: qi.unitPrice,
              amount: qi.amount,
              notes: qi.notes || "",
            }));
            if (quoteItems.length > 0) setItems(quoteItems);
          }
        }
      } catch (e) {
        // silently ignore
      }
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === "quantity" || field === "unitPrice") {
      updated[index].amount = updated[index].quantity * updated[index].unitPrice;
    }
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal;

  const createInvoiceMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/invoices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Invoice created successfully" });
      navigate("/invoices");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create invoice", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const pn = parseInt(projectNumber);
    if (!pn || !clientId) {
      toast({ title: "Please fill project number and client", variant: "destructive" });
      return;
    }

    createInvoiceMut.mutate({
      projectNumber: pn,
      clientId: parseInt(clientId),
      date,
      poNumber,
      subtotal,
      total,
      bankChoice,
      status: "draft",
      items: items.filter(i => i.description),
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/invoices">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-create-inv-title">New Invoice</h1>
          <p className="text-sm text-muted-foreground">INV/{projectNumber || "..."}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Project Number *</Label>
              <Input
                type="number"
                value={projectNumber}
                onChange={(e) => handleProjectNumberChange(e.target.value)}
                placeholder="e.g. 10000 (auto-links to QUO & WO)"
                data-testid="input-project-number"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter the number to auto-link with QUO/WO</p>
            </div>
            <div>
              <Label>Date</Label>
              <Input value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-date" />
            </div>
          </div>

          {linkedData && (
            <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
              <p className="font-medium">Linked Documents:</p>
              {linkedData.quotation && <p className="text-muted-foreground">Quotation: QUO/{linkedData.projectNumber}</p>}
              {linkedData.purchaseOrder && <p className="text-muted-foreground">PO: {linkedData.purchaseOrder.poNumber}</p>}
              {linkedData.workOrder && <p className="text-muted-foreground">Work Order: WO/{linkedData.projectNumber} ({linkedData.workOrder.status})</p>}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Client</Label>
              <Select value={clientId} onValueChange={(val) => {
                setClientId(val);
                const c = clientsList?.find(c => c.id === parseInt(val));
                if (c) setClientName(c.name);
              }}>
                <SelectTrigger data-testid="select-client">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clientsList?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>PO Number (from client)</Label>
              <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="e.g. M.2025.351/DIR" data-testid="input-po-number" />
            </div>
          </div>

          <div>
            <Label>Bank Account</Label>
            <Select value={bankChoice} onValueChange={setBankChoice}>
              <SelectTrigger data-testid="select-bank">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BANK_ACCOUNTS.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.bankName} - {b.branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-1">
          <CardTitle>Items</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setItems([...items, { category: "material", description: "", quantity: 1, unit: "Set", unitPrice: 0, amount: 0, notes: "" }])} data-testid="button-add-item">
            <Plus className="w-4 h-4 mr-1" /> Add Row
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-4">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    data-testid={`input-inv-desc-${idx}`}
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)}
                    data-testid={`input-inv-qty-${idx}`}
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <Label className="text-xs">Unit</Label>
                  <Input
                    value={item.unit}
                    onChange={(e) => updateItem(idx, "unit", e.target.value)}
                    data-testid={`input-inv-unit-${idx}`}
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", parseInt(e.target.value) || 0)}
                    data-testid={`input-inv-price-${idx}`}
                  />
                </div>
                <div className="col-span-9 sm:col-span-2">
                  <Label className="text-xs">Amount</Label>
                  <Input value={item.amount.toLocaleString("id-ID")} readOnly className="bg-muted" />
                </div>
                <div className="col-span-3 sm:col-span-1 flex justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (items.length <= 1) return;
                      setItems(items.filter((_, i) => i !== idx));
                    }}
                    disabled={items.length <= 1}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span data-testid="text-total">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/invoices">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={createInvoiceMut.isPending}
          data-testid="button-save-invoice"
        >
          {createInvoiceMut.isPending ? "Saving..." : "Save Invoice"}
        </Button>
      </div>
    </div>
  );
}

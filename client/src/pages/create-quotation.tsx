import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { BANK_ACCOUNTS } from "@/lib/constants";
import type { Client } from "@shared/schema";
import { Link } from "wouter";

interface LineItem {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  notes: string;
}

export default function CreateQuotation() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: nextNum } = useQuery<{ nextProjectNumber: number }>({
    queryKey: ["/api/project-number/next"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: clientsList } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const [clientId, setClientId] = useState<string>("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [date, setDate] = useState(new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
  const [equipmentDescription, setEquipmentDescription] = useState("");
  const [bankChoice, setBankChoice] = useState("maybank");
  const [materialItems, setMaterialItems] = useState<LineItem[]>([
    { category: "material", description: "", quantity: 1, unit: "pcs", unitPrice: 0, amount: 0, notes: "" },
  ]);
  const [serviceItems, setServiceItems] = useState<LineItem[]>([
    { category: "service", description: "", quantity: 1, unit: "Ls", unitPrice: 0, amount: 0, notes: "" },
  ]);

  const updateItem = (items: LineItem[], setItems: (v: LineItem[]) => void, index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === "quantity" || field === "unitPrice") {
      updated[index].amount = updated[index].quantity * updated[index].unitPrice;
    }
    setItems(updated);
  };

  const addItem = (items: LineItem[], setItems: (v: LineItem[]) => void, category: string) => {
    setItems([...items, { category, description: "", quantity: 1, unit: category === "material" ? "pcs" : "Ls", unitPrice: 0, amount: 0, notes: "" }]);
  };

  const removeItem = (items: LineItem[], setItems: (v: LineItem[]) => void, index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = [...materialItems, ...serviceItems].reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal;

  const createClientMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return res.json();
    },
  });

  const createQuotationMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/quotations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-number/next"] });
      toast({ title: "Quotation created successfully" });
      navigate("/quotations");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create quotation", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = async () => {
    let finalClientId = parseInt(clientId);

    if (showNewClient && newClientName) {
      const client = await createClientMut.mutateAsync({
        name: newClientName,
        address: newClientAddress,
      });
      finalClientId = client.id;
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    }

    if (!finalClientId) {
      toast({ title: "Please select or create a client", variant: "destructive" });
      return;
    }

    const allItems = [
      ...materialItems.filter(i => i.description),
      ...serviceItems.filter(i => i.description),
    ];

    createQuotationMut.mutate({
      projectNumber: nextNum?.nextProjectNumber || 10000,
      clientId: finalClientId,
      date,
      equipmentDescription,
      subtotal,
      total,
      bankChoice,
      status: "draft",
      items: allItems,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/quotations">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-create-quo-title">New Quotation</h1>
          <p className="text-sm text-muted-foreground">QUO/{nextNum?.nextProjectNumber || "..."}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Client Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant={showNewClient ? "outline" : "default"}
              size="sm"
              onClick={() => setShowNewClient(false)}
              data-testid="button-existing-client"
            >
              Existing Client
            </Button>
            <Button
              variant={showNewClient ? "default" : "outline"}
              size="sm"
              onClick={() => setShowNewClient(true)}
              data-testid="button-new-client"
            >
              New Client
            </Button>
          </div>

          {showNewClient ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Client Name</Label>
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. PT ABAD JAYA"
                  data-testid="input-new-client-name"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  placeholder="Client address"
                  data-testid="input-new-client-address"
                />
              </div>
            </div>
          ) : (
            <div>
              <Label>Select Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger data-testid="select-client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clientsList?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Quotation Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Date</Label>
              <Input value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-date" />
            </div>
            <div>
              <Label>Equipment Description</Label>
              <Input
                value={equipmentDescription}
                onChange={(e) => setEquipmentDescription(e.target.value)}
                placeholder="e.g. Loader Caterpillar 938H"
                data-testid="input-equipment"
              />
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
          <CardTitle>A. Material</CardTitle>
          <Button size="sm" variant="outline" onClick={() => addItem(materialItems, setMaterialItems, "material")} data-testid="button-add-material">
            <Plus className="w-4 h-4 mr-1" /> Add Row
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {materialItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-4">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(materialItems, setMaterialItems, idx, "description", e.target.value)}
                    placeholder="Item name"
                    data-testid={`input-mat-desc-${idx}`}
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(materialItems, setMaterialItems, idx, "quantity", parseInt(e.target.value) || 0)}
                    data-testid={`input-mat-qty-${idx}`}
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <Label className="text-xs">Unit</Label>
                  <Input
                    value={item.unit}
                    onChange={(e) => updateItem(materialItems, setMaterialItems, idx, "unit", e.target.value)}
                    data-testid={`input-mat-unit-${idx}`}
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(materialItems, setMaterialItems, idx, "unitPrice", parseInt(e.target.value) || 0)}
                    data-testid={`input-mat-price-${idx}`}
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
                    onClick={() => removeItem(materialItems, setMaterialItems, idx)}
                    disabled={materialItems.length <= 1}
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
        <CardHeader className="flex flex-row items-center justify-between gap-1">
          <CardTitle>B. Service</CardTitle>
          <Button size="sm" variant="outline" onClick={() => addItem(serviceItems, setServiceItems, "service")} data-testid="button-add-service">
            <Plus className="w-4 h-4 mr-1" /> Add Row
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {serviceItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-4">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(serviceItems, setServiceItems, idx, "description", e.target.value)}
                    placeholder="Service name"
                    data-testid={`input-svc-desc-${idx}`}
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(serviceItems, setServiceItems, idx, "quantity", parseInt(e.target.value) || 0)}
                    data-testid={`input-svc-qty-${idx}`}
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <Label className="text-xs">Unit</Label>
                  <Input
                    value={item.unit}
                    onChange={(e) => updateItem(serviceItems, setServiceItems, idx, "unit", e.target.value)}
                    data-testid={`input-svc-unit-${idx}`}
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(serviceItems, setServiceItems, idx, "unitPrice", parseInt(e.target.value) || 0)}
                    data-testid={`input-svc-price-${idx}`}
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
                    onClick={() => removeItem(serviceItems, setServiceItems, idx)}
                    disabled={serviceItems.length <= 1}
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
        <Link href="/quotations">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={createQuotationMut.isPending}
          data-testid="button-save-quotation"
        >
          {createQuotationMut.isPending ? "Saving..." : "Save Quotation"}
        </Button>
      </div>
    </div>
  );
}

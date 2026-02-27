import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import type { Client, Quotation } from "@shared/schema";
import type { User } from "@shared/models/auth";

interface CostItem {
  description: string;
  amount: number;
}

export default function CreateWorkOrder() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: clientsList } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: usersList } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: quotations } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const [projectNumber, setProjectNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" }));
  const [completionDate, setCompletionDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [siteUnit, setSiteUnit] = useState("");
  const [technicianNames, setTechnicianNames] = useState("");
  const [machineSn, setMachineSn] = useState("");
  const [hoursMeter, setHoursMeter] = useState("");
  const [departments, setDepartments] = useState("Div. IT, Div. Finance, Div. Marketing, Div. Service");
  const [jobDescription, setJobDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [costItems, setCostItems] = useState<CostItem[]>([
    { description: "Teknisi", amount: 0 },
    { description: "Konsumsi, Operasional, Solar, dll.", amount: 0 },
    { description: "Helper", amount: 0 },
    { description: "Depresiasi & Maintenance Kendaraan", amount: 0 },
    { description: "Fee Office 10%", amount: 0 },
  ]);

  const handleProjectNumberChange = (val: string) => {
    setProjectNumber(val);
    const num = parseInt(val);
    if (!isNaN(num)) {
      const quo = quotations?.find(q => q.projectNumber === num);
      if (quo) {
        setClientId(String(quo.clientId));
        const client = clientsList?.find(c => c.id === quo.clientId);
        if (client) setCustomerName(client.name);
      }
    }
  };

  const totalBudget = costItems.reduce((sum, item) => sum + item.amount, 0);

  const technicians = usersList?.filter(u => u.role === "technician") || [];

  const createWOMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/work-orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Work Order created successfully" });
      navigate("/work-orders");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create work order", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const pn = parseInt(projectNumber);
    if (!pn || !customerName || !jobDescription) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    createWOMut.mutate({
      projectNumber: pn,
      clientId: parseInt(clientId) || 0,
      orderDate,
      completionDate: completionDate || null,
      customerName,
      siteUnit,
      technicianNames,
      machineSn,
      hoursMeter,
      departments,
      jobDescription,
      status: "assigned",
      totalBudget,
      technicianCost: 0,
      assignedToId: assignedToId || null,
      items: costItems.filter(i => i.description),
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/work-orders">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-create-wo-title">New Work Order</h1>
          <p className="text-sm text-muted-foreground">WO/{projectNumber || "..."}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Work Order Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Project Number *</Label>
              <Input
                type="number"
                value={projectNumber}
                onChange={(e) => handleProjectNumberChange(e.target.value)}
                placeholder="e.g. 10000"
                data-testid="input-project-number"
              />
              <p className="text-xs text-muted-foreground mt-1">Must match an existing Quotation number</p>
            </div>
            <div>
              <Label>Assign to Technician</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger data-testid="select-technician">
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {(t as any).employeeId || "?"} - {(t as any).displayName || t.firstName || t.email || t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Order Date</Label>
              <Input value={orderDate} onChange={(e) => setOrderDate(e.target.value)} data-testid="input-order-date" />
            </div>
            <div>
              <Label>Completion Date</Label>
              <Input value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} placeholder="DD/MM/YY" data-testid="input-completion-date" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Customer Name *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} data-testid="input-customer-name" />
            </div>
            <div>
              <Label>Departments (Kepada)</Label>
              <Input value={departments} onChange={(e) => setDepartments(e.target.value)} data-testid="input-departments" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Site Unit</Label>
              <Input value={siteUnit} onChange={(e) => setSiteUnit(e.target.value)} data-testid="input-site-unit" />
            </div>
            <div>
              <Label>Machine / SN</Label>
              <Input value={machineSn} onChange={(e) => setMachineSn(e.target.value)} data-testid="input-machine-sn" />
            </div>
            <div>
              <Label>Hours Meter</Label>
              <Input value={hoursMeter} onChange={(e) => setHoursMeter(e.target.value)} data-testid="input-hours-meter" />
            </div>
          </div>

          <div>
            <Label>Technician Names</Label>
            <Input value={technicianNames} onChange={(e) => setTechnicianNames(e.target.value)} placeholder="e.g. Dedi Munawar, Rizki Juanda" data-testid="input-technician-names" />
          </div>

          <div>
            <Label>Job Description *</Label>
            <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="e.g. 1 Troubleshooting Engine Low Power" data-testid="input-job-description" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-1">
          <CardTitle>Material Needs & Budget</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setCostItems([...costItems, { description: "", amount: 0 }])} data-testid="button-add-cost">
            <Plus className="w-4 h-4 mr-1" /> Add Row
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {costItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-8 sm:col-span-8">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...costItems];
                      updated[idx].description = e.target.value;
                      setCostItems(updated);
                    }}
                    data-testid={`input-cost-desc-${idx}`}
                  />
                </div>
                <div className="col-span-3 sm:col-span-3">
                  <Label className="text-xs">Amount (Rp)</Label>
                  <Input
                    type="number"
                    value={item.amount}
                    onChange={(e) => {
                      const updated = [...costItems];
                      updated[idx].amount = parseInt(e.target.value) || 0;
                      setCostItems(updated);
                    }}
                    data-testid={`input-cost-amount-${idx}`}
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (costItems.length <= 1) return;
                      setCostItems(costItems.filter((_, i) => i !== idx));
                    }}
                    disabled={costItems.length <= 1}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-xl font-bold" data-testid="text-total-budget">Rp {totalBudget.toLocaleString("id-ID")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/work-orders">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={createWOMut.isPending}
          data-testid="button-save-wo"
        >
          {createWOMut.isPending ? "Saving..." : "Save Work Order"}
        </Button>
      </div>
    </div>
  );
}

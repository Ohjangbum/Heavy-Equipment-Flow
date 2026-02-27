import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Upload, FileIcon, X } from "lucide-react";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

export default function CreatePurchaseOrder() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: clientsList } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const [poNumber, setPoNumber] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [dateReceived, setDateReceived] = useState(new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleProjectNumberChange = async (val: string) => {
    setProjectNumber(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= 10000) {
      try {
        const res = await fetch(`/api/quotations/project/${num}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.clientId) {
            setClientId(String(data.clientId));
          }
        }
      } catch (e) { /* ignore */ }
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const metaRes = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!metaRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await metaRes.json();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file");
      return objectPath;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const createPOMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/purchase-orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({ title: "Purchase Order saved successfully" });
      navigate("/purchase-orders");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save purchase order", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = async () => {
    if (!poNumber || !projectNumber || !clientId) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    let fileUrl: string | null = null;

    if (selectedFile) {
      fileUrl = await uploadFile(selectedFile);
      if (!fileUrl) {
        toast({ title: "Failed to upload file", variant: "destructive" });
        setIsUploading(false);
        return;
      }
    }

    setIsUploading(false);

    createPOMut.mutate({
      poNumber,
      projectNumber: parseInt(projectNumber),
      clientId: parseInt(clientId),
      dateReceived,
      notes: notes || null,
      fileUrl,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/purchase-orders">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold" data-testid="text-create-po-title">Input Purchase Order</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>PO Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>PO Number (from client) *</Label>
            <Input
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g. M.2025.351/DIR CFS Community"
              data-testid="input-po-number"
            />
          </div>
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
              <p className="text-xs text-muted-foreground mt-1">Link to existing Quotation</p>
            </div>
            <div>
              <Label>Date Received</Label>
              <Input value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} data-testid="input-date-received" />
            </div>
          </div>
          <div>
            <Label>Client *</Label>
            <Select value={clientId} onValueChange={setClientId}>
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
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" data-testid="input-notes" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>PO Document (from client)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file"
          />

          {selectedFile ? (
            <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
              <FileIcon className="w-8 h-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                data-testid="button-remove-file"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              data-testid="button-upload-area"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload PO document</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOC (max 10MB)</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/purchase-orders">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={createPOMut.isPending || isUploading}
          data-testid="button-save-po"
        >
          {isUploading ? "Uploading..." : createPOMut.isPending ? "Saving..." : "Save PO"}
        </Button>
      </div>
    </div>
  );
}

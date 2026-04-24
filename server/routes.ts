import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { role } = req.body;
      if (!["admin", "technician"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updated = await storage.updateUserRole(req.params.id, role);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.patch("/api/users/me/display-name", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { displayName } = req.body;
      if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
        return res.status(400).json({ message: "Display name is required" });
      }
      const updated = await storage.updateUserDisplayName(userId, displayName.trim());
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update display name" });
    }
  });

  app.get("/api/clients", isAuthenticated, async (_req, res) => {
    try {
      const allClients = await storage.getClients();
      res.json(allClients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const client = await storage.createClient(req.body);
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.get("/api/clients/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const results = await storage.searchClients(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to search clients" });
    }
  });

  app.get("/api/project-number/next", isAuthenticated, async (_req, res) => {
    try {
      const next = await storage.getNextProjectNumber();
      res.json({ nextProjectNumber: next });
    } catch (error) {
      res.status(500).json({ message: "Failed to get next project number" });
    }
  });

  app.get("/api/quotations", isAuthenticated, async (_req, res) => {
    try {
      const quots = await storage.getQuotations();
      res.json(quots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  app.get("/api/quotations/:id", isAuthenticated, async (req, res) => {
    try {
      const quot = await storage.getQuotation(parseInt(req.params.id as string));
      if (!quot) return res.status(404).json({ message: "Not found" });
      const items = await storage.getQuotationItems(quot.id);
      const client = await storage.getClient(quot.clientId);
      res.json({ ...quot, items, client });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });

  app.get("/api/quotations/project/:projectNumber", isAuthenticated, async (req, res) => {
    try {
      const quot = await storage.getQuotationByProject(parseInt(req.params.projectNumber as string));
      if (!quot) return res.status(404).json({ message: "Not found" });
      const items = await storage.getQuotationItems(quot.id);
      const client = await storage.getClient(quot.clientId);
      res.json({ ...quot, items, client });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });

  app.post("/api/quotations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can create quotations" });
      }

      const { items, ...quotData } = req.body;
      const quotation = await storage.createQuotation(quotData);

      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createQuotationItem({ ...item, quotationId: quotation.id });
        }
      }

      const createdItems = await storage.getQuotationItems(quotation.id);
      res.json({ ...quotation, items: createdItems });
    } catch (error: any) {
      if (error?.code === "23505") {
        return res.status(409).json({ message: "Project number already exists" });
      }
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });

  app.delete("/api/quotations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteQuotation(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quotation" });
    }
  });

  app.get("/api/purchase-orders", isAuthenticated, async (_req, res) => {
    try {
      const pos = await storage.getPurchaseOrders();
      res.json(pos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  app.get("/api/purchase-orders/project/:projectNumber", isAuthenticated, async (req, res) => {
    try {
      const po = await storage.getPOByProject(parseInt(req.params.projectNumber as string));
      if (!po) return res.status(404).json({ message: "Not found" });
      const client = await storage.getClient(po.clientId);
      res.json({ ...po, client });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });

  app.get("/api/purchase-orders/:id", isAuthenticated, async (req, res) => {
    try {
      const po = await storage.getPurchaseOrder(parseInt(req.params.id as string));
      if (!po) return res.status(404).json({ message: "Not found" });
      const client = await storage.getClient(po.clientId);
      res.json({ ...po, client });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });

  app.post("/api/purchase-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const po = await storage.createPurchaseOrder(req.body);
      res.json(po);
    } catch (error) {
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });

  app.get("/api/work-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      let wos: any[];
      if (user.role === "technician") {
        wos = await storage.getWorkOrdersByTechnician(userId);
      } else {
        wos = await storage.getWorkOrders();
      }
      res.json(wos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work orders" });
    }
  });

  app.get("/api/work-orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const wo = await storage.getWorkOrder(parseInt(req.params.id));
      if (!wo) return res.status(404).json({ message: "Not found" });

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (user?.role === "technician" && wo.assignedToId !== userId) {
        return res.status(403).json({ message: "Not assigned to you" });
      }

      const items = await storage.getWoItems(wo.id);
      const expenditures = await storage.getTechExpenditures(wo.id);
      const client = await storage.getClient(wo.clientId);
      res.json({ ...wo, items, expenditures, client });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work order" });
    }
  });

  app.get("/api/work-orders/project/:projectNumber", isAuthenticated, async (req, res) => {
    try {
      const wo = await storage.getWOByProject(parseInt(req.params.projectNumber as string));
      if (!wo) return res.status(404).json({ message: "Not found" });
      const items = await storage.getWoItems(wo.id);
      const client = await storage.getClient(wo.clientId);
      res.json({ ...wo, items, client });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work order" });
    }
  });

  app.post("/api/work-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { items, ...woData } = req.body;
      const workOrder = await storage.createWorkOrder(woData);

      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createWoItem({ ...item, workOrderId: workOrder.id });
        }
      }

      const createdItems = await storage.getWoItems(workOrder.id);
      res.json({ ...workOrder, items: createdItems });
    } catch (error: any) {
      if (error?.code === "23505") {
        return res.status(409).json({ message: "Project number already exists for work orders" });
      }
      res.status(500).json({ message: "Failed to create work order" });
    }
  });

  app.patch("/api/work-orders/:id/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const wo = await storage.getWorkOrder(parseInt(req.params.id));
      if (!wo) return res.status(404).json({ message: "Not found" });
      if (wo.assignedToId !== userId) {
        return res.status(403).json({ message: "Not assigned to you" });
      }
      const updated = await storage.updateWorkOrder(wo.id, { status: "processing" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to accept work order" });
    }
  });

  app.patch("/api/work-orders/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const wo = await storage.getWorkOrder(parseInt(req.params.id));
      if (!wo) return res.status(404).json({ message: "Not found" });
      if (wo.assignedToId !== userId) {
        return res.status(403).json({ message: "Not assigned to you" });
      }
      const { expenditures } = req.body;
      let totalCost = 0;

      if (Array.isArray(expenditures) && expenditures.length > 0) {
        await storage.deleteTechExpenditures(wo.id);
        for (const item of expenditures) {
          if (item.description && item.amount >= 0) {
            await storage.createTechExpenditure({
              workOrderId: wo.id,
              description: item.description,
              amount: item.amount || 0,
            });
            totalCost += item.amount || 0;
          }
        }
      }

      const updated = await storage.updateWorkOrder(wo.id, {
        status: "completed",
        technicianCost: totalCost,
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete work order" });
    }
  });

  app.patch("/api/work-orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateWorkOrder(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update work order" });
    }
  });

  app.get("/api/invoices", isAuthenticated, async (_req, res) => {
    try {
      const invs = await storage.getInvoices();
      res.json(invs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const inv = await storage.getInvoice(parseInt(req.params.id as string));
      if (!inv) return res.status(404).json({ message: "Not found" });
      const items = await storage.getInvoiceItems(inv.id);
      const client = await storage.getClient(inv.clientId);
      res.json({ ...inv, items, client });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { items, ...invData } = req.body;
      const invoice = await storage.createInvoice(invData);

      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createInvoiceItem({ ...item, invoiceId: invoice.id });
        }
      }

      const createdItems = await storage.getInvoiceItems(invoice.id);
      res.json({ ...invoice, items: createdItems });
    } catch (error: any) {
      if (error?.code === "23505") {
        return res.status(409).json({ message: "Project number already exists for invoices" });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.delete("/api/invoices/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteInvoice(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  app.patch("/api/invoices/:id/mark-paid", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateInvoiceStatus(parseInt(req.params.id), "paid");
      if (!updated) return res.status(404).json({ message: "Invoice not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update invoice status" });
    }
  });

  app.get("/api/search", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const query = req.query.q as string || "";
      if (!query) return res.json({ quotations: [], workOrders: [], invoices: [], purchaseOrders: [] });
      const results = await storage.searchDocuments(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to search" });
    }
  });

  app.get("/api/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const data = await storage.getDashboardData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/project/:projectNumber", isAuthenticated, async (req, res) => {
    try {
      const pn = parseInt(req.params.projectNumber as string);
      const quotation = await storage.getQuotationByProject(pn);
      const po = await storage.getPOByProject(pn);
      const wo = await storage.getWOByProject(pn);
      const invoice = await storage.getInvoiceByProject(pn);

      let quotItems: any[] = [];
      let woItemsList: any[] = [];
      let invItems: any[] = [];
      let client: any = null;

      if (quotation) {
        quotItems = await storage.getQuotationItems(quotation.id);
        client = await storage.getClient(quotation.clientId);
      }
      if (wo) {
        woItemsList = await storage.getWoItems(wo.id);
        if (!client) client = await storage.getClient(wo.clientId);
      }
      if (invoice) {
        invItems = await storage.getInvoiceItems(invoice.id);
        if (!client) client = await storage.getClient(invoice.clientId);
      }
      if (po && !client) {
        client = await storage.getClient(po.clientId);
      }

      res.json({
        projectNumber: pn,
        client,
        quotation: quotation ? { ...quotation, items: quotItems } : null,
        purchaseOrder: po || null,
        workOrder: wo ? { ...wo, items: woItemsList } : null,
        invoice: invoice ? { ...invoice, items: invItems } : null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project data" });
    }
  });

  return httpServer;
}

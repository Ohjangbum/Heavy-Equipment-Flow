import {
  type User,
  type UpsertUser,
  type Client,
  type InsertClient,
  type Quotation,
  type InsertQuotation,
  type QuotationItem,
  type InsertQuotationItem,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type WorkOrder,
  type InsertWorkOrder,
  type WoItem,
  type InsertWoItem,
  type TechExpenditure,
  type InsertTechExpenditure,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  users,
  clients,
  quotations,
  quotationItems,
  purchaseOrders,
  workOrders,
  woItems,
  techExpenditures,
  invoices,
  invoiceItems,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, ilike, or, sql, desc, max } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUserDisplayName(id: string, displayName: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  searchClients(query: string): Promise<Client[]>;

  getNextProjectNumber(): Promise<number>;

  getQuotations(): Promise<Quotation[]>;
  getQuotation(id: number): Promise<Quotation | undefined>;
  getQuotationByProject(projectNumber: number): Promise<Quotation | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: number, data: Partial<InsertQuotation>): Promise<Quotation | undefined>;
  deleteQuotation(id: number): Promise<void>;

  getQuotationItems(quotationId: number): Promise<QuotationItem[]>;
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  deleteQuotationItems(quotationId: number): Promise<void>;

  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined>;
  getPOByProject(projectNumber: number): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder>;

  getWorkOrders(): Promise<WorkOrder[]>;
  getWorkOrder(id: number): Promise<WorkOrder | undefined>;
  getWOByProject(projectNumber: number): Promise<WorkOrder | undefined>;
  getWorkOrdersByTechnician(userId: string): Promise<WorkOrder[]>;
  createWorkOrder(wo: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: number, data: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined>;

  getWoItems(workOrderId: number): Promise<WoItem[]>;
  createWoItem(item: InsertWoItem): Promise<WoItem>;
  deleteWoItems(workOrderId: number): Promise<void>;

  getTechExpenditures(workOrderId: number): Promise<TechExpenditure[]>;
  createTechExpenditure(item: InsertTechExpenditure): Promise<TechExpenditure>;
  deleteTechExpenditures(workOrderId: number): Promise<void>;

  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByProject(projectNumber: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<void>;
  updateInvoiceStatus(id: number, status: string): Promise<Invoice>;

  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  deleteInvoiceItems(invoiceId: number): Promise<void>;

  searchDocuments(query: string): Promise<{
    quotations: Quotation[];
    workOrders: WorkOrder[];
    invoices: Invoice[];
    purchaseOrders: PurchaseOrder[];
  }>;

  getDashboardData(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async updateUserDisplayName(id: string, displayName: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ displayName, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.createdAt);
  }

  async getClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [created] = await db.insert(clients).values(client).returning();
    return created;
  }

  async searchClients(query: string): Promise<Client[]> {
    return db.select().from(clients).where(ilike(clients.name, `%${query}%`));
  }

  async getNextProjectNumber(): Promise<number> {
    const result = await db.select({ maxNum: max(quotations.projectNumber) }).from(quotations);
    const currentMax = result[0]?.maxNum || 9999;
    return currentMax + 1;
  }

  async getQuotations(): Promise<Quotation[]> {
    return db.select().from(quotations).orderBy(desc(quotations.createdAt));
  }

  async getQuotation(id: number): Promise<Quotation | undefined> {
    const [q] = await db.select().from(quotations).where(eq(quotations.id, id));
    return q || undefined;
  }

  async getQuotationByProject(projectNumber: number): Promise<Quotation | undefined> {
    const [q] = await db.select().from(quotations).where(eq(quotations.projectNumber, projectNumber));
    return q || undefined;
  }

  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const [created] = await db.insert(quotations).values(quotation).returning();
    return created;
  }

  async updateQuotation(id: number, data: Partial<InsertQuotation>): Promise<Quotation | undefined> {
    const [updated] = await db.update(quotations).set(data).where(eq(quotations.id, id)).returning();
    return updated || undefined;
  }

  async deleteQuotation(id: number): Promise<void> {
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
    await db.delete(quotations).where(eq(quotations.id, id));
  }

  async getQuotationItems(quotationId: number): Promise<QuotationItem[]> {
    return db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
  }

  async createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem> {
    const [created] = await db.insert(quotationItems).values(item).returning();
    return created;
  }

  async deleteQuotationItems(quotationId: number): Promise<void> {
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
  }

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
  }

  async getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined> {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return po || undefined;
  }

  async getPOByProject(projectNumber: number): Promise<PurchaseOrder | undefined> {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.projectNumber, projectNumber));
    return po || undefined;
  }

  async createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [created] = await db.insert(purchaseOrders).values(po).returning();
    return created;
  }

  async getWorkOrders(): Promise<WorkOrder[]> {
    return db.select().from(workOrders).orderBy(desc(workOrders.createdAt));
  }

  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, id));
    return wo || undefined;
  }

  async getWOByProject(projectNumber: number): Promise<WorkOrder | undefined> {
    const [wo] = await db.select().from(workOrders).where(eq(workOrders.projectNumber, projectNumber));
    return wo || undefined;
  }

  async getWorkOrdersByTechnician(userId: string): Promise<WorkOrder[]> {
    return db.select().from(workOrders).where(eq(workOrders.assignedToId, userId)).orderBy(desc(workOrders.createdAt));
  }

  async createWorkOrder(wo: InsertWorkOrder): Promise<WorkOrder> {
    const [created] = await db.insert(workOrders).values(wo).returning();
    return created;
  }

  async updateWorkOrder(id: number, data: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const [updated] = await db.update(workOrders).set(data).where(eq(workOrders.id, id)).returning();
    return updated || undefined;
  }

  async getWoItems(workOrderId: number): Promise<WoItem[]> {
    return db.select().from(woItems).where(eq(woItems.workOrderId, workOrderId));
  }

  async createWoItem(item: InsertWoItem): Promise<WoItem> {
    const [created] = await db.insert(woItems).values(item).returning();
    return created;
  }

  async deleteWoItems(workOrderId: number): Promise<void> {
    await db.delete(woItems).where(eq(woItems.workOrderId, workOrderId));
  }

  async getTechExpenditures(workOrderId: number): Promise<TechExpenditure[]> {
    return db.select().from(techExpenditures).where(eq(techExpenditures.workOrderId, workOrderId));
  }

  async createTechExpenditure(item: InsertTechExpenditure): Promise<TechExpenditure> {
    const [created] = await db.insert(techExpenditures).values(item).returning();
    return created;
  }

  async deleteTechExpenditures(workOrderId: number): Promise<void> {
    await db.delete(techExpenditures).where(eq(techExpenditures.workOrderId, workOrderId));
  }

  async getInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
    return inv || undefined;
  }

  async getInvoiceByProject(projectNumber: number): Promise<Invoice | undefined> {
    const [inv] = await db.select().from(invoices).where(eq(invoices.projectNumber, projectNumber));
    return inv || undefined;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(invoice).returning();
    return created;
  }

  async updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updated] = await db.update(invoices).set(data).where(eq(invoices.id, id)).returning();
    return updated || undefined;
  }

  async deleteInvoice(id: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async updateInvoiceStatus(id: number, status: string): Promise<Invoice> {
    const [updated] = await db.update(invoices).set({ status }).where(eq(invoices.id, id)).returning();
    return updated;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [created] = await db.insert(invoiceItems).values(item).returning();
    return created;
  }

  async deleteInvoiceItems(invoiceId: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async searchDocuments(query: string): Promise<{
    quotations: Quotation[];
    workOrders: WorkOrder[];
    invoices: Invoice[];
    purchaseOrders: PurchaseOrder[];
  }> {
    const num = parseInt(query);
    const isNumber = !isNaN(num);

    const matchingClients = await this.searchClients(query);
    const clientIds = matchingClients.map(c => c.id);

    let quots: Quotation[] = [];
    let wos: WorkOrder[] = [];
    let invs: Invoice[] = [];
    let pos: PurchaseOrder[] = [];

    if (isNumber) {
      quots = await db.select().from(quotations).where(eq(quotations.projectNumber, num));
      wos = await db.select().from(workOrders).where(eq(workOrders.projectNumber, num));
      invs = await db.select().from(invoices).where(eq(invoices.projectNumber, num));
      pos = await db.select().from(purchaseOrders).where(eq(purchaseOrders.projectNumber, num));
    }

    if (clientIds.length > 0) {
      for (const cid of clientIds) {
        const cQuots = await db.select().from(quotations).where(eq(quotations.clientId, cid));
        const cWos = await db.select().from(workOrders).where(eq(workOrders.clientId, cid));
        const cInvs = await db.select().from(invoices).where(eq(invoices.clientId, cid));
        const cPos = await db.select().from(purchaseOrders).where(eq(purchaseOrders.clientId, cid));
        quots = [...quots, ...cQuots];
        wos = [...wos, ...cWos];
        invs = [...invs, ...cInvs];
        pos = [...pos, ...cPos];
      }
    }

    const uniqueById = <T extends { id: number }>(arr: T[]) => {
      const map = new Map<number, T>();
      arr.forEach(item => map.set(item.id, item));
      return Array.from(map.values());
    };

    return {
      quotations: uniqueById(quots),
      workOrders: uniqueById(wos),
      invoices: uniqueById(invs),
      purchaseOrders: uniqueById(pos),
    };
  }

  async getDashboardData(): Promise<any[]> {
    const allQuots = await this.getQuotations();
    const allWos = await this.getWorkOrders();
    const allInvs = await this.getInvoices();
    const allClients = await this.getClients();

    const clientMap = new Map(allClients.map(c => [c.id, c]));

    const projectNumbers = new Set([
      ...allQuots.map(q => q.projectNumber),
      ...allWos.map(w => w.projectNumber),
      ...allInvs.map(i => i.projectNumber),
    ]);

    const projects = Array.from(projectNumbers).map(pn => {
      const quot = allQuots.find(q => q.projectNumber === pn);
      const wo = allWos.find(w => w.projectNumber === pn);
      const inv = allInvs.find(i => i.projectNumber === pn);
      const clientId = quot?.clientId || wo?.clientId || inv?.clientId;
      const client = clientId ? clientMap.get(clientId) : undefined;

      const quoteAmount = quot?.total || 0;
      const woBudget = wo?.totalBudget || 0;
      const techCost = wo?.technicianCost || 0;
      const profitLoss = quoteAmount - techCost - woBudget;

      return {
        projectNumber: pn,
        clientName: client?.name || "Unknown",
        clientId,
        quotation: quot ? `QUO/${pn}` : null,
        quotationId: quot?.id,
        woStatus: wo?.status || null,
        workOrderId: wo?.id,
        invoiceId: inv?.id,
        invoice: inv ? `INV/${pn}` : null,
        invoiceStatus: inv?.status || null,
        quoteAmount,
        woBudget,
        technicianCost: techCost,
        profitLoss,
        createdAt: quot?.createdAt || wo?.createdAt || inv?.createdAt,
      };
    });

    return projects.sort((a, b) => b.projectNumber - a.projectNumber);
  }
}

export const storage = new DatabaseStorage();

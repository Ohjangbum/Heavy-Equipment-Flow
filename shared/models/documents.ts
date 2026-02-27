import { pgTable, serial, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  projectNumber: integer("project_number").notNull().unique(),
  clientId: integer("client_id").notNull(),
  date: text("date").notNull(),
  equipmentDescription: text("equipment_description"),
  subtotal: integer("subtotal").notNull().default(0),
  total: integer("total").notNull().default(0),
  bankChoice: text("bank_choice").notNull().default("maybank"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unit: text("unit").notNull().default("pcs"),
  unitPrice: integer("unit_price").notNull().default(0),
  amount: integer("amount").notNull().default(0),
  notes: text("notes"),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: text("po_number").notNull(),
  projectNumber: integer("project_number").notNull(),
  clientId: integer("client_id").notNull(),
  dateReceived: text("date_received").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  projectNumber: integer("project_number").notNull().unique(),
  clientId: integer("client_id").notNull(),
  orderDate: text("order_date").notNull(),
  completionDate: text("completion_date"),
  customerName: text("customer_name").notNull(),
  siteUnit: text("site_unit"),
  technicianNames: text("technician_names"),
  machineSn: text("machine_sn"),
  hoursMeter: text("hours_meter"),
  departments: text("departments"),
  jobDescription: text("job_description").notNull(),
  status: text("status").notNull().default("assigned"),
  totalBudget: integer("total_budget").notNull().default(0),
  technicianCost: integer("technician_cost").default(0),
  assignedToId: varchar("assigned_to_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const woItems = pgTable("wo_items", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull().default(0),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  projectNumber: integer("project_number").notNull().unique(),
  clientId: integer("client_id").notNull(),
  date: text("date").notNull(),
  poNumber: text("po_number"),
  subtotal: integer("subtotal").notNull().default(0),
  total: integer("total").notNull().default(0),
  bankChoice: text("bank_choice").notNull().default("maybank"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unit: text("unit").notNull().default("pcs"),
  unitPrice: integer("unit_price").notNull().default(0),
  amount: integer("amount").notNull().default(0),
  notes: text("notes"),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  quotations: many(quotations),
  purchaseOrders: many(purchaseOrders),
  workOrders: many(workOrders),
  invoices: many(invoices),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  client: one(clients, { fields: [quotations.clientId], references: [clients.id] }),
  items: many(quotationItems),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, { fields: [quotationItems.quotationId], references: [quotations.id] }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one }) => ({
  client: one(clients, { fields: [purchaseOrders.clientId], references: [clients.id] }),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  client: one(clients, { fields: [workOrders.clientId], references: [clients.id] }),
  items: many(woItems),
}));

export const woItemsRelations = relations(woItems, ({ one }) => ({
  workOrder: one(workOrders, { fields: [woItems.workOrderId], references: [workOrders.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
}));

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertQuotationSchema = createInsertSchema(quotations).omit({ id: true, createdAt: true });
export const insertQuotationItemSchema = createInsertSchema(quotationItems).omit({ id: true });
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({ id: true, createdAt: true });
export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({ id: true, createdAt: true });
export const insertWoItemSchema = createInsertSchema(woItems).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WoItem = typeof woItems.$inferSelect;
export type InsertWoItem = z.infer<typeof insertWoItemSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

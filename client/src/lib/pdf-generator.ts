import jsPDF from "jspdf";
import "jspdf-autotable";
import { COMPANY, BANK_ACCOUNTS, formatNumber } from "./constants";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

function addHeader(doc: jsPDF, title: string, docNumber: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, 14, 20);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.address, 14, 26);
  doc.text(COMPANY.district, 14, 31);
  doc.text(`Email: ${COMPANY.email}`, 14, 36);
  doc.text(COMPANY.npwp, 14, 41);

  doc.setLineWidth(0.5);
  doc.line(14, 45, pageWidth - 14, 45);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 55, { align: "center" });

  if (docNumber) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(docNumber, pageWidth - 14, 55, { align: "right" });
  }

  return 60;
}

function addBankAndSignature(doc: jsPDF, bankChoice: string, startY: number) {
  const bank = BANK_ACCOUNTS.find(b => b.id === bankChoice) || BANK_ACCOUNTS[0];
  let y = startY + 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DETAIL PEMBAYARAN", 14, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.text(`NAMA BANK:`, 14, y);
  doc.text(bank.bankName, 55, y);
  y += 5;
  doc.text(`CABANG BANK:`, 14, y);
  doc.text(bank.branch, 55, y);
  y += 5;
  doc.text(`NOMOR AKUN BANK:`, 14, y);
  doc.text(bank.accountNumber, 55, y);
  y += 5;
  doc.text(`ATAS NAMA:`, 14, y);
  doc.text(bank.accountHolder, 55, y);

  const pageWidth = doc.internal.pageSize.getWidth();
  const sigX = pageWidth - 60;

  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.name, sigX, startY + 16, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.director, sigX, startY + 45, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.directorTitle, sigX, startY + 50, { align: "center" });
}

export function generateQuotationPDF(data: any) {
  const doc = new jsPDF();
  let y = addHeader(doc, "QUOTATION", "");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`No Quotation     : ${data.projectNumber}`, 14, y + 5);
  doc.text(`Tanggal          : ${data.date}`, 14, y + 11);
  doc.text(`Kepada           : ${data.client?.name || ""}`, 14, y + 17);

  y += 24;

  if (data.equipmentDescription) {
    doc.setFontSize(9);
    doc.text(
      `Berikut Penawaran Material dan Jasa Perbaikan ${data.equipmentDescription} dengan rincian sebagai berikut :`,
      14, y
    );
    y += 8;
  }

  const materialItems = data.items?.filter((i: any) => i.category === "material") || [];
  const serviceItems = data.items?.filter((i: any) => i.category === "service") || [];

  const allRows: any[] = [];

  if (materialItems.length > 0) {
    allRows.push([{ content: "A", styles: { fontStyle: "bold" } }, { content: "Material", styles: { fontStyle: "bold" } }, "", "", "", "", ""]);
    materialItems.forEach((item: any, idx: number) => {
      allRows.push([
        idx + 1,
        item.description,
        item.quantity,
        item.unit,
        `Rp ${formatNumber(item.unitPrice)}`,
        `Rp ${formatNumber(item.amount)}`,
        item.notes || "",
      ]);
    });
  }

  if (serviceItems.length > 0) {
    allRows.push([{ content: "B", styles: { fontStyle: "bold" } }, { content: "Jasa", styles: { fontStyle: "bold" } }, "", "", "", "", ""]);
    serviceItems.forEach((item: any, idx: number) => {
      allRows.push([
        idx + 1,
        item.description,
        item.quantity,
        item.unit,
        `Rp ${formatNumber(item.unitPrice)}`,
        `Rp ${formatNumber(item.amount)}`,
        item.notes || "",
      ]);
    });
  }

  doc.autoTable({
    startY: y,
    head: [["NO", "URAIAN", "VOL", "STN", "HARGA SATUAN", "JUMLAH", "KET"]],
    body: allRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { halign: "center", cellWidth: 12 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "right", cellWidth: 30 },
      5: { halign: "right", cellWidth: 30 },
      6: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 2;

  doc.autoTable({
    startY: y,
    body: [
      ["", "", "", "", { content: "SUBTOTAL", styles: { fontStyle: "bold", halign: "right" } }, { content: `Rp ${formatNumber(data.subtotal)}`, styles: { halign: "right" } }, ""],
      ["", "", "", "", { content: "TOTAL", styles: { fontStyle: "bold", halign: "right" } }, { content: `Rp ${formatNumber(data.total)}`, styles: { fontStyle: "bold", halign: "right" } }, ""],
    ],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 12 },
      3: { cellWidth: 12 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
      6: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY;
  addBankAndSignature(doc, data.bankChoice, y);

  doc.save(`Quotation_QUO_${data.projectNumber}.pdf`);
}

export function generateInvoicePDF(data: any) {
  const doc = new jsPDF();
  let y = addHeader(doc, "INVOICE", "");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Nomor Invoice : ${data.projectNumber}`, 14, y + 5);
  doc.text(`Tanggal       : ${data.date}`, 14, y + 11);
  doc.text(`Kepada         : ${data.client?.name || ""}`, 14, y + 17);

  if (data.poNumber) {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text(`NO PO ${data.poNumber}`, pageWidth - 14, y + 5, { align: "right" });
  }

  y += 24;

  doc.setFontSize(9);
  doc.text("Mohon dilakukan pembayaran Material dan Pekerjaan dengan rincian sebagai berikut :", 14, y);
  y += 8;

  const allRows: any[] = [];
  const materialItems = data.items?.filter((i: any) => i.category === "material") || [];
  const serviceItems = data.items?.filter((i: any) => i.category !== "material") || [];

  if (materialItems.length > 0) {
    allRows.push([{ content: "A", styles: { fontStyle: "bold" } }, { content: "Material", styles: { fontStyle: "bold" } }, "", "", "", "", ""]);
    materialItems.forEach((item: any, idx: number) => {
      allRows.push([idx + 1, item.description, item.quantity, item.unit, `Rp ${formatNumber(item.unitPrice)}`, `Rp ${formatNumber(item.amount)}`, item.notes || ""]);
    });
  }

  if (serviceItems.length > 0) {
    allRows.push([{ content: "B", styles: { fontStyle: "bold" } }, { content: "Jasa", styles: { fontStyle: "bold" } }, "", "", "", "", ""]);
    serviceItems.forEach((item: any, idx: number) => {
      allRows.push([idx + 1, item.description, item.quantity, item.unit, `Rp ${formatNumber(item.unitPrice)}`, `Rp ${formatNumber(item.amount)}`, item.notes || ""]);
    });
  }

  if (allRows.length === 0 && data.items) {
    data.items.forEach((item: any, idx: number) => {
      allRows.push([idx + 1, item.description, item.quantity, item.unit, `Rp ${formatNumber(item.unitPrice)}`, `Rp ${formatNumber(item.amount)}`, item.notes || ""]);
    });
  }

  doc.autoTable({
    startY: y,
    head: [["NO", "URAIAN", "VOL", "STN", "HARGA SATUAN", "JUMLAH", "KET"]],
    body: allRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { halign: "center", cellWidth: 12 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "right", cellWidth: 30 },
      5: { halign: "right", cellWidth: 30 },
      6: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 2;

  doc.autoTable({
    startY: y,
    body: [
      ["", "", "", "", { content: "SUBTOTAL", styles: { fontStyle: "bold", halign: "right" } }, { content: `Rp ${formatNumber(data.subtotal)}`, styles: { halign: "right" } }, ""],
      ["", "", "", "", "", { content: `Rp -`, styles: { halign: "right" } }, ""],
      ["", "", "", "", { content: "TOTAL", styles: { fontStyle: "bold", halign: "right" } }, { content: `Rp ${formatNumber(data.total)}`, styles: { fontStyle: "bold", halign: "right" } }, ""],
    ],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 12 },
      3: { cellWidth: 12 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
      6: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY;
  addBankAndSignature(doc, data.bankChoice, y);

  doc.save(`Invoice_INV_${data.projectNumber}.pdf`);
}

export function generateWorkOrderPDF(data: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("WORK ORDER", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text(String(data.projectNumber), pageWidth - 14, 20, { align: "right" });

  doc.setLineWidth(0.3);
  doc.line(14, 25, pageWidth - 14, 25);

  let y = 30;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  const infoTable = [
    [`Tgl Order    : ${data.orderDate}`, `Tgl Selesai : ${data.completionDate || ""}`, `Kepada :    ${data.departments || ""}`],
    [`Customer Name  : ${data.customerName}`, "", ""],
    [`Site Unit        : ${data.siteUnit || ""}`, `Teknisi : ${data.technicianNames || ""}`, ""],
    [`Machine /SN : ${data.machineSn || ""}`, "", ""],
    [`Hours Meter :  ${data.hoursMeter || ""}`, "", ""],
  ];

  doc.autoTable({
    startY: y,
    body: infoTable,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 },
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Job : ${data.jobDescription}`, 14, y);
  y += 10;

  const costRows = data.items?.map((item: any) => [
    item.description,
    "Rp",
    formatNumber(item.amount),
  ]) || [];

  costRows.push([
    { content: "TOTAL", styles: { fontStyle: "bold", halign: "right" } },
    { content: "Rp", styles: { fontStyle: "bold" } },
    { content: formatNumber(data.totalBudget), styles: { fontStyle: "bold", halign: "right" } },
  ]);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Kebutuhan Material", 14, y);
  doc.text("Biaya", pageWidth - 30, y, { align: "right" });
  y += 4;

  doc.autoTable({
    startY: y,
    body: costRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 15, halign: "left" },
      2: { cellWidth: 35, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Tanda Tangan", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.autoTable({
    startY: y,
    body: [
      [
        { content: "Teknisi", styles: { halign: "center", fontStyle: "bold" } },
        { content: "Diperiksa", styles: { halign: "center", fontStyle: "bold" } },
        { content: "Disetujui", styles: { halign: "center", fontStyle: "bold" } },
      ],
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 8 },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Status Job", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.autoTable({
    startY: y,
    body: [[
      { content: "Open", styles: { halign: "center", fontStyle: data.status === "assigned" ? "bold" : "normal" } },
      { content: "On Progress", styles: { halign: "center", fontStyle: data.status === "processing" ? "bold" : "normal" } },
      { content: "Closed", styles: { halign: "center", fontStyle: data.status === "completed" ? "bold" : "normal" } },
    ]],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 4 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`WorkOrder_WO_${data.projectNumber}.pdf`);
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Sale, Product, CompanySettings, ReportFilters } from '@/types';
import { formatCurrency, formatDate } from './utils';

interface InvoiceData {
  sale: Sale;
  company: CompanySettings;
  appName: string;
}

// Generate Invoice PDF
export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const { sale, company, appName } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Company Logo/Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(company.address, 14, 28);
  doc.text(`${company.phone} | ${company.email}`, 14, 34);
  
  // Invoice Title
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', pageWidth - 14, 20, { align: 'right' });
  
  // Invoice Details
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N°: ${sale.invoiceNumber}`, pageWidth - 14, 28, { align: 'right' });
  doc.text(`Date: ${formatDate(sale.createdAt)}`, pageWidth - 14, 34, { align: 'right' });
  
  // Bill To
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURÉ À:', 14, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (sale.customer) {
    doc.text(sale.customer.name, 14, 62);
    if (sale.customer.address) doc.text(sale.customer.address, 14, 68);
    if (sale.customer.phone) doc.text(sale.customer.phone, 14, 74);
    if (sale.customer.email) doc.text(sale.customer.email, 14, 80);
  } else {
    doc.text('Client comptant', 14, 62);
  }
  
  // Items Table
  const tableData = sale.items.map((item) => [
    item.product?.name || 'Produit inconnu',
    item.quantity.toString(),
    formatCurrency(item.unitPrice, company.currency),
    formatCurrency(item.total, company.currency),
  ]);
  
  autoTable(doc, {
    startY: 90,
    head: [['Produit', 'Qté', 'Prix unitaire', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  });
  
  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalsX = pageWidth - 80;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sous-total:', totalsX, finalY);
  doc.text(formatCurrency(sale.subtotal, company.currency), pageWidth - 14, finalY, { align: 'right' });
  
  doc.text(`TVA (${company.vatRate}%):`, totalsX, finalY + 7);
  doc.text(formatCurrency(sale.vatAmount, company.currency), pageWidth - 14, finalY + 7, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', totalsX, finalY + 18);
  doc.text(formatCurrency(sale.total, company.currency), pageWidth - 14, finalY + 18, { align: 'right' });
  
  // Payment Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mode de paiement: ${getPaymentMethodLabel(sale.paymentMethod)}`, 14, finalY + 35);
  doc.text(`Vendeur: ${sale.seller?.name || 'N/A'}`, 14, finalY + 42);
  
  // Footer
  doc.setFillColor(240, 240, 240);
  doc.rect(0, doc.internal.pageSize.height - 30, pageWidth, 30, 'F');
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text(`Généré par ${appName}`, pageWidth / 2, doc.internal.pageSize.height - 18, { align: 'center' });
  doc.text('Merci pour votre confiance!', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  
  return doc;
}

// Generate Sales Report PDF
export function generateSalesReportPDF(
  sales: Sale[],
  company: CompanySettings,
  filters: ReportFilters,
  locale: string = 'fr-FR'
): jsPDF {
  const doc = new jsPDF('l');
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT DES VENTES', 14, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const periodText = filters.startDate && filters.endDate
    ? `Période: ${formatDate(filters.startDate, locale)} - ${formatDate(filters.endDate, locale)}`
    : `Généré le: ${formatDate(new Date(), locale)}`;
  doc.text(periodText, 14, 26);
  
  // Summary
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalItems = sales.reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé', 14, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total des ventes: ${totalSales}`, 14, 53);
  doc.text(`Revenu total: ${formatCurrency(totalRevenue, company.currency)}`, 14, 60);
  doc.text(`Articles vendus: ${totalItems}`, 14, 67);
  
  // Sales Table
  const tableData = sales.map((sale) => [
    sale.invoiceNumber,
    formatDate(sale.createdAt, locale),
    sale.customer?.name || 'Client comptant',
    sale.seller?.name || 'N/A',
    sale.items.length.toString(),
    formatCurrency(sale.subtotal, company.currency),
    formatCurrency(sale.vatAmount, company.currency),
    formatCurrency(sale.total, company.currency),
    getPaymentMethodLabel(sale.paymentMethod),
  ]);
  
  autoTable(doc, {
    startY: 80,
    head: [['N° Facture', 'Date', 'Client', 'Vendeur', 'Articles', 'Sous-total', 'TVA', 'Total', 'Paiement']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
  });
  
  return doc;
}

// Generate Inventory Report PDF
export function generateInventoryReportPDF(
  products: Product[],
  company: CompanySettings,
  locale: string = 'fr-FR'
): jsPDF {
  const doc = new jsPDF('l');
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("RAPPORT D'INVENTAIRE", 14, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le: ${formatDate(new Date(), locale)}`, 14, 26);
  
  // Summary
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0);
  const lowStockCount = products.filter((p) => p.quantity <= p.minQuantity).length;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé', 14, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total des produits: ${totalProducts}`, 14, 53);
  doc.text(`Valeur totale: ${formatCurrency(totalValue, company.currency)}`, 14, 60);
  doc.text(`Produits en alerte: ${lowStockCount}`, 14, 67);
  
  // Products Table
  const tableData = products.map((product) => [
    product.sku,
    product.name,
    product.category?.name || 'N/A',
    product.quantity.toString(),
    product.minQuantity.toString(),
    getStockStatus(product.quantity, product.minQuantity),
    formatCurrency(product.purchasePrice, company.currency),
    formatCurrency(product.salePrice, company.currency),
    formatCurrency(product.purchasePrice * product.quantity, company.currency),
  ]);
  
  autoTable(doc, {
    startY: 80,
    head: [['SKU', 'Produit', 'Catégorie', 'Stock', 'Min', 'Statut', 'Prix achat', 'Prix vente', 'Valeur']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
  });
  
  return doc;
}

// Generate Profit Report PDF
export function generateProfitReportPDF(
  sales: Sale[],
  products: Product[],
  company: CompanySettings,
  filters: ReportFilters,
  locale: string = 'fr-FR'
): jsPDF {
  const doc = new jsPDF('l');
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT DES BÉNÉFICES', 14, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const periodText = filters.startDate && filters.endDate
    ? `Période: ${formatDate(filters.startDate, locale)} - ${formatDate(filters.endDate, locale)}`
    : `Généré le: ${formatDate(new Date(), locale)}`;
  doc.text(periodText, 14, 26);
  
  // Calculate profits
  let totalRevenue = 0;
  let totalCost = 0;
  
  sales.forEach((sale) => {
    if (sale.status === 'completed') {
      totalRevenue += sale.total;
      sale.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          totalCost += product.purchasePrice * item.quantity;
        }
      });
    }
  });
  
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  
  // Summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé', 14, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Revenu total: ${formatCurrency(totalRevenue, company.currency)}`, 14, 53);
  doc.text(`Coût total: ${formatCurrency(totalCost, company.currency)}`, 14, 60);
  doc.text(`Bénéfice total: ${formatCurrency(totalProfit, company.currency)}`, 14, 67);
  doc.text(`Marge bénéficiaire: ${profitMargin.toFixed(2)}%`, 14, 74);
  
  // Sales with profit details
  const tableData = sales
    .filter((s) => s.status === 'completed')
    .map((sale) => {
      let cost = 0;
      sale.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          cost += product.purchasePrice * item.quantity;
        }
      });
      const profit = sale.total - cost;
      const margin = sale.total > 0 ? (profit / sale.total) * 100 : 0;
      
      return [
        sale.invoiceNumber,
        formatDate(sale.createdAt, locale),
        sale.customer?.name || 'Client comptant',
        formatCurrency(sale.total, company.currency),
        formatCurrency(cost, company.currency),
        formatCurrency(profit, company.currency),
        `${margin.toFixed(2)}%`,
      ];
    });
  
  autoTable(doc, {
    startY: 85,
    head: [['N° Facture', 'Date', 'Client', 'Revenu', 'Coût', 'Bénéfice', 'Marge']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
  });
  
  return doc;
}

// Generate Top Products Report PDF
export function generateTopProductsReportPDF(
  sales: Sale[],
  products: Product[],
  company: CompanySettings,
  locale: string = 'fr-FR'
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Calculate product sales
  const productSales: Record<string, { product: Product; quantity: number; revenue: number }> = {};
  
  sales.forEach((sale) => {
    if (sale.status === 'completed') {
      sale.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          if (productSales[item.productId]) {
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].revenue += item.total;
          } else {
            productSales[item.productId] = {
              product,
              quantity: item.quantity,
              revenue: item.total,
            };
          }
        }
      });
    }
  });
  
  const sortedProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
  
  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TOP PRODUITS', 14, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le: ${formatDate(new Date(), locale)}`, 14, 26);
  
  // Products Table
  const tableData = sortedProducts.map((item, index) => [
    (index + 1).toString(),
    item.product.sku,
    item.product.name,
    item.product.category?.name || 'N/A',
    item.quantity.toString(),
    formatCurrency(item.revenue, company.currency),
    formatCurrency(item.product.salePrice, company.currency),
  ]);
  
  autoTable(doc, {
    startY: 40,
    head: [['#', 'SKU', 'Produit', 'Catégorie', 'Qté vendue', 'Revenu', 'Prix']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
  });
  
  return doc;
}

// Helper functions
function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte',
    transfer: 'Virement',
    mixed: 'Mixte',
  };
  return labels[method] || method;
}

function getStockStatus(quantity: number, minQuantity: number): string {
  if (quantity === 0) return 'Rupture';
  if (quantity <= minQuantity) return 'Faible';
  return 'OK';
}

// Download PDF
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

// Print PDF
export function printPDF(doc: jsPDF): void {
  doc.autoPrint();
  doc.output('dataurlnewwindow');
}

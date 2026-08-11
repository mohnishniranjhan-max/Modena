import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a branded Modena Official Tax Invoice PDF document
 * and triggers an instant browser download.
 * 
 * @param {Object} order - Order object containing orderNumber, date, total, items, customer, paymentMethod
 * @param {Object} customerDetails - Fallback customer billing/shipping details
 */
export function generateInvoicePDF(order, customerDetails = {}) {
  const doc = new jsPDF();

  const orderNum = order.orderNumber || 'MOD-ORDER';
  const orderDate = order.date || new Date().toLocaleDateString();

  const customerName = order.customer?.firstName
    ? `${order.customer.firstName} ${order.customer.lastName || ''}`
    : typeof order.customer === 'string'
    ? order.customer
    : customerDetails.firstName
    ? `${customerDetails.firstName} ${customerDetails.lastName || ''}`
    : 'Valued Customer';

  const customerAddress = order.customer?.address || customerDetails.address || 'Address provided at checkout';
  const customerCity = order.customer?.city || customerDetails.city || '';
  const customerState = order.customer?.state || customerDetails.state || '';
  const customerPincode = order.customer?.postcode || customerDetails.postcode || '';
  const customerPhone = order.customer?.phone || customerDetails.phone || '';
  const customerEmail = order.customer?.email || customerDetails.email || '';

  // 1. BRAND HEADER (Modena Crimson Accent Bar)
  doc.setFillColor(183, 1, 0); // #E60000
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('MODENA CULINARY ARTS', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL TAX INVOICE / RECEIPT', 140, 18);

  // Company Details
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Modena Kitchenware Ltd.', 14, 38);
  doc.setFont('helvetica', 'normal');
  doc.text('Plot 42, Heritage Industrial Park, Koramangala', 14, 43);
  doc.text('Bengaluru, Karnataka - 560034, India', 14, 48);
  doc.text('GSTIN: 29AABCM9901Z1Z8 | Support: +91 (800) 555-MODENA', 14, 53);

  // Invoice & Order Metadata Box
  doc.setFillColor(248, 248, 248);
  doc.rect(130, 34, 66, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice No: INV-${orderNum}`, 134, 41);
  doc.text(`Order Date: ${orderDate}`, 134, 47);
  doc.text(`Payment: ${order.paymentMethod ? String(order.paymentMethod).toUpperCase() : 'ZOHO PAY / COD'}`, 134, 53);

  // Horizontal Divider Line
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 62, 196, 62);

  // 2. BILLED & SHIPPED TO ADDRESS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(183, 1, 0);
  doc.text('BILLED & SHIPPED TO:', 14, 70);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(customerName, 14, 76);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${customerAddress}, ${customerCity}`, 14, 82);
  doc.text(`${customerState} - ${customerPincode}, India`, 14, 87);
  doc.text(`Phone: ${customerPhone} | Email: ${customerEmail}`, 14, 92);

  // 3. TABLE OF LINE ITEMS
  const tableRows = (order.items || []).map((item, index) => {
    const qty = item.quantity || 1;
    const priceVal = typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
    const totalVal = priceVal * qty;
    return [
      index + 1,
      item.name || 'Modena Culinary Cookware Item',
      `INR ${priceVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      qty,
      `INR ${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    ];
  });

  autoTable(doc, {
    startY: 100,
    head: [['#', 'Item & Description', 'Unit Price', 'Qty', 'Total']],
    body: tableRows.length > 0 ? tableRows : [[1, 'Modena Culinary Cookware Item', 'INR 1,450.00', 1, 'INR 1,450.00']],
    theme: 'grid',
    headStyles: {
      fillColor: [183, 1, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 95 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 35, halign: 'right' }
    }
  });

  const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 140) + 10;

  // 4. FINANCIAL SUMMARY BOX
  const totalAmount = typeof order.total === 'number' ? order.total : parseFloat(String(order.total || 0).replace(/[^0-9.]/g, '')) || 1450;
  const subtotal = totalAmount / 1.18;
  const gstTax = totalAmount - subtotal;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text('Subtotal (Excl. Tax):', 130, finalY);
  doc.text(`INR ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, finalY, { align: 'right' });

  doc.text('IGST / CGST+SGST (18%):', 130, finalY + 6);
  doc.text(`INR ${gstTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, finalY + 6, { align: 'right' });

  doc.text('Shipping & Handling:', 130, finalY + 12);
  doc.text('FREE (Complimentary)', 196, finalY + 12, { align: 'right' });

  doc.setDrawColor(183, 1, 0);
  doc.line(130, finalY + 16, 196, finalY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(183, 1, 0);
  doc.text('Grand Total:', 130, finalY + 23);
  doc.text(`INR ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, finalY + 23, { align: 'right' });

  // 5. FOOTER & AUTHORIZED SIGNATURE
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 265, 196, 265);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for choosing Modena. For return requests or assistance, visit support.modena.local or call +91 (800) 555-MODENA.', 14, 272);
  doc.text('This is an official computer-generated tax invoice and does not require a physical signature.', 14, 277);

  // Trigger automatic download
  doc.save(`Modena_Invoice_${orderNum}.pdf`);
}

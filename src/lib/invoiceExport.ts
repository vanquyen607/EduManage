import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addVietnameseFont } from './pdfFonts';
import { Class, Invoice, InvoiceStatus, Student } from '@/src/types';
import { formatCurrency } from './utils';

export interface InvoiceExportOptions {
  students: Student[];
  classes: Class[];
  description?: string;
}

export function buildInvoiceRows(invoices: Invoice[], opts: InvoiceExportOptions): Record<string, any>[] {
  return invoices.map(inv => {
    const student = opts.students.find(s => s.id === inv.studentId);
    const cls = opts.classes.find(c => c.id === student?.classId);
    return {
      'Học sinh': student?.name || 'N/A',
      'Lớp': cls?.name || 'N/A',
      'Kỳ': `Tháng ${inv.month}/${inv.year}`,
      'Số buổi': inv.sessionCount,
      'Số tiền': inv.totalAmount,
      'Trạng thái': inv.status === InvoiceStatus.PAID ? 'Đã đóng' : 'Chờ thu',
      'Ngày tạo': inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('vi-VN') : '',
    };
  });
}

function slug(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '-');
}

function renderReceipt(doc: jsPDF, inv: Invoice, opts: InvoiceExportOptions) {
  const fontName = addVietnameseFont(doc);
  const font = fontName || 'helvetica';
  const setFont = (style: 'normal' | 'bold') => doc.setFont(font, fontName ? 'normal' : style);
  const student = opts.students.find(s => s.id === inv.studentId);
  const cls = opts.classes.find(c => c.id === student?.classId);
  const unitPrice = inv.sessionCount > 0 ? Math.round(inv.totalAmount / inv.sessionCount) : inv.totalAmount;
  const statusLabel = inv.status === InvoiceStatus.PAID ? 'Đã đóng' : 'Chờ thu';

  setFont('normal');
  doc.setFontSize(20);
  doc.text('PHIẾU THU HỌC PHÍ', 105, 22, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Mã hóa đơn: #${inv.id.slice(0, 8).toUpperCase()}`, 196, 30, { align: 'right' });
  doc.text(`Ngày tạo: ${inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('vi-VN') : ''}`, 14, 30);

  doc.setDrawColor(180);
  doc.line(14, 34, 196, 34);

  const rows: [string, string][] = [
    ['Học sinh', student?.name || 'N/A'],
    ['Lớp', cls?.name || 'N/A'],
    ['Phụ huynh', student?.parentName || 'N/A'],
    ['Kỳ học', `Tháng ${inv.month}/${inv.year}`],
    ['Số buổi có mặt', `${inv.sessionCount} buổi`],
    ['Đơn giá / buổi', formatCurrency(unitPrice)],
    ['Thành tiền', formatCurrency(inv.totalAmount)],
    ['Trạng thái', statusLabel],
    ['Ngày đóng', inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('vi-VN') : '—'],
  ];

  let y = 46;
  doc.setFontSize(11);
  for (const [label, value] of rows) {
    setFont('normal');
    doc.setTextColor(100);
    doc.text(label, 20, y);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(value, 80, y);
    doc.setFontSize(11);
    y += 9;
  }

  doc.setFillColor(240, 249, 255);
  doc.roundedRect(14, y + 2, 182, 14, 3, 3, 'F');
  doc.setFontSize(13);
  doc.text('TỔNG CỘNG', 20, y + 11);
  doc.text(formatCurrency(inv.totalAmount), 190, y + 11, { align: 'right' });

  const sigY = 250;
  doc.setFontSize(11);
  setFont('normal');
  doc.text('Người thu tiền', 50, sigY, { align: 'center' });
  doc.text('Phụ huynh học sinh', 150, sigY, { align: 'center' });
  doc.text('(Ký, ghi rõ họ tên)', 50, sigY + 6, { align: 'center' });
  doc.text('(Ký, ghi rõ họ tên)', 150, sigY + 6, { align: 'center' });
}

function renderTable(doc: jsPDF, invoices: Invoice[], opts: InvoiceExportOptions) {
  const fontName = addVietnameseFont(doc);
  const font = fontName || 'helvetica';
  const total = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalSessions = invoices.reduce((acc, i) => acc + i.sessionCount, 0);

  doc.setFont(font, 'normal');
  doc.setFontSize(18);
  doc.text('HÓA ĐƠN HỌC PHÍ - TỔNG HỢP', 105, 16, { align: 'center' });
  if (opts.description) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(opts.description, 105, 23, { align: 'center' });
    doc.setTextColor(0);
  }

  const body = buildInvoiceRows(invoices, opts).map((r, i) => [
    String(i + 1),
    r['Học sinh'],
    r['Lớp'],
    r['Kỳ'],
    String(r['Số buổi']),
    formatCurrency(r['Số tiền']),
    r['Trạng thái'],
  ]);
  body.push(['', 'TỔNG CỘNG', '', '', String(totalSessions), formatCurrency(total), '']);

  autoTable(doc, {
    head: [['#', 'Học sinh', 'Lớp', 'Kỳ', 'Số buổi', 'Số tiền', 'Trạng thái']],
    body,
    startY: opts.description ? 30 : 24,
    styles: { font, fontStyle: 'normal', fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [15, 23, 42], font, fontStyle: 'normal', textColor: [255, 255, 255] },
    footStyles: { fillColor: [241, 245, 249], font, fontStyle: 'normal', textColor: [15, 23, 42] },
    columnStyles: { 0: { cellWidth: 10 }, 4: { halign: 'center' }, 5: { halign: 'right' } },
    theme: 'grid',
  });
}

export function exportInvoicesPDF(invoices: Invoice[], opts: InvoiceExportOptions) {
  if (invoices.length === 0) return null;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let filename: string;
  if (invoices.length === 1) {
    const inv = invoices[0];
    const student = opts.students.find(s => s.id === inv.studentId);
    renderReceipt(doc, inv, opts);
    filename = `phieu-thu-${slug(student?.name || 'hoc-vien')}-thang-${inv.month}-${inv.year}`;
  } else {
    renderTable(doc, invoices, opts);
    filename = 'hoa-don-hoc-phi';
  }

  doc.save(`${filename}.pdf`);
  return filename;
}

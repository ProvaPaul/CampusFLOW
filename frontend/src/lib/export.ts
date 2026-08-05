/**
 * Client-side export helpers — all three formats are generated entirely in the browser from
 * data already fetched via the existing APIs, so no new backend endpoints are needed.
 *
 * "Excel" export uses an HTML-table-as-.xls trick (Excel/Google Sheets both open this natively)
 * instead of the `xlsx`/SheetJS package, which carries unpatched prototype-pollution and ReDoS
 * advisories on npm — not something worth shipping for a feature this simple.
 */
export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function cellText<T>(row: T, col: ExportColumn<T>): string {
  const value = col.accessor(row);
  return value === null || value === undefined ? "" : String(value);
}

export function exportToCsv<T>(filename: string, columns: ExportColumn<T>[], rows: T[]) {
  const escapeCsv = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

  const lines = [
    columns.map((c) => escapeCsv(c.header)).join(","),
    ...rows.map((row) => columns.map((c) => escapeCsv(cellText(row, c))).join(",")),
  ];

  downloadBlob(filename, new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" }));
}

export function exportToExcel<T>(filename: string, sheetTitle: string, columns: ExportColumn<T>[], rows: T[]) {
  const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const headerRow = `<tr>${columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("")}</tr>`;
  const bodyRows = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(cellText(row, c))}</td>`).join("")}</tr>`)
    .join("");

  const html = `<html><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
    <x:Name>${escapeHtml(sheetTitle)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
    </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body><table>${headerRow}${bodyRows}</table></body></html>`;

  downloadBlob(filename, new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }));
}

export async function exportToPdf<T>(filename: string, title: string, columns: ExportColumn<T>[], rows: T[]) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => cellText(row, c))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
  });

  doc.save(filename);
}

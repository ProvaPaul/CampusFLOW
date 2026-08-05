"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Table2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { exportToCsv, exportToExcel, exportToPdf, type ExportColumn } from "@/lib/export";

interface ExportMenuProps<T> {
  filenameBase: string;
  title: string;
  columns: ExportColumn<T>[];
  rows: T[];
}

export function ExportMenu<T>({ filenameBase, title, columns, rows }: ExportMenuProps<T>) {
  const [exporting, setExporting] = useState(false);

  const handlePdf = async () => {
    setExporting(true);
    try {
      await exportToPdf(`${filenameBase}.pdf`, title, columns, rows);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" disabled={rows.length === 0 || exporting}>
          <Download className="h-4 w-4" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => exportToCsv(`${filenameBase}.csv`, columns, rows)}>
          <FileText className="h-4 w-4" /> Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportToExcel(`${filenameBase}.xls`, title, columns, rows)}>
          <FileSpreadsheet className="h-4 w-4" /> Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handlePdf}>
          <Table2 className="h-4 w-4" /> Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

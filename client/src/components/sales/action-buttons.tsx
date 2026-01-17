import { Download, Printer, Upload, AlertCircle, DollarSign, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onExportPDF: () => void;
  onPrintThermal: () => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
  onCashOut?: () => void;
  onVoidSale?: () => void;
  reportType: string;
  isExporting?: boolean;
  isImporting?: boolean;
}

export function ActionButtons({ onExportPDF, onPrintThermal, onExportCSV, onImportCSV, onCashOut, onVoidSale, reportType, isExporting = false, isImporting = false }: ActionButtonsProps) {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportCSV(file);
    }
    // Reset the input
    event.target.value = '';
  };

  return (
    <div className="flex items-center space-x-2">
      <Button size="sm" onClick={onExportPDF} variant="outline" className="w-fit">
        <Download className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Export PDF</span>
        <span className="sm:hidden">PDF</span>
      </Button>

      <Button size="sm" onClick={onExportCSV} variant="outline" className="w-fit" disabled={isExporting}>
        {isExporting ? <AlertCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
        <span className="sm:hidden">{isExporting ? '...' : 'CSV'}</span>
      </Button>

      <label htmlFor="csv-import" className="cursor-pointer">
        <Button size="sm" variant="outline" className="w-fit" asChild disabled={isImporting}>
          <span>
            {isImporting ? <AlertCircle className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            <span className="hidden sm:inline">{isImporting ? 'Importing...' : 'Import CSV'}</span>
            <span className="sm:hidden">{isImporting ? '...' : 'Import'}</span>
          </span>
        </Button>
      </label>
      <input
        id="csv-import"
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button size="sm" onClick={onPrintThermal} variant="outline" className="w-fit">
        <Printer className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Print Report</span>
        <span className="sm:hidden">Print</span>
      </Button>

      {onCashOut && (
        <Button size="sm" onClick={onCashOut} variant="outline" className="w-fit">
          <DollarSign className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Cash Out</span>
          <span className="sm:hidden">Cash</span>
        </Button>
      )}

      {onVoidSale && (
        <Button size="sm" onClick={onVoidSale} variant="outline" className="w-fit">
          <XCircle className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Void Sale</span>
          <span className="sm:hidden">Void</span>
        </Button>
      )}
    </div>
  );
}
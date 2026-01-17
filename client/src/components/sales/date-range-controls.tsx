import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DateRangeControlsProps {
  dateRangeStart: string;
  dateRangeEnd: string;
  reportType: string;
  onDateRangeStartChange: (value: string) => void;
  onDateRangeEndChange: (value: string) => void;
  onReportTypeChange: (value: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
}

export function DateRangeControls({
  dateRangeStart,
  dateRangeEnd,
  reportType,
  onDateRangeStartChange,
  onDateRangeEndChange,
  onReportTypeChange,
}: DateRangeControlsProps) {
  return (
    <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:items-center">
      {/* Date Range Picker */}
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex space-x-1 sm:space-x-2">
          <input
            type="date"
            value={dateRangeStart}
            onChange={(e) => onDateRangeStartChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-28 sm:w-32 text-xs"
          />
          <span className="text-xs text-muted-foreground self-center">to</span>
          <input
            type="date"
            value={dateRangeEnd}
            onChange={(e) => onDateRangeEndChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-28 sm:w-32 text-xs"
          />
        </div>
      </div>

      {/* Report Type Dropdown */}
      <Select value={reportType} onValueChange={onReportTypeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select report type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Daily Report</SelectItem>
          <SelectItem value="weekly">Weekly Report</SelectItem>
          <SelectItem value="monthly">Monthly Report</SelectItem>
          <SelectItem value="yearly">Yearly Report</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
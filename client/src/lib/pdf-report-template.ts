/**
 * PDF Report Template Generator
 * Creates beautifully formatted, print-ready HTML reports for sales analytics
 */

export const wrapReportContent = (content: string, title: string, dateRange: string) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${dateRange}</title>
  <style>
    /* Reset & Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
      padding: 0;
      margin: 0;
    }

    /* Page Setup for A4 */
    @page {
      size: A4;
      margin: 15mm 20mm;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      .no-print {
        display: none !important;
      }

      /* Prevent orphans and widows */
      p, h1, h2, h3, h4, h5, h6 {
        orphans: 3;
        widows: 3;
      }

      /* Keep tables together */
      table {
        page-break-inside: avoid;
      }

      tr {
        page-break-inside: avoid;
      }
    }

    /* Header Styles */
    .header {
      text-align: center;
      padding: 20px 0 30px;
      border-bottom: 3px solid #2563eb;
      margin-bottom: 30px;
      background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
      border-radius: 8px;
      padding: 30px;
    }

    .store-name {
      font-size: 28pt;
      font-weight: 800;
      color: #1e40af;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .report-title {
      font-size: 18pt;
      font-weight: 600;
      color: #334155;
      margin: 12px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .date-range {
      font-size: 12pt;
      color: #64748b;
      font-weight: 500;
      margin: 8px 0;
    }

    .store-info {
      font-size: 10pt;
      color: #64748b;
      margin-top: 12px;
      line-height: 1.4;
    }

    /* Summary Cards */
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 30px 0;
      padding: 0;
    }

    .summary-item {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      border: 2px solid #cbd5e1;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .summary-label {
      font-size: 9pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
    }

    .summary-value {
      font-size: 20pt;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.2;
    }

    .summary-item.highlight {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-color: #3b82f6;
    }

    .summary-item.highlight .summary-value {
      color: #1e40af;
    }

    .summary-item.success {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-color: #10b981;
    }

    .summary-item.success .summary-value {
      color: #065f46;
    }

    /* Section Styles */
    .section {
      margin: 35px 0;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 14pt;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Table Styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    thead {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: #ffffff;
    }

    thead th {
      padding: 14px 12px;
      text-align: left;
      font-weight: 700;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 3px solid #1e40af;
    }

    thead th.amount {
      text-align: right;
    }

    tbody tr {
      border-bottom: 1px solid #e2e8f0;
      transition: background-color 0.2s;
    }

    tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    tbody tr:hover {
      background-color: #eff6ff;
    }

    tbody tr:last-child {
      border-bottom: none;
    }

    tbody td {
      padding: 12px;
      font-size: 10pt;
      color: #334155;
    }

    tbody td.amount {
      text-align: right;
      font-weight: 600;
      font-family: 'Courier New', monospace;
      color: #1e293b;
    }

    /* Totals Row */
    tfoot {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      font-weight: 700;
      border-top: 3px solid #2563eb;
    }

    tfoot td {
      padding: 14px 12px;
      font-size: 11pt;
      color: #1e293b;
    }

    tfoot td.amount {
      text-align: right;
      font-weight: 800;
      font-size: 12pt;
      color: #1e40af;
    }

    /* Utility Classes */
    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }

    .font-bold {
      font-weight: 700;
    }

    .font-black {
      font-weight: 900;
    }

    .text-muted {
      color: #64748b;
    }

    .mb-4 {
      margin-bottom: 16px;
    }

    .mt-4 {
      margin-top: 16px;
    }

    /* Footer */
    .report-footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 9pt;
    }

    .report-footer .timestamp {
      font-weight: 600;
      color: #64748b;
      margin-top: 8px;
    }

    /* Print Button (hidden on print) */
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 11pt;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      transition: all 0.2s;
      z-index: 1000;
    }

    .print-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
    }

    .print-button:active {
      transform: translateY(0);
    }

    /* Responsive adjustments */
    @media screen and (max-width: 768px) {
      .summary {
        grid-template-columns: 1fr;
      }
      
      table {
        font-size: 9pt;
      }
      
      thead th, tbody td {
        padding: 8px 6px;
      }
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Print Report</button>
  
  <div class="report-container">
    ${content}
    
    <div class="report-footer no-print">
      <div>Generated by OpenSauce POS System</div>
      <div class="timestamp">Report generated on ${new Date().toLocaleString()}</div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

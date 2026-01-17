import type { Settings } from '../../../../shared/types';
import {
  getPreviewClasses,
  formatStoreInfo,
  getReceiptWidthMM,
  formatCurrency
} from '@/lib/receipt-formatter';

interface ReceiptPreviewProps {
  settings: Settings;
  logoPreview: string | null;
}

export function ReceiptPreview({ settings, logoPreview }: ReceiptPreviewProps) {
  const classes = getPreviewClasses(settings) as any;
  const mmWidth = getReceiptWidthMM(settings);

  return (
    <div
      className={`${classes.container} ${settings.receiptCompactMode ? 'space-y-1' : classes.spaceY}`}
      style={{
        width: `${mmWidth}mm`,
        maxWidth: '100%',
        margin: '0 auto',
      }}
    >
      {settings.receiptShowLogo && logoPreview && (
        <div className="text-center mb-4">
          <img
            src={logoPreview}
            alt="Logo"
            className="mx-auto object-contain"
            style={{
              maxHeight: `${60 * (classes.logoScale)}px`,
              width: 'auto',
              maxWidth: '100%'
            }}
          />
        </div>
      )}

      {(() => {
        const storeInfo = formatStoreInfo({
          name: settings.storeName || 'Store Name',
          address: settings.storeAddress,
          phone: settings.storePhone,
          email: settings.storeEmail
        }, settings);

        return (
          <div className={`${classes.center} mb-3`} style={{ fontSize: classes.headerSize, fontFamily: classes.headerFamily }}>
            <div className="font-bold leading-tight">{storeInfo.name}</div>
            {storeInfo.address && <div className="opacity-80 mt-1">{storeInfo.address}</div>}
            {storeInfo.phone && <div className="opacity-80">{storeInfo.phone}</div>}
            {storeInfo.email && <div className="opacity-80">{storeInfo.email}</div>}
          </div>
        );
      })()}

      {(settings.vatNumber || settings.vatPercentage) && (
        <div className={`${classes.center} mb-3 text-xs opacity-80 ${classes.numbersFont}`}>
          {settings.vatNumber && <div>VAT #: {settings.vatNumber}</div>}
          {settings.vatPercentage && <div>VAT Rate: {settings.vatPercentage}%</div>}
        </div>
      )}

      {settings.receiptHeaderText && (
        <div className={`${classes.center} text-xs mb-3 italic opacity-70 border-y border-black/5 py-2`}>
          {settings.receiptHeaderText}
        </div>
      )}

      <div className={`${classes.thickDivider} my-3`}></div>

      <div className={`${classes.spaceY}`} style={{ fontSize: classes.metadataSize, fontFamily: classes.metadataFamily }}>
        {settings.receiptShowOrderNumber && (
          <div className={`${classes.spaceBetween}`}>
            <span className="opacity-60 uppercase font-bold">Order Reference</span>
            <span>#12345</span>
          </div>
        )}
        {settings.receiptShowDate && (
          <div className={`${classes.spaceBetween}`}>
            <span className="opacity-60 uppercase font-bold">Transaction Date</span>
            <span>{(() => { const d = new Date(); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`; })()}</span>
          </div>
        )}
        {settings.receiptShowCustomer && (
          <div className={`${classes.spaceBetween}`}>
            <span className="opacity-60 uppercase font-bold">Customer</span>
            <span className="truncate max-w-[120px]">John Doe</span>
          </div>
        )}
        {settings.receiptShowPaymentMethod && (
          <div className={`${classes.spaceBetween}`}>
            <span className="opacity-60 uppercase font-bold">Method</span>
            <span className="font-bold">CASH</span>
          </div>
        )}
      </div>

      <div className={`${classes.thickDivider} my-3`}></div>

      <div className="space-y-3">
        <div className={`${classes.spaceBetween} text-[10px] font-black opacity-40`}>
          <span>DESCRIPTION</span>
          <span>TOTAL</span>
        </div>

        <div className="space-y-3">
          <div className={settings.receiptCompactMode ? 'space-y-0.5' : 'space-y-4'}>
            {/* Sample Item 1 */}
            <div className="space-y-1">
              <div className={`${classes.spaceBetween} items-start`} style={{ fontSize: classes.itemsSize, fontFamily: classes.itemsFamily }}>
                <div className="flex-1 pr-2">
                  <div className="font-bold leading-none">Organic Coffee Beans</div>
                  <div style={{ fontSize: classes.detailsSize, fontFamily: classes.detailsFamily }}>2 x {formatCurrency(45.00, settings.currency || 'R')}</div>
                </div>
                <span className="font-bold whitespace-nowrap" style={{ fontFamily: classes.numbersFamily }}>{formatCurrency(90.00, settings.currency || 'R')}</span>
              </div>
              {settings.receiptShowItemDivider && (
                <div
                  className="w-full border-t mt-2"
                  style={{
                    borderStyle: settings.receiptItemDividerStyle || 'dashed',
                    borderColor: 'black',
                    opacity: classes.dividerOpacity
                  }}
                />
              )}
            </div>

            {/* Sample Item 2 */}
            <div className="space-y-1">
              <div className={`${classes.spaceBetween} items-start ${classes.itemsFont}`} style={{ fontSize: classes.itemsSize }}>
                <div className="flex-1 pr-2">
                  <div className="font-bold leading-none">Artisan Sourdough</div>
                  <div style={{ fontSize: classes.detailsSize, fontFamily: classes.detailsFamily }}>1 x {formatCurrency(32.50, settings.currency || 'R')}</div>
                </div>
                <span className="font-bold whitespace-nowrap" style={{ fontFamily: classes.numbersFamily }}>{formatCurrency(32.50, settings.currency || 'R')}</span>
              </div>
              {settings.receiptShowItemDivider && (
                <div
                  className={`w-full receipt-divider-${settings.receiptItemDividerStyle || 'dashed'}-t mt-2 pt-1`}
                  style={{ opacity: classes.dividerOpacity }}
                />
              )}
            </div>

            {/* Sample Item 3 */}
            <div className="space-y-1">
              <div className={`${classes.spaceBetween} items-start ${classes.itemsFont}`} style={{ fontSize: classes.itemsSize }}>
                <div className="flex-1 pr-2">
                  <div className="font-bold leading-none">Fresh Avocado</div>
                  <div style={{ fontSize: classes.detailsSize, fontFamily: classes.detailsFamily }}>3 x {formatCurrency(15.00, settings.currency || 'R')}</div>
                </div>
                <span className="font-bold whitespace-nowrap" style={{ fontFamily: classes.numbersFamily }}>{formatCurrency(45.00, settings.currency || 'R')}</span>
              </div>
              {settings.receiptShowItemDivider && (
                <div
                  className="w-full border-t mt-2"
                  style={{
                    borderStyle: settings.receiptItemDividerStyle || 'dashed',
                    borderColor: 'black',
                    opacity: classes.dividerOpacity
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`${classes.thickDivider} mt-4 mb-3`} style={{ opacity: classes.dividerOpacity * 2.5 }}></div>

      {(() => {
        const currency = settings.currency || 'R';
        const sampleSubtotal = 122.50;
        const vatPercentage = settings.vatPercentage || 15;
        const vatAmount = sampleSubtotal * (vatPercentage / 100);
        const totalWithVat = sampleSubtotal + vatAmount;

        return (
          <div className={`${classes.spaceY} ${classes.numbersFont}`}>
            <div className={`${classes.spaceBetween} text-xs`}>
              <span className="opacity-60">SUBTOTAL</span>
              <span>{formatCurrency(sampleSubtotal, currency)}</span>
            </div>
            {vatPercentage > 0 && (
              <div className={`${classes.spaceBetween} text-xs`}>
                <span className="opacity-60 font-medium">TAX ({vatPercentage}%)</span>
                <span>{formatCurrency(vatAmount, currency)}</span>
              </div>
            )}

            {settings.receiptShowTotalDivider && (
              <div className="w-full border-t-2 border-black/20 my-1" />
            )}

            <div className={`${classes.spaceBetween} border-t border-black/10 pt-2 mt-1`} style={{ fontSize: classes.numbersSize }}>
              <span className="text-sm font-black">TOTAL</span>
              <span className="text-base font-black">{formatCurrency(totalWithVat, currency)}</span>
            </div>
          </div>
        );
      })()}

      {settings.receiptFooterText && (
        <div className={`${classes.center} text-[10px] mt-6 opacity-60 leading-relaxed text-center px-2`}>
          {settings.receiptFooterText}
        </div>
      )}

      {settings.receiptShowBarcode && (
        <div className={`${classes.center} mt-6 opacity-80`}>
          <div className="h-8 w-full bg-black/10 flex items-center justify-center font-mono text-[10px] tracking-[0.2em]">*12345678*</div>
        </div>
      )}

      {settings.receiptShowQrCode && settings.paymentQrCode && (
        <div className={`${classes.center} mt-8 flex flex-col items-center`}>
          <img
            src={settings.paymentQrCode}
            alt="Payment QR"
            className="mx-auto border border-black/5 p-1 rounded-sm shadow-sm grayscale"
            style={{
              width: `${120 * (classes.qrCodeScale || 1)}px`,
              height: `${120 * (classes.qrCodeScale || 1)}px`
            }}
          />
          <div className="mt-1.5 opacity-40 font-black text-[9px] uppercase tracking-widest">
            Scan to Pay
          </div>
        </div>
      )}
    </div>
  );
}
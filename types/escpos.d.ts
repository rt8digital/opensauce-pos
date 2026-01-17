declare module 'escpos' {
  export class Printer {
    constructor(device: any, options?: any);
    text(content: string, encoding?: string): Printer;
    align(align: string): Printer;
    font(font: string): Printer;
    size(width: number, height: number): Printer;
    style(style: string): Printer;
    barcode(code: string, type: string, options?: any): Printer;
    qrcode(code: string, options?: any): Printer;
    image(image: any, density?: string): Promise<Printer>;
    raster(image: any, mode?: string): Printer;
    cut(part?: boolean): Printer;
    cashdraw(pin?: number): Printer;
    feed(lines?: number): Printer;
    control(ctrl: string): Printer;
    raw(buffer: any): Printer;
    close(callback?: (error?: any) => void): void;
  }

  const escpos: {
    Printer: typeof Printer;
    Image: any;
    USB: any;
    Network: any;
    Bluetooth: any;
  };
  export default escpos;
}

declare module 'escpos-usb' {
  const USB: any;
  export default USB;
}

declare module 'escpos-network' {
  const Network: any;
  export default Network;
}
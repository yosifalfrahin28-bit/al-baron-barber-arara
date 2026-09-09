declare module "qrcode" {
  type QrColor = {
    dark?: string;
    light?: string;
  };

  type ToDataUrlOptions = {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    color?: QrColor;
  };

  const QRCode: {
    toDataURL(value: string, options?: ToDataUrlOptions): Promise<string>;
  };

  export default QRCode;
}
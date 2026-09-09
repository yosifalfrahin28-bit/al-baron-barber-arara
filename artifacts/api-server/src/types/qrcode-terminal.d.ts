declare module "qrcode-terminal" {
  type QrOptions = {
    small?: boolean;
  };

  const qrcode: {
    generate(
      value: string,
      options?: QrOptions,
      callback?: (terminalQr: string) => void,
    ): void;
  };

  export default qrcode;
}
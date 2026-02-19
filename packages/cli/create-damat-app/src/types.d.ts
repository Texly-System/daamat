declare module "wait-on" {
  interface WaitOnOptions {
    resources: string[];
    delay?: number;
    interval?: number;
    timeout?: number;
    reverse?: boolean;
    validateStatus?: (status: number) => boolean;
    window?: number;
    simultaneous?: number;
    log?: boolean;
    verbose?: boolean;
    proxy?: string | false;
    auth?: {
      user: string;
      pass: string;
    };
    httpSignature?: {
      keyId: string;
      key: string;
    };
    strictSSL?: boolean;
    followRedirect?: boolean;
    headers?: Record<string, string>;
  }

  function waitOn(options: WaitOnOptions): Promise<void>;
  export = waitOn;
}

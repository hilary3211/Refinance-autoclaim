let refSdk: any;

export const initializeRefSdk = async () => {
  if (!refSdk) {
    refSdk = await import("@ref-finance/ref-sdk");
    refSdk.init_env("testnet");
  }
  return refSdk;
};

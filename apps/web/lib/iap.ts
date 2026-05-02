// IAP stub — replace with @capacitor-community/in-app-purchases once plugin is installed

export const IAP_PRODUCTS = {
  PLUS: "com.readwithroz.plus.monthly",
  PRO:  "com.readwithroz.pro.monthly",
} as const;

export type IAPProductId = typeof IAP_PRODUCTS[keyof typeof IAP_PRODUCTS];

// TODO: replace with Capacitor.isNativePlatform() after plugin install
export const IS_NATIVE_IOS =
  typeof window !== "undefined" &&
  /iPhone|iPad|iPod/.test(navigator.userAgent) &&
  !(window as any).MSStream;

// TODO: wire to InAppPurchases.purchaseProduct() after plugin install
export async function purchasePlan(_productId: IAPProductId): Promise<void> {
  throw new Error("IAP plugin not yet installed — run: npm install @capacitor-community/in-app-purchases");
}

// TODO: wire to InAppPurchases.restoreTransactions() after plugin install
export async function restorePurchases(): Promise<void> {
  throw new Error("IAP plugin not yet installed");
}

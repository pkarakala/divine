import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesOffering } from 'react-native-purchases';

/**
 * RevenueCat subscriptions (audit M-7). Env-gated like Sentry/demo creds:
 * without the platform API key every export is a safe no-op and the paywall
 * shows its "coming soon" state. Set in .env / EAS env:
 *
 *   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
 *   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
 *
 * IMPORTANT (C-1): the client NEVER writes subscription_tier — users.* tier
 * columns are service-role-only. Entitlement flow is: purchase here ->
 * RevenueCat webhook -> server (service role) updates users.subscription_tier.
 * Client code may read entitlements from CustomerInfo for immediate UI
 * feedback, but the DB tier is what gates server-enforced features.
 *
 * Note: react-native-purchases requires a dev-client/EAS build — it will not
 * work in Expo Go.
 */
const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
  default: '',
});

export const purchasesEnabled = !!API_KEY;

let configured = false;

export function initPurchases(userId: string): void {
  if (!purchasesEnabled || configured) return;
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  // appUserID = our user id, so RevenueCat webhooks can map entitlements to
  // the users row server-side.
  Purchases.configure({ apiKey: API_KEY!, appUserID: userId });
  configured = true;
}

/** The current offering (plans configured in the RevenueCat dashboard). */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!purchasesEnabled) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.warn('[purchases] getOfferings failed:', e);
    return null;
  }
}

/** Purchase a package from an offering. Returns updated CustomerInfo or null on cancel/failure. */
export async function purchasePackage(pkg: Parameters<typeof Purchases.purchasePackage>[0]): Promise<CustomerInfo | null> {
  if (!purchasesEnabled) return null;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e: any) {
    if (!e?.userCancelled) console.warn('[purchases] purchase failed:', e);
    return null;
  }
}

/** Restore prior purchases (App Store requirement for subscription apps). */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!purchasesEnabled) return null;
  try {
    return await Purchases.restorePurchases();
  } catch (e) {
    console.warn('[purchases] restore failed:', e);
    return null;
  }
}

/** Client-side entitlement check for immediate UI (server tier is authoritative). */
export function hasEntitlement(info: CustomerInfo | null, entitlement: 'plus' | 'elite'): boolean {
  return !!info?.entitlements.active[entitlement];
}

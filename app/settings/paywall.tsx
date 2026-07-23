import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import { purchasesEnabled, getCurrentOffering, purchasePackage, restorePurchases } from '../../lib/purchases';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

type Plan = 'plus' | 'elite';

const PLANS = {
  plus: {
    name: 'Divine+',
    price: '$14.99',
    period: '/month',
    annualPrice: '$99.99/year (save 44%)',
    features: [
      'Unlimited likes',
      'See who liked you',
      'Advanced org & chapter filters',
      'Read receipts',
      'Rewind last pass',
      '1 free boost per month',
    ],
  },
  elite: {
    name: 'Divine Elite',
    price: '$29.99',
    period: '/month',
    annualPrice: '$199.99/year (save 44%)',
    features: [
      'Everything in Divine+',
      'Priority matching algorithm',
      'Weekly profile boost',
      'Daily "Most Compatible" pick',
      'Event ticket discounts',
      '5 free roses per week',
      'Exclusive Elite badge',
    ],
  },
};

export default function Paywall() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('plus');
  const [annual, setAnnual] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (purchasesEnabled) getCurrentOffering().then(setOffering);
  }, []);

  // Map plan/period to a RevenueCat package identifier configured in the
  // RevenueCat dashboard offering (e.g. "plus_monthly", "elite_annual").
  const findPackage = (): PurchasesPackage | null => {
    if (!offering) return null;
    const id = `${selectedPlan}_${annual ? 'annual' : 'monthly'}`;
    return offering.availablePackages.find(p => p.identifier === id) ?? null;
  };

  const handleSubscribe = async () => {
    const pkg = findPackage();
    if (!purchasesEnabled || !pkg) {
      // RevenueCat not configured (or package missing): keep the honest stub.
      Alert.alert(
        'Coming Soon',
        `${PLANS[selectedPlan].name} subscriptions will be available when the app launches on the App Store. You'll be the first to know!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }
    setPurchasing(true);
    const info = await purchasePackage(pkg);
    setPurchasing(false);
    if (info) {
      // Server-side: the RevenueCat webhook updates users.subscription_tier
      // (client cannot write tier columns — C-1). UI unlocks on next fetch.
      Alert.alert('Welcome to ' + PLANS[selectedPlan].name + '!', 'Your subscription is active.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const handleRestore = async () => {
    const info = await restorePurchases();
    Alert.alert(
      info ? 'Purchases Restored' : 'Nothing to Restore',
      info ? 'Your subscription has been restored.' : 'No previous purchases were found for this account.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Upgrade to{'\n'}Divine {selectedPlan === 'plus' ? '+' : 'Elite'}</Text>
          <Text style={styles.heroSubtitle}>Get more matches, more features, and more connections.</Text>
        </View>

        <View style={styles.planToggle}>
          <TouchableOpacity
            style={[styles.planTab, selectedPlan === 'plus' && styles.planTabActive]}
            onPress={() => setSelectedPlan('plus')}
          >
            <Text style={[styles.planTabText, selectedPlan === 'plus' && styles.planTabTextActive]}>Divine+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.planTab, selectedPlan === 'elite' && styles.planTabActive]}
            onPress={() => setSelectedPlan('elite')}
          >
            <Text style={[styles.planTabText, selectedPlan === 'elite' && styles.planTabTextActive]}>Divine Elite</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{PLANS[selectedPlan].price}</Text>
            <Text style={styles.period}>{PLANS[selectedPlan].period}</Text>
          </View>
          <TouchableOpacity style={styles.annualToggle} onPress={() => setAnnual(!annual)}>
            <View style={[styles.checkbox, annual && styles.checkboxChecked]}>
              {annual && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.annualText}>{PLANS[selectedPlan].annualPrice}</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.features}>
          {PLANS[selectedPlan].features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Button
          title={`Subscribe to ${PLANS[selectedPlan].name}`}
          onPress={handleSubscribe}
          loading={purchasing}
          size="lg"
          variant="secondary"
        />
        {purchasesEnabled && (
          <Button
            title="Restore Purchases"
            onPress={handleRestore}
            variant="ghost"
            size="sm"
          />
        )}

        <Text style={styles.terms}>
          Payment will be charged to your App Store account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
  closeBtn: { alignSelf: 'flex-end', padding: Spacing.sm },
  closeText: { fontSize: 24, color: Colors.white },
  hero: { alignItems: 'center', marginVertical: Spacing.xl },
  heroTitle: { fontSize: FontSize.display, fontWeight: FontWeight.bold, color: Colors.accent, textAlign: 'center' },
  heroSubtitle: { fontSize: FontSize.md, color: Colors.gray[400], textAlign: 'center', marginTop: Spacing.sm },
  planToggle: { flexDirection: 'row', backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full, padding: 4, marginBottom: Spacing.lg },
  planTab: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.full, alignItems: 'center' },
  planTabActive: { backgroundColor: Colors.accent },
  planTabText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.gray[400] },
  planTabTextActive: { color: Colors.primary },
  priceCard: { backgroundColor: Colors.primaryLight, marginBottom: Spacing.lg },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontSize: FontSize.display, fontWeight: FontWeight.bold, color: Colors.white },
  period: { fontSize: FontSize.md, color: Colors.gray[400] },
  annualToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: Colors.gray[500], justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark: { fontSize: 14, color: Colors.primary, fontWeight: FontWeight.bold },
  annualText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.medium },
  features: { marginBottom: Spacing.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  featureCheck: { fontSize: FontSize.md, color: Colors.accent, fontWeight: FontWeight.bold },
  featureText: { fontSize: FontSize.md, color: Colors.white },
  terms: { fontSize: FontSize.xs, color: Colors.gray[500], textAlign: 'center', marginTop: Spacing.lg, lineHeight: 18 },
});

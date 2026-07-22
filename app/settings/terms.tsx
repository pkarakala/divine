import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/Theme';

export default function TermsOfService() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: July 21, 2026</Text>

        <Text style={styles.body}>
          Welcome to Divine. These Terms of Service ("Terms") govern your access to and use of the Divine mobile application ("App"), operated by Divine Technologies, Inc. ("Divine," "we," "us," or "our"). By creating an account or using Divine, you agree to be bound by these Terms. If you do not agree, do not use the App.
        </Text>

        <Text style={styles.sectionTitle}>1. Eligibility</Text>
        <Text style={styles.body}>
          You must be at least 18 years of age to use Divine. By creating an account, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms.
        </Text>
        <Text style={styles.body}>
          Divine is an exclusive community for members and associates of the National Pan-Hellenic Council (NPHC) organizations, collectively known as the Divine Nine. To maintain an account in good standing, you must be a verified member of one of the nine NPHC organizations. Misrepresentation of membership status will result in immediate account termination.
        </Text>

        <Text style={styles.sectionTitle}>2. Account Registration and Security</Text>
        <Text style={styles.body}>
          You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized access.
        </Text>
        <Text style={styles.body}>
          You may not create more than one account, share your account with others, or transfer your account to any third party. We reserve the right to suspend or terminate accounts that violate these provisions.
        </Text>

        <Text style={styles.sectionTitle}>3. Membership Verification</Text>
        <Text style={styles.body}>
          Divine requires verification of your NPHC organization membership. You consent to our verification process, which may include review of documentation you provide. Verification decisions are at our sole discretion and are final. We do not guarantee acceptance into the platform.
        </Text>

        <Text style={styles.sectionTitle}>4. User Conduct</Text>
        <Text style={styles.body}>
          You agree to use Divine only for lawful purposes and in accordance with these Terms and our Community Guidelines. You shall not:
        </Text>
        <Text style={styles.bullet}>
          {'•'} Harass, threaten, intimidate, or harm any other user
        </Text>
        <Text style={styles.bullet}>
          {'•'} Post false, misleading, or deceptive content
        </Text>
        <Text style={styles.bullet}>
          {'•'} Impersonate any person or entity
        </Text>
        <Text style={styles.bullet}>
          {'•'} Use the App for commercial solicitation or spam
        </Text>
        <Text style={styles.bullet}>
          {'•'} Upload sexually explicit or obscene content
        </Text>
        <Text style={styles.bullet}>
          {'•'} Attempt to circumvent any security features
        </Text>
        <Text style={styles.bullet}>
          {'•'} Use automated means to access the App
        </Text>
        <Text style={styles.bullet}>
          {'•'} Violate any applicable law or regulation
        </Text>

        <Text style={styles.sectionTitle}>5. Content Ownership and License</Text>
        <Text style={styles.body}>
          You retain ownership of all content you submit to Divine ("User Content"), including photos, text, and other materials. By submitting User Content, you grant Divine a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, modify, distribute, and display your User Content solely in connection with operating and providing the App.
        </Text>
        <Text style={styles.body}>
          You represent that you own or have the necessary rights to all User Content you submit, and that your User Content does not infringe the rights of any third party.
        </Text>
        <Text style={styles.body}>
          Divine and its licensors own all intellectual property rights in the App, including its design, features, logos, trademarks, and underlying technology. These Terms do not grant you any rights to use Divine's branding or intellectual property.
        </Text>

        <Text style={styles.sectionTitle}>6. Subscriptions and Payments</Text>
        <Text style={styles.body}>
          Divine offers optional subscription plans ("Divine+" and "Divine Elite") that provide access to premium features. Subscriptions are billed through your Apple App Store or Google Play Store account on a recurring monthly basis.
        </Text>
        <Text style={styles.body}>
          Subscriptions automatically renew unless canceled at least 24 hours before the end of the current billing period. You may manage or cancel your subscription through your device's app store settings. No refunds will be provided for partial billing periods.
        </Text>
        <Text style={styles.body}>
          We may offer in-app purchases such as Roses or Boosts. All in-app purchases are non-refundable except as required by applicable law. Prices are subject to change with reasonable notice.
        </Text>

        <Text style={styles.sectionTitle}>7. Termination</Text>
        <Text style={styles.body}>
          You may delete your account at any time through the App settings. We reserve the right to suspend or permanently terminate your account, without prior notice, if we determine in our sole discretion that you have violated these Terms, our Community Guidelines, or any applicable law.
        </Text>
        <Text style={styles.body}>
          Upon termination, your right to use the App ceases immediately. We may retain certain information as required by law or for legitimate business purposes, as described in our Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>8. Disclaimer of Warranties</Text>
        <Text style={styles.body}>
          THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. DIVINE DOES NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
        </Text>
        <Text style={styles.body}>
          DIVINE DOES NOT CONDUCT CRIMINAL BACKGROUND CHECKS ON USERS AND MAKES NO REPRESENTATIONS OR WARRANTIES REGARDING THE CONDUCT, IDENTITY, OR COMPATIBILITY OF ANY USER. YOU ARE SOLELY RESPONSIBLE FOR YOUR INTERACTIONS WITH OTHER USERS.
        </Text>

        <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
        <Text style={styles.body}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, DIVINE AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES.
        </Text>
        <Text style={styles.body}>
          IN NO EVENT SHALL DIVINE'S TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO DIVINE IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.
        </Text>

        <Text style={styles.sectionTitle}>10. Indemnification</Text>
        <Text style={styles.body}>
          You agree to indemnify, defend, and hold harmless Divine and its affiliates from any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising from your use of the App, your User Content, your violation of these Terms, or your violation of any rights of another.
        </Text>

        <Text style={styles.sectionTitle}>11. Dispute Resolution</Text>
        <Text style={styles.body}>
          Any dispute arising from these Terms or your use of the App shall be resolved through binding arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules. Arbitration shall take place in Atlanta, Georgia. You agree to waive any right to a jury trial or to participate in a class action.
        </Text>

        <Text style={styles.sectionTitle}>12. Governing Law</Text>
        <Text style={styles.body}>
          These Terms shall be governed by and construed in accordance with the laws of the State of Georgia, without regard to its conflict of law principles.
        </Text>

        <Text style={styles.sectionTitle}>13. Changes to These Terms</Text>
        <Text style={styles.body}>
          We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms in the App and updating the "Last Updated" date. Your continued use of the App after changes take effect constitutes acceptance of the revised Terms.
        </Text>

        <Text style={styles.sectionTitle}>14. Contact Us</Text>
        <Text style={styles.body}>
          If you have questions about these Terms, please contact us at:
        </Text>
        <Text style={styles.body}>
          Divine Technologies, Inc.{'\n'}
          Email: legal@divineapp.com{'\n'}
          Atlanta, Georgia
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  backBtn: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
  lastUpdated: { fontSize: FontSize.sm, color: Colors.text.light, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text.primary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  body: { fontSize: FontSize.md, color: Colors.text.secondary, lineHeight: 24, marginBottom: Spacing.md },
  bullet: { fontSize: FontSize.md, color: Colors.text.secondary, lineHeight: 24, marginBottom: Spacing.xs, paddingLeft: Spacing.md },
});

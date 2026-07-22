import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/Theme';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: July 21, 2026</Text>

        <Text style={styles.body}>
          Divine Technologies, Inc. ("Divine," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use the Divine mobile application ("App"). Please read this policy carefully. By using Divine, you consent to the practices described herein.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>

        <Text style={styles.subTitle}>Information You Provide</Text>
        <Text style={styles.bullet}>{'•'} Account information: name, email address, phone number, date of birth, gender</Text>
        <Text style={styles.bullet}>{'•'} Profile information: photos, biography, occupation, city, prompt responses</Text>
        <Text style={styles.bullet}>{'•'} Organization details: NPHC organization, chapter name, line name, initiation year</Text>
        <Text style={styles.bullet}>{'•'} Verification documents: membership credentials submitted for verification</Text>
        <Text style={styles.bullet}>{'•'} Communications: messages exchanged with other users and support inquiries</Text>
        <Text style={styles.bullet}>{'•'} Payment information: processed securely through Apple/Google; we do not store card numbers</Text>

        <Text style={styles.subTitle}>Information Collected Automatically</Text>
        <Text style={styles.bullet}>{'•'} Device information: device type, operating system, unique device identifiers</Text>
        <Text style={styles.bullet}>{'•'} Usage data: features used, time spent, interactions, matches, likes, and passes</Text>
        <Text style={styles.bullet}>{'•'} Location data: approximate location (city-level) used for matching; precise location only with your explicit permission</Text>
        <Text style={styles.bullet}>{'•'} Log data: IP address, access times, pages viewed, app crashes and diagnostics</Text>
        <Text style={styles.bullet}>{'•'} Cookies and similar technologies: analytics identifiers for improving the App experience</Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.body}>We use the information we collect to:</Text>
        <Text style={styles.bullet}>{'•'} Provide, maintain, and improve the App and its features</Text>
        <Text style={styles.bullet}>{'•'} Match you with compatible users based on your preferences and profile</Text>
        <Text style={styles.bullet}>{'•'} Verify your NPHC organization membership</Text>
        <Text style={styles.bullet}>{'•'} Facilitate communication between matched users</Text>
        <Text style={styles.bullet}>{'•'} Process subscriptions and in-app purchases</Text>
        <Text style={styles.bullet}>{'•'} Send push notifications about matches, messages, and account activity</Text>
        <Text style={styles.bullet}>{'•'} Detect and prevent fraud, abuse, and violations of our Terms</Text>
        <Text style={styles.bullet}>{'•'} Ensure user safety and enforce Community Guidelines</Text>
        <Text style={styles.bullet}>{'•'} Conduct research and analytics to improve our services</Text>
        <Text style={styles.bullet}>{'•'} Comply with legal obligations</Text>

        <Text style={styles.sectionTitle}>3. How We Share Your Information</Text>
        <Text style={styles.body}>We do not sell your personal information. We may share your information with:</Text>

        <Text style={styles.subTitle}>Other Users</Text>
        <Text style={styles.body}>
          Your profile information (photos, name, bio, organization, prompts) is visible to other Divine users as part of the matching experience. Messages are shared only with their intended recipients.
        </Text>

        <Text style={styles.subTitle}>Service Providers</Text>
        <Text style={styles.bullet}>{'•'} Payment processors (Apple App Store, Google Play) for subscription management</Text>
        <Text style={styles.bullet}>{'•'} Cloud hosting and infrastructure providers</Text>
        <Text style={styles.bullet}>{'•'} Analytics services to understand App usage patterns</Text>
        <Text style={styles.bullet}>{'•'} Push notification delivery services</Text>
        <Text style={styles.bullet}>{'•'} Error monitoring and crash reporting services</Text>

        <Text style={styles.subTitle}>Legal and Safety</Text>
        <Text style={styles.body}>
          We may disclose your information when required by law, in response to legal process, to protect the rights and safety of Divine or others, to investigate fraud, or to respond to government requests.
        </Text>

        <Text style={styles.subTitle}>Business Transfers</Text>
        <Text style={styles.body}>
          In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Retention</Text>
        <Text style={styles.body}>
          We retain your personal information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain data for up to 90 days for safety purposes (e.g., to prevent banned users from creating new accounts) and as required by law. Anonymized and aggregated data may be retained indefinitely for analytics.
        </Text>

        <Text style={styles.sectionTitle}>5. Your Rights and Choices</Text>

        <Text style={styles.subTitle}>All Users</Text>
        <Text style={styles.bullet}>{'•'} Access: Request a copy of your personal data</Text>
        <Text style={styles.bullet}>{'•'} Correction: Update inaccurate information through your profile settings</Text>
        <Text style={styles.bullet}>{'•'} Deletion: Delete your account and associated data through App settings</Text>
        <Text style={styles.bullet}>{'•'} Export: Request a portable copy of your data</Text>
        <Text style={styles.bullet}>{'•'} Notifications: Manage push notification preferences in App settings</Text>
        <Text style={styles.bullet}>{'•'} Location: Control location permissions through your device settings</Text>

        <Text style={styles.subTitle}>California Residents (CCPA)</Text>
        <Text style={styles.body}>
          If you are a California resident, you have the right to: know what personal information we collect and how it is used; request deletion of your personal information; opt out of the sale of personal information (we do not sell your data); and not be discriminated against for exercising your privacy rights. To exercise these rights, contact us at privacy@divineapp.com.
        </Text>

        <Text style={styles.subTitle}>European Users (GDPR)</Text>
        <Text style={styles.body}>
          If you are located in the European Economic Area, you have additional rights including: the right to data portability; the right to restrict processing; the right to object to processing; and the right to withdraw consent. Our legal basis for processing includes contract performance, legitimate interests, and your consent. To exercise these rights or lodge a complaint with a supervisory authority, contact us at privacy@divineapp.com.
        </Text>

        <Text style={styles.sectionTitle}>6. Data Security</Text>
        <Text style={styles.body}>
          We implement industry-standard technical and organizational measures to protect your personal information, including encryption in transit and at rest, secure authentication, access controls, and regular security assessments. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
        </Text>

        <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
        <Text style={styles.body}>
          Divine is strictly intended for users aged 18 and older. We do not knowingly collect personal information from anyone under 18. If we learn that we have collected information from a minor, we will promptly delete that information and terminate the associated account. If you believe a minor is using Divine, please contact us immediately.
        </Text>

        <Text style={styles.sectionTitle}>8. Third-Party Links</Text>
        <Text style={styles.body}>
          The App may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to review their privacy policies before providing any personal information.
        </Text>

        <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Last Updated" date and, where appropriate, providing additional notice within the App. Your continued use of Divine after changes take effect constitutes acceptance of the revised policy.
        </Text>

        <Text style={styles.sectionTitle}>10. Contact Us</Text>
        <Text style={styles.body}>
          If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us at:
        </Text>
        <Text style={styles.body}>
          Divine Technologies, Inc.{'\n'}
          Email: privacy@divineapp.com{'\n'}
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
  subTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text.primary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  body: { fontSize: FontSize.md, color: Colors.text.secondary, lineHeight: 24, marginBottom: Spacing.md },
  bullet: { fontSize: FontSize.md, color: Colors.text.secondary, lineHeight: 24, marginBottom: Spacing.xs, paddingLeft: Spacing.md },
});

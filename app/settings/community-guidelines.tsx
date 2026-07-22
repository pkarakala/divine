import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/Theme';

export default function CommunityGuidelines() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Community Guidelines</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: July 21, 2026</Text>

        <Text style={styles.body}>
          Divine exists to create meaningful connections within the Divine Nine community. These guidelines are how we protect that mission. Every member plays a role in keeping this space worthy of the legacy we represent. Read them, live them, hold each other to them.
        </Text>

        <Text style={styles.sectionTitle}>Be Authentic</Text>
        <Text style={styles.body}>
          Your profile is your introduction. Make it real.
        </Text>
        <Text style={styles.bullet}>{'•'} Use recent photos that clearly show your face. No heavy filters, no group shots as your primary photo, no misleading images.</Text>
        <Text style={styles.bullet}>{'•'} Your NPHC membership must be legitimate and verifiable. This community is built on trust, and misrepresenting your membership disrespects everyone here.</Text>
        <Text style={styles.bullet}>{'•'} Be honest in your profile details. Your age, location, occupation, and intentions should all be truthful.</Text>
        <Text style={styles.bullet}>{'•'} One account per person. No duplicates, no shared accounts, no catfishing.</Text>

        <Text style={styles.sectionTitle}>Be Respectful</Text>
        <Text style={styles.body}>
          We are brothers and sisters in Greek life. Act like it.
        </Text>
        <Text style={styles.bullet}>{'•'} Treat every person with dignity, regardless of their organization, chapter, or background. Inter-org rivalries stay on the yard, not in the DMs.</Text>
        <Text style={styles.bullet}>{'•'} No means no. If someone declines your interest or stops responding, respect that boundary. Persistence after rejection is harassment.</Text>
        <Text style={styles.bullet}>{'•'} Discriminatory language based on skin color, body type, gender identity, sexual orientation, disability, or any other characteristic has no place here.</Text>
        <Text style={styles.bullet}>{'•'} Keep conversations respectful. Disagree without degrading. You can unmatch without insulting.</Text>
        <Text style={styles.bullet}>{'•'} Do not share screenshots of private conversations or other users' photos outside the app without their consent.</Text>

        <Text style={styles.sectionTitle}>Keep It Clean</Text>
        <Text style={styles.body}>
          Divine is about connection, not explicit content.
        </Text>
        <Text style={styles.bullet}>{'•'} No nudity or sexually explicit photos in your profile.</Text>
        <Text style={styles.bullet}>{'•'} Do not send unsolicited sexual messages or images. This is an immediate ban.</Text>
        <Text style={styles.bullet}>{'•'} Content depicting violence, gore, or illegal activity is prohibited.</Text>
        <Text style={styles.bullet}>{'•'} Keep your bio and prompt responses appropriate. Suggestive is fine; explicit is not.</Text>

        <Text style={styles.sectionTitle}>No Spam or Scams</Text>
        <Text style={styles.body}>
          This is a dating community, not a marketplace.
        </Text>
        <Text style={styles.bullet}>{'•'} Do not use Divine to sell products, promote businesses, recruit for MLMs, or solicit money.</Text>
        <Text style={styles.bullet}>{'•'} Do not send repetitive, copy-pasted messages to multiple users.</Text>
        <Text style={styles.bullet}>{'•'} Do not direct users to external websites, apps, or social media for commercial purposes.</Text>
        <Text style={styles.bullet}>{'•'} Any attempt to scam, phish, or financially exploit another member will result in permanent removal and may be reported to law enforcement.</Text>

        <Text style={styles.sectionTitle}>Protect Your Safety and Others'</Text>
        <Text style={styles.body}>
          We build the tools, but you look out for each other.
        </Text>
        <Text style={styles.bullet}>{'•'} Never share personal financial information (bank details, SSN, etc.) with anyone on the platform.</Text>
        <Text style={styles.bullet}>{'•'} Meet in public places for first dates. Tell a friend where you're going.</Text>
        <Text style={styles.bullet}>{'•'} Do not threaten violence or express intent to harm yourself or others. We take all threats seriously.</Text>
        <Text style={styles.bullet}>{'•'} If someone makes you uncomfortable, use the block and report features. That's what they're there for.</Text>

        <Text style={styles.sectionTitle}>Consequences</Text>
        <Text style={styles.body}>
          Violations are handled proportionally. We don't play, but we are fair.
        </Text>
        <Text style={styles.bullet}>{'•'} Warning: Minor first-time violations may result in a warning with an explanation of what was wrong.</Text>
        <Text style={styles.bullet}>{'•'} Temporary suspension: Repeated or moderate violations will result in a temporary account suspension (typically 7-30 days).</Text>
        <Text style={styles.bullet}>{'•'} Permanent ban: Severe violations (harassment, explicit content distribution, scams, fake membership) result in immediate and permanent removal with no refund of subscription fees.</Text>
        <Text style={styles.body}>
          We review all reports and enforcement decisions carefully. If you believe an action was taken in error, you may appeal by contacting support@divineapp.com within 14 days.
        </Text>

        <Text style={styles.sectionTitle}>How to Report</Text>
        <Text style={styles.body}>
          See something that doesn't belong? Speak up.
        </Text>
        <Text style={styles.bullet}>{'•'} Tap the three-dot menu on any profile or in any conversation to access the Report option.</Text>
        <Text style={styles.bullet}>{'•'} Select the category that best describes the issue.</Text>
        <Text style={styles.bullet}>{'•'} Add any additional context that would help our team investigate.</Text>
        <Text style={styles.bullet}>{'•'} All reports are confidential. The reported user will not know who filed the report.</Text>
        <Text style={styles.body}>
          Our safety team reviews reports within 24 hours. For immediate safety concerns, please contact local law enforcement.
        </Text>

        <Text style={styles.sectionTitle}>Our Commitment</Text>
        <Text style={styles.body}>
          Divine is built for you. We are committed to maintaining a space where D9 members can connect authentically, safely, and with pride. These guidelines will evolve as our community grows. We welcome your feedback at community@divineapp.com.
        </Text>
        <Text style={styles.body}>
          Thank you for upholding the standard. This is your community. Keep it Divine.
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

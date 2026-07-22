import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import { useMatchStore, MatchWithProfile } from '../../stores/matchStore';
import { supabase } from '../../lib/supabase';
import { getDraftMessage, saveDraftMessage } from '../../lib/statePersistence';
import { publishPublicKey, decryptReceivedMessage } from '../../lib/encryptedChat';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import { ORGANIZATIONS } from '../../types/database';
import type { Message, Organization } from '../../types/database';
import { track } from '../../lib/analytics';
import { hapticLight } from '../../lib/haptics';

export default function Chat() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentChat, matches, fetchMessages, sendMessage, subscribeToMessages, unmatch } = useMatchStore();
  const [text, setText] = useState('');
  const [matchInfo, setMatchInfo] = useState<{ name: string; photo: string | null } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [matchData, setMatchData] = useState<MatchWithProfile | null>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<any>(null);
  const isTrackingTyping = useRef(false);
  const publicKeyPublished = useRef(false);

  // Typing indicator animation
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!otherUserTyping) return;
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
    const a1 = animateDot(dot1, 0);
    const a2 = animateDot(dot2, 150);
    const a3 = animateDot(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [otherUserTyping]);

  useEffect(() => {
    if (!user || publicKeyPublished.current) return;
    publicKeyPublished.current = true;
    publishPublicKey(user.id);
  }, [user]);

  useEffect(() => {
    if (!user || currentChat.length === 0) return;
    currentChat.forEach(async (msg) => {
      if (decryptedMessages[msg.id]) return;
      if (!msg.content.startsWith('{')) return;
      try {
        const parsed = JSON.parse(msg.content);
        if (!parsed.e) return;
      } catch { return; }
      const otherUserId = msg.sender_id === user.id
        ? matchData?.other_user.profile.user_id
        : msg.sender_id;
      if (!otherUserId) return;
      const decrypted = await decryptReceivedMessage(msg.content, otherUserId);
      setDecryptedMessages(prev => ({ ...prev, [msg.id]: decrypted }));
    });
  }, [currentChat, user, matchData]);

  useEffect(() => {
    if (!matchId) return;
    getDraftMessage(matchId).then(draft => {
      if (draft) setText(draft);
    });
  }, [matchId]);

  // Fetch match info and set matchData for icebreakers
  useEffect(() => {
    if (!matchId || !user) return;
    const match = matches.find(m => m.id === matchId);
    if (match) setMatchData(match);

    (async () => {
      const { data: matchRow } = await supabase
        .from('matches')
        .select('user_1_id, user_2_id')
        .eq('id', matchId)
        .single();
      if (!matchRow) return;
      const otherId = matchRow.user_1_id === user.id ? matchRow.user_2_id : matchRow.user_1_id;
      const [profileRes, photoRes] = await Promise.all([
        supabase.from('profiles').select('display_name').eq('user_id', otherId).single(),
        supabase.from('photos').select('storage_path').eq('user_id', otherId).eq('is_primary', true).single(),
      ]);
      setMatchInfo({
        name: profileRes.data?.display_name || 'Match',
        photo: photoRes.data?.storage_path || null,
      });
    })();
  }, [matchId, user, matches]);

  // Subscribe to messages
  useEffect(() => {
    if (matchId) {
      fetchMessages(matchId);
      const unsubscribe = subscribeToMessages(matchId);
      return unsubscribe;
    }
  }, [matchId]);

  // Mark messages as read
  useEffect(() => {
    if (!matchId || !user || currentChat.length === 0) return;
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('match_id', matchId)
      .neq('sender_id', user.id)
      .is('read_at', null)
      .then();
  }, [currentChat.length, matchId, user]);

  // Track read receipts
  useEffect(() => {
    if (!user || currentChat.length === 0) return;
    const myMessages = currentChat.filter(m => m.sender_id === user.id);
    const lastRead = [...myMessages].reverse().find(m => m.read_at);
    setLastReadMessageId(lastRead?.id || null);
  }, [currentChat, user]);

  // Scroll to bottom
  useEffect(() => {
    if (currentChat.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [currentChat.length]);

  // Typing indicator presence channel
  useEffect(() => {
    if (!matchId || !user) return;

    const channel = supabase.channel(`typing:${matchId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherUserId = Object.keys(state).find(id => id !== user.id);
        if (otherUserId) {
          const presences = state[otherUserId] as any[];
          const isTyping = presences?.some((p: any) => p.typing === true);
          setOtherUserTyping(isTyping || false);
        } else {
          setOtherUserTyping(false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ typing: false });
        }
      });

    typingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
    };
  }, [matchId, user]);

  // Handle typing status broadcast
  const handleTextChange = useCallback((value: string) => {
    setText(value);

    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    draftTimeoutRef.current = setTimeout(() => {
      if (matchId) saveDraftMessage(matchId, value);
    }, 1000);

    if (!typingChannelRef.current) return;

    if (value.length > 0) {
      if (!isTrackingTyping.current) {
        isTrackingTyping.current = true;
        typingChannelRef.current.track({ typing: true });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTrackingTyping.current = false;
        typingChannelRef.current?.track({ typing: false });
      }, 2000);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      isTrackingTyping.current = false;
      typingChannelRef.current.track({ typing: false });
    }
  }, [matchId]);

  const handleReport = () => {
    setMenuVisible(false);
    Alert.alert('Report', 'Are you sure you want to report this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => {} },
    ]);
  };

  const handleUnmatch = () => {
    setMenuVisible(false);
    Alert.alert('Unmatch', 'Are you sure you want to unmatch? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unmatch', style: 'destructive', onPress: async () => {
        if (matchId) {
          await unmatch(matchId);
          router.back();
        }
      }},
    ]);
  };

  const handleSend = async () => {
    if (!text.trim() || !user || !matchId) return;
    hapticLight();
    const message = text.trim();
    setText('');
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    saveDraftMessage(matchId, '');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTrackingTyping.current = false;
    typingChannelRef.current?.track({ typing: false });
    const matchRow = matchData;
    const otherId = matchRow ? matchRow.other_user.profile.user_id : undefined;
    track('message_sent', { targetUserId: otherId, metadata: { matchId } });
    await sendMessage(matchId, user.id, message);
  };

  const handlePickImage = async () => {
    if (!user || !matchId) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to send images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const timestamp = Date.now();
    const filePath = `${matchId}/${timestamp}.jpg`;

    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, blob, { contentType: 'image/jpeg' });

      if (uploadError) {
        Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      await sendMessage(matchId, user.id, '\u{1F4F7} Photo', 'image', publicUrl);
    } catch {
      Alert.alert('Error', 'Something went wrong sending your image.');
    }
  };

  // Generate icebreaker suggestions
  const getIcebreakers = (): string[] => {
    if (!matchData || !matchInfo) return [];
    const suggestions: string[] = [];
    const otherUser = matchData.other_user;

    // Prompt-based icebreaker
    if (otherUser.prompts.length > 0) {
      const firstPrompt = otherUser.prompts[0];
      const snippet = firstPrompt.prompt_answer.slice(0, 30);
      suggestions.push(`I love that you said "${snippet}..." - tell me more!`);
    }

    // Shared org icebreaker
    if (otherUser.profile.organization) {
      const orgName = ORGANIZATIONS[otherUser.profile.organization as Organization]?.name || 'your org';
      suggestions.push(`Fellow ${orgName}! What chapter are you?`);
    }

    // Generic icebreaker
    const name = matchInfo.name.split(' ')[0];
    suggestions.push(`Hey ${name}! What made you join Divine?`);

    return suggestions.slice(0, 3);
  };

  const handleIcebreakerTap = (suggestion: string) => {
    setText(suggestion);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    let isEncrypted = false;
    try {
      const parsed = JSON.parse(item.content);
      isEncrypted = !!parsed.e;
    } catch {}
    const displayContent = decryptedMessages[item.id] || item.content;

    if (item.type === 'image' && item.media_url) {
      return (
        <View>
          <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage, styles.imageBubble]}>
            <Image
              source={{ uri: item.media_url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            <View style={styles.timeRow}>
              {isEncrypted && <Text style={[styles.lockIcon, isMe && styles.myMessageTime]}>{'lock '}</Text>}
              <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          {isMe && item.id === lastReadMessageId && (
            <Text style={styles.readReceipt}>Read</Text>
          )}
        </View>
      );
    }

    return (
      <View>
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
            {displayContent}
          </Text>
          <View style={styles.timeRow}>
            {isEncrypted && <Text style={[styles.lockIcon, isMe && styles.myMessageTime]}>{'lock '}</Text>}
            <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        {isMe && item.id === lastReadMessageId && (
          <Text style={styles.readReceipt}>Read</Text>
        )}
      </View>
    );
  };

  const icebreakers = currentChat.length === 0 ? getIcebreakers() : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Text style={styles.headerBackText}>{'‹'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {matchInfo?.photo && (
            <Image
              source={{ uri: matchInfo.photo }}
              style={styles.headerAvatar}
            />
          )}
          <Text style={styles.headerName} numberOfLines={1}>
            {matchInfo?.name || ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={styles.headerMenu}>
          <Text style={styles.headerMenuText}>{'···'}</Text>
        </TouchableOpacity>
      </View>
      {menuVisible && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity onPress={handleReport} style={styles.menuItem}>
            <Text style={styles.menuItemText}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleUnmatch} style={styles.menuItem}>
            <Text style={[styles.menuItemText, { color: Colors.error }]}>Unmatch</Text>
          </TouchableOpacity>
        </View>
      )}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={currentChat}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>Say hello! Start the conversation.</Text>
            </View>
          }
        />

        {/* Typing indicator */}
        {otherUserTyping && (
          <View style={styles.typingContainer}>
            <Animated.Text style={[styles.typingDot, { opacity: dot1 }]}>{'•'}</Animated.Text>
            <Animated.Text style={[styles.typingDot, { opacity: dot2 }]}>{'•'}</Animated.Text>
            <Animated.Text style={[styles.typingDot, { opacity: dot3 }]}>{'•'}</Animated.Text>
            <Text style={styles.typingText}> typing</Text>
          </View>
        )}

        {/* Icebreaker suggestions */}
        {icebreakers.length > 0 && (
          <View style={styles.icebreakersContainer}>
            {icebreakers.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.icebreakerChip}
                onPress={() => handleIcebreakerTap(suggestion)}
              >
                <Text style={styles.icebreakerText} numberOfLines={2}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
            <Text style={styles.imageButtonText}>+</Text>
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor={Colors.gray[400]}
            style={styles.input}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Text style={styles.sendIcon}>{'↑'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  headerBack: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackText: {
    fontSize: 28,
    color: Colors.text.primary,
    marginTop: -2,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[200],
  },
  headerName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    flexShrink: 1,
  },
  headerMenu: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMenuText: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  menuDropdown: {
    position: 'absolute',
    top: 56,
    right: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  menuItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  menuItemText: {
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  readReceipt: {
    fontSize: FontSize.xs,
    color: Colors.text.light,
    alignSelf: 'flex-end',
    marginBottom: Spacing.sm,
    marginRight: 4,
  },
  keyboardView: {
    flex: 1,
  },
  messageList: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  imageBubble: {
    padding: Spacing.xs,
    overflow: 'hidden',
  },
  myMessage: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  myMessageText: {
    color: Colors.white,
  },
  theirMessageText: {
    color: Colors.text.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lockIcon: {
    fontSize: FontSize.xs,
    color: Colors.text.light,
  },
  messageTime: {
    fontSize: FontSize.xs,
    color: Colors.text.light,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.6)',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.md,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  typingDot: {
    fontSize: 20,
    color: Colors.text.light,
    marginHorizontal: 1,
  },
  typingText: {
    fontSize: FontSize.sm,
    color: Colors.text.light,
    fontStyle: 'italic',
  },
  icebreakersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  icebreakerChip: {
    backgroundColor: Colors.accentLight,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  icebreakerText: {
    fontSize: FontSize.sm,
    color: Colors.text.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    gap: Spacing.sm,
  },
  imageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  imageButtonText: {
    fontSize: 22,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
    marginTop: -1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    maxHeight: 100,
    color: Colors.text.primary,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  sendIcon: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyChatText: {
    fontSize: FontSize.md,
    color: Colors.text.light,
  },
});

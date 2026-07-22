import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';

export default function Photos() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [photos, setPhotos] = useState<string[]>([]);

  const pickImage = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to continue.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri;
      setPhotos(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 3 of 5</Text>
        <Text style={styles.title}>Add Photos</Text>
        <Text style={styles.subtitle}>Add at least 2 photos. Your first photo is your main profile picture.</Text>
      </View>

      <View style={styles.grid}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TouchableOpacity
            key={index}
            style={[styles.photoSlot, index === 0 && styles.primarySlot]}
            onPress={() => photos[index] ? removePhoto(index) : pickImage(index)}
            activeOpacity={0.7}
          >
            {photos[index] ? (
              <>
                <Image source={{ uri: photos[index] }} style={styles.photo} />
                <View style={styles.removeButton}>
                  <Text style={styles.removeText}>×</Text>
                </View>
              </>
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.plusIcon}>+</Text>
                {index === 0 && <Text style={styles.primaryLabel}>Main</Text>}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.photoCount}>{photos.length}/6 photos added</Text>
        <Button
          title="Continue"
          onPress={() => router.push({
            pathname: '/onboarding/prompts',
            params: { ...params, photoUris: JSON.stringify(photos) },
          })}
          disabled={photos.length < 2}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  step: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  photoSlot: {
    width: '31%',
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.gray[100],
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed',
  },
  primarySlot: {
    borderColor: Colors.accent,
    borderStyle: 'solid',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: FontWeight.bold,
    marginTop: -2,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    fontSize: 32,
    color: Colors.gray[400],
    fontWeight: FontWeight.bold,
  },
  primaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.xs,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    gap: Spacing.sm,
  },
  photoCount: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

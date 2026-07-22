import { Image, ImageStyle, StyleProp } from 'react-native';
import { useEffect } from 'react';

const prefetchedUrls = new Set<string>();

interface CachedImageProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
}

export function CachedImage({ uri, style }: CachedImageProps) {
  useEffect(() => {
    if (!prefetchedUrls.has(uri)) {
      Image.prefetch(uri);
      prefetchedUrls.add(uri);
    }
  }, [uri]);

  return <Image source={{ uri }} style={style} />;
}

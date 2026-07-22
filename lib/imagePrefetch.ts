import { Image } from 'react-native';

export function prefetchProfileImages(imageUrls: string[]) {
  imageUrls.forEach(url => {
    if (url) Image.prefetch(url);
  });
}

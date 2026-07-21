import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MoniStream',
    short_name: 'MoniStream',
    description: 'A seamless, nonstop audio experience.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#1DB954',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

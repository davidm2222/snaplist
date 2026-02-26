import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SnapList',
    short_name: 'SnapList',
    description: 'Capture books, movies, restaurants, and more — one box, zero friction.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

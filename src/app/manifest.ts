import type { MetadataRoute } from 'next';

// スマホの「ホーム画面に追加」用
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '請求管理システム',
    short_name: '請求管理',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#111827',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

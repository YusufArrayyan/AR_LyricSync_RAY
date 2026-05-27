# 🎤 AR Lyric Sync

> Pengalaman AR (Augmented Reality) berbasis browser untuk menampilkan lirik lagu secara sinkron dalam ruang 3D menggunakan WebXR.

## ✨ Fitur

- **WebXR AR Session** — Mode `immersive-ar` penuh menggunakan `@react-three/xr` v6
- **Hit-Test Placement** — Deteksi permukaan datar dan tempatkan lirik di dunia nyata
- **Audio Synchronization** — Lirik berubah otomatis sesuai waktu audio
- **Neon 3D Text** — Teks futuristik dengan efek emissive glow dan animasi floating
- **Fallback Mode** — Preview lirik 3D di browser desktop (tanpa AR)
- **DOM Overlay** — Instruksi dan kontrol UI di atas feed kamera AR

## 🛠 Teknologi

| Teknologi | Versi |
|---|---|
| React | 19.x |
| @react-three/fiber | 9.x |
| @react-three/drei | 10.x |
| @react-three/xr | 6.x |
| Three.js | 0.184.x |
| Vite | 8.x |

## 🚀 Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Letakkan file audio Anda
#    Salin file .mp3 ke: public/audio/placeholder.mp3
#    Atau ubah AUDIO_SRC di src/ARLyricSync.jsx

# 3. Jalankan dev server
npm run dev

# 4. Buka di browser
#    Desktop: http://localhost:5173 (mode fallback)
#    Mobile AR: Gunakan HTTPS (ngrok/tunnel) + Chrome Android
```

## 📱 Untuk Testing AR di Mobile

WebXR membutuhkan HTTPS. Gunakan tunnel seperti:

```bash
# Instal ngrok lalu jalankan
npx ngrok http 5173
```

Buka URL HTTPS dari ngrok di Chrome Android.

## 🎵 Cara Mengganti Audio & Lirik

Edit file `src/ARLyricSync.jsx`:

```js
// Ganti URL audio
const AUDIO_SRC = '/audio/your-song.mp3'

// Ganti array lirik (waktu dalam detik)
const LYRICS = [
  { time: 0, text: 'Lirik baris pertama...' },
  { time: 5, text: 'Lirik baris kedua...' },
  // ...
]
```

## 📁 Struktur Project

```
src/
├── ARLyricSync.jsx   ← Komponen utama (single file)
├── App.jsx           ← Entry point
├── App.css           ← Animasi global
├── index.css         ← CSS reset
└── main.jsx          ← React mount
public/
└── audio/
    └── placeholder.mp3  ← Letakkan file audio di sini
```

## 📜 Lisensi

MIT

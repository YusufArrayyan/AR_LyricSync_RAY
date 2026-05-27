/**
 * ARLyricSync.jsx
 * ===============
 * Komponen React lengkap untuk pengalaman "AR Lyric Sync".
 * Menggunakan React Three Fiber, @react-three/drei, dan @react-three/xr v6.
 *
 * Fitur:
 * - WebXR AR session (immersive-ar) via createXRStore
 * - Hit-test untuk deteksi permukaan datar
 * - Tap untuk menempatkan anchor teks lirik
 * - Audio playback + sinkronisasi lirik realtime
 * - Teks neon futuristik dengan animasi floating
 * - DOM Overlay instruksi & fallback non-XR
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, DeviceOrientationControls } from '@react-three/drei'
import {
  XR,
  createXRStore,
  useXRHitTest,
  useXRRequestHitTest,
  XRDomOverlay,
  IfInSessionMode,
  useXR,
} from '@react-three/xr'
import { Matrix4, Vector3, VideoTexture, SRGBColorSpace } from 'three'

// ─────────────────────────────────────────────
// Data lirik — array { time (detik), text }
// ─────────────────────────────────────────────
const LYRICS = [
  { time: 0,  text: '♪ (Instrumental Intro) ♪' },
  { time: 14, text: '♪ Unfortunately, I am ♪' },
  { time: 17, text: '♪ My own dog, my own fur companion ♪' },
  { time: 20, text: '♪ My own old lady on a forum ♪' },
  { time: 23, text: '♪ Who types in glittery decorum ♪' },
  { time: 26, text: '♪ Unfortunately, I take ♪' },
  { time: 29, text: '♪ Myself out walking every day and ♪' },
  { time: 32, text: '♪ I hand my legs to the feet and ♪' },
  { time: 35, text: '♪ I give my head to the leash ♪' },
  { time: 39, text: '♪ Every other day, I\'m wondering ♪' },
  { time: 42, text: '♪ "What\'s a human being gotta be like?" ♪' },
  { time: 46, text: '♪ "What\'s a way to just be competent?" ♪' },
  { time: 49, text: '♪ These sweet instincts ruin my life ♪' },
  { time: 53, text: '♪ Every other day, I\'m wondering ♪' },
  { time: 56, text: '♪ "Was it a mistake to try and define ♪' },
  { time: 60, text: '♪ What I\'m certain\'s mad incompetence?" ♪' },
  { time: 63, text: '♪ These sweet instincts ruin my life ♪' },
  { time: 68, text: '♪ (Instrumental) ♪' },
]

// URL audio placeholder — ganti dengan file audio Anda
// Letakkan file .mp3 di folder /public dan gunakan path relatif, contoh: '/audio/song.mp3'
// Atau gunakan URL CORS-friendly. Contoh di bawah menggunakan placeholder.
const AUDIO_SRC = `${import.meta.env.BASE_URL}audio/impostorsyndrome.mp3`

// ─────────────────────────────────────────────
// Buat XR Store (di luar komponen React)
// ─────────────────────────────────────────────
const store = createXRStore({
  hitTest: true,           // Aktifkan fitur hit-test
  domOverlay: true,        // Aktifkan DOM overlay untuk UI
  anchors: true,           // Aktifkan anchors
  handTracking: false,     // Tidak perlu hand tracking
  meshDetection: false,    // Tidak perlu mesh detection
  planeDetection: true,    // Deteksi plane untuk hit-test
  depthSensing: false,
})

// ─────────────────────────────────────────────
// Helper: cari lirik berdasarkan waktu audio
// ─────────────────────────────────────────────
function getCurrentLyric(currentTime) {
  let result = LYRICS[0]
  for (let i = LYRICS.length - 1; i >= 0; i--) {
    if (currentTime >= LYRICS[i].time) {
      result = LYRICS[i]
      break
    }
  }
  return result.text
}

// ─────────────────────────────────────────────
// Helper Matrix/Vector (dibuat sekali di luar render loop)
// ─────────────────────────────────────────────
const _mat4 = new Matrix4()
const _vec3 = new Vector3()

// ─────────────────────────────────────────────
// Komponen: Reticle (indikator hit-test)
// Tampil saat belum ada anchor, menunjukkan
// posisi permukaan yang terdeteksi.
// ─────────────────────────────────────────────
function HitTestReticle({ onPositionUpdate }) {
  const reticleRef = useRef()
  const [visible, setVisible] = useState(false)

  // useXRHitTest — berjalan setiap frame selama sesi AR
  useXRHitTest(
    (results, getWorldMatrix) => {
      if (results.length === 0) {
        setVisible(false)
        return
      }
      // Ambil matrix dari hasil hit-test pertama
      getWorldMatrix(_mat4, results[0])
      _vec3.setFromMatrixPosition(_mat4)

      if (reticleRef.current) {
        reticleRef.current.position.copy(_vec3)
        reticleRef.current.rotation.set(-Math.PI / 2, 0, 0)
      }
      setVisible(true)
      // Kirim posisi ke parent untuk digunakan saat tap
      onPositionUpdate(_vec3.clone())
    },
    'viewer', // Ray dari posisi viewer/kamera
    'plane'   // Hanya hit-test terhadap plane
  )

  if (!visible) return null

  return (
    <mesh ref={reticleRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.08, 0.1, 32]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.7} />
    </mesh>
  )
}

// ─────────────────────────────────────────────
// Komponen: Neon Lyric Text (teks 3D yang tampil
// di posisi anchor dengan animasi floating)
// ─────────────────────────────────────────────
function NeonLyricText({ position, audioRef }) {
  const textRef = useRef()
  const [currentText, setCurrentText] = useState(LYRICS[0].text)
  const baseY = position[1]

  // Baca currentTime audio setiap frame, update lirik
  useFrame((state) => {
    if (!textRef.current) return

    const elapsed = state.clock.getElapsedTime()

    // Animasi floating — naik turun halus menggunakan sin
    textRef.current.position.y = baseY + Math.sin(elapsed * 1.5) * 0.02

    // Animasi skala subtle — "breathing" effect
    const scalePulse = 1 + Math.sin(elapsed * 2) * 0.03
    textRef.current.scale.set(scalePulse, scalePulse, scalePulse)

    // Sinkronisasi lirik berdasarkan waktu audio
    if (audioRef.current && !audioRef.current.paused) {
      const time = audioRef.current.currentTime
      const newText = getCurrentLyric(time)
      if (newText !== currentText) {
        setCurrentText(newText)
      }
    }
  })

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={0.06}
      maxWidth={1.2}
      textAlign="center"
      anchorX="center"
      anchorY="middle"
      font="https://fonts.gstatic.com/s/orbitron/v31/yMJMMIlzdpvBhQQL_SC3X9Qdm-Y.ttf"
      outlineWidth={0.003}
      outlineColor="#001a33"
    >
      {currentText}
      {/* Material neon — emissive glow */}
      <meshStandardMaterial
        color="#00e5ff"
        emissive="#00e5ff"
        emissiveIntensity={2.5}
        toneMapped={false}
      />
    </Text>
  )
}

// ─────────────────────────────────────────────
// Komponen: Glow Ring dekoratif di bawah teks
// ─────────────────────────────────────────────
function GlowRing({ position }) {
  const ringRef = useRef()

  useFrame((state) => {
    if (!ringRef.current) return
    const t = state.clock.getElapsedTime()
    // Rotasi perlahan
    ringRef.current.rotation.z = t * 0.3
    // Pulse opacity
    ringRef.current.material.opacity = 0.3 + Math.sin(t * 2) * 0.15
  })

  return (
    <mesh
      ref={ringRef}
      position={[position[0], position[1] - 0.02, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[0.12, 0.15, 64]} />
      <meshBasicMaterial
        color="#ff00ff"
        transparent
        opacity={0.4}
      />
    </mesh>
  )
}

// ─────────────────────────────────────────────
// Komponen: Particle dots di sekitar teks
// ─────────────────────────────────────────────
function FloatingParticles({ position }) {
  const groupRef = useRef()

  // Buat posisi partikel acak sekali saja
  const particles = useMemo(() => {
    const arr = []
    for (let i = 0; i < 20; i++) {
      arr.push({
        offset: [
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.4,
        ],
        speed: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
      })
    }
    return arr
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i]
      child.position.x = position[0] + p.offset[0] + Math.sin(t * p.speed + p.phase) * 0.05
      child.position.y = position[1] + p.offset[1] + Math.cos(t * p.speed + p.phase) * 0.04
      child.position.z = position[2] + p.offset[2]
      child.material.opacity = 0.3 + Math.sin(t * p.speed * 2 + p.phase) * 0.3
    })
  })

  return (
    <group ref={groupRef}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────
// Komponen: AR Scene — mengelola hit-test,
// penempatan anchor, dan rendering teks lirik
// ─────────────────────────────────────────────
function ARScene({ audioRef, onAnchorPlaced }) {
  const [anchorPos, setAnchorPos] = useState(null)       // Posisi anchor final
  const latestHitPos = useRef(null)                      // Posisi hit-test terbaru
  const requestHitTest = useXRRequestHitTest()

  // Callback dari reticle — simpan posisi hit terbaru
  const handlePositionUpdate = useCallback((pos) => {
    latestHitPos.current = pos
  }, [])

  // Handler tap — tempatkan anchor di posisi terakhir yang terdeteksi
  const handlePlacement = useCallback(async () => {
    if (anchorPos) return // Anchor sudah ditempatkan

    // Coba gunakan posisi hit-test yang sudah ada dari reticle
    if (latestHitPos.current) {
      const pos = latestHitPos.current.clone()
      setAnchorPos([pos.x, pos.y + 0.15, pos.z])
      onAnchorPlaced()

      // Mulai audio setelah anchor ditempatkan
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch((e) => {
          console.warn('Audio play gagal:', e)
        })
      }
      return
    }

    // Fallback: gunakan useXRRequestHitTest untuk one-time hit-test
    try {
      const hitTestResult = await requestHitTest('viewer', 'plane')
      const { results, getWorldMatrix } = hitTestResult
      if (results && results.length > 0) {
        getWorldMatrix(_mat4, results[0])
        const pos = new Vector3().setFromMatrixPosition(_mat4)
        setAnchorPos([pos.x, pos.y + 0.15, pos.z])
        onAnchorPlaced()

        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch((e) => {
            console.warn('Audio play gagal:', e)
          })
        }
      }
    } catch (err) {
      console.warn('Hit-test request gagal:', err)
    }
  }, [anchorPos, audioRef, onAnchorPlaced, requestHitTest])

  return (
    <>
      {/* Ambient light agar material standard terlihat */}
      <ambientLight intensity={1} />
      <pointLight position={[0, 2, 0]} intensity={0.5} />

      {/* Tampilkan reticle selama belum ada anchor */}
      {!anchorPos && (
        <HitTestReticle onPositionUpdate={handlePositionUpdate} />
      )}

      {/* Teks lirik AR — muncul setelah anchor ditempatkan */}
      {anchorPos && (
        <>
          <NeonLyricText position={anchorPos} audioRef={audioRef} />
          <GlowRing position={anchorPos} />
          <FloatingParticles position={anchorPos} />
        </>
      )}

      {/* Tombol placement di DOM Overlay */}
      <IfInSessionMode allow="immersive-ar">
        <XRDomOverlay>
          <div style={styles.overlayContainer}>
            {!anchorPos && (
              <button
                onClick={handlePlacement}
                style={styles.placementButton}
                id="btn-place-lyric"
              >
                ✦ TAP UNTUK MENEMPATKAN LIRIK ✦
              </button>
            )}
            {anchorPos && (
              <div style={styles.nowPlaying}>
                <span style={styles.nowPlayingDot}>●</span>
                <span>Sedang memutar lirik...</span>
              </div>
            )}
          </div>
        </XRDomOverlay>
      </IfInSessionMode>
    </>
  )
}

// ─────────────────────────────────────────────
// Komponen: Non-AR Fallback Scene
// Tampil saat tidak dalam sesi AR
// ─────────────────────────────────────────────
function FallbackScene({ audioRef }) {
  const [video, setVideo] = useState(null)
  
  useEffect(() => {
    // Meminta akses ke kamera belakang HP
    let currentStream = null
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        })
        currentStream = stream
        const vid = document.createElement('video')
        vid.srcObject = stream
        vid.playsInline = true
        vid.autoplay = true
        vid.muted = true
        vid.play()
        setVideo(vid)
      } catch (err) {
        console.warn('Kamera gagal diakses untuk mode Fallback', err)
      }
    }
    
    initCamera()
    
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const bgTexture = useMemo(() => {
    if (video) {
      const tex = new VideoTexture(video)
      tex.colorSpace = SRGBColorSpace
      return tex
    }
    return null
  }, [video])

  return (
    <>
      <ambientLight intensity={1} />
      <pointLight position={[0, 2, 2]} intensity={0.8} />
      
      {/* Tampilkan feed kamera sebagai background canvas */}
      {bgTexture && (
         <primitive attach="background" object={bgTexture} />
      )}
      
      {/* Menggunakan sensor Gyroscope (Magic Window) */}
      <DeviceOrientationControls />

      <NeonLyricText position={[0, 0, -3]} audioRef={audioRef} />
      <GlowRing position={[0, -0.5, -3]} />
      <FloatingParticles position={[0, 0, -3]} />
    </>
  )
}

// ─────────────────────────────────────────────
// Komponen Utama: ARLyricSync
// ─────────────────────────────────────────────
export default function ARLyricSync() {
  const audioRef = useRef(null)
  const [isPlaced, setIsPlaced] = useState(false)
  const [arSupported, setArSupported] = useState(null) // null = checking
  const [isInAR, setIsInAR] = useState(false)
  const [fallbackPlaying, setFallbackPlaying] = useState(false)

  // Cek apakah WebXR AR didukung
  useEffect(() => {
    if (navigator.xr) {
      navigator.xr
        .isSessionSupported('immersive-ar')
        .then((supported) => setArSupported(supported))
        .catch(() => setArSupported(false))
    } else {
      setArSupported(false)
    }
  }, [])

  // Handler untuk mode fallback (non-AR)
  const handleFallbackPlay = async () => {
    // Wajib untuk iOS 13+: meminta izin sensor gyroscope dari interaksi pengguna
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission()
        if (permission !== 'granted') {
          console.warn('Izin sensor gerak (Gyroscope) ditolak.')
        }
      } catch (err) {
        console.warn('Gagal meminta izin sensor:', err)
      }
    }

    if (audioRef.current) {
      if (fallbackPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch((e) => console.warn('Play gagal:', e))
      }
      setFallbackPlaying(!fallbackPlaying)
    }
  }

  return (
    <div style={styles.root}>
      {/* Elemen audio HTML native */}
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        preload="auto"
        crossOrigin="anonymous"
        loop
      />

      {/* ── HEADER UI ──────────────────────── */}
      <div style={styles.header}>
        <h1 style={styles.title}>AR LYRIC SYNC</h1>
        <p style={styles.subtitle}>Immersive Augmented Reality Lyrics</p>
      </div>

      {/* ── KONTROL AR ─────────────────────── */}
      <div style={styles.controls}>
        {arSupported === null && (
          <div style={styles.statusText}>Memeriksa dukungan WebXR...</div>
        )}

        {arSupported === true && (
          <button
            onClick={() => {
              store.enterAR()
              setIsInAR(true)
            }}
            style={styles.arButton}
            id="btn-enter-ar"
          >
            🚀 MASUK MODE AR
          </button>
        )}

        {arSupported === false && (
          <div style={styles.fallbackBox}>
            <p style={styles.fallbackText}>
              ⚠ WebXR AR tidak tersedia di perangkat ini.
            </p>
            <p style={styles.fallbackHint}>
              Apple Safari (iOS) memblokir WebXR secara bawaan. Namun, Anda masih bisa mencoba mode <strong>"Magic Window AR"</strong>.
              <br/><br/>
              Kami akan menggunakan kamera dan sensor gerak HP Anda (Anda harus memberikan Izin jika diminta).
            </p>
            <button
              onClick={handleFallbackPlay}
              style={styles.fallbackButton}
              id="btn-fallback-play"
            >
              {fallbackPlaying ? '⏸ Stop Magic Window' : '✨ Mulai Magic Window AR'}
            </button>
          </div>
        )}

        {isInAR && !isPlaced && (
          <div style={styles.instructionOverlay}>
            <div style={styles.instructionCard}>
              <div style={styles.instructionIcon}>📍</div>
              <p style={styles.instructionText}>
                Arahkan kamera ke permukaan datar, lalu <strong>tap tombol</strong> untuk menempatkan lirik
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── CANVAS 3D ──────────────────────── */}
      <div style={styles.canvasContainer}>
        <Canvas
          style={styles.canvas}
          gl={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance',
          }}
          camera={{ position: [0, 0, 0.5], fov: 70, near: 0.01, far: 100 }}
        >
          <XR store={store}>
            <ARScene
              audioRef={audioRef}
              onAnchorPlaced={() => setIsPlaced(true)}
            />
          </XR>

          {/* Fallback scene saat tidak dalam AR */}
          {arSupported === false && fallbackPlaying && (
            <FallbackScene audioRef={audioRef} />
          )}
        </Canvas>
      </div>

      {/* ── FOOTER ─────────────────────────── */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          Built with React Three Fiber + @react-three/xr
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Styles (inline untuk single-file)
// ─────────────────────────────────────────────
const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 40%, #1b1035 100%)',
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    color: '#e0e0e0',
    overflow: 'hidden',
  },

  header: {
    padding: '20px 24px 10px',
    textAlign: 'center',
    zIndex: 10,
    position: 'relative',
  },

  title: {
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: 800,
    letterSpacing: '0.15em',
    background: 'linear-gradient(90deg, #00e5ff, #7c4dff, #ff00ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: 'none',
  },

  subtitle: {
    margin: '4px 0 0',
    fontSize: '0.75rem',
    color: '#8892b0',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },

  controls: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 20px',
    zIndex: 10,
    position: 'relative',
  },

  statusText: {
    fontSize: '0.9rem',
    color: '#64ffda',
    animation: 'pulse 1.5s infinite',
  },

  arButton: {
    padding: '14px 36px',
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#fff',
    background: 'linear-gradient(135deg, #7c4dff 0%, #00e5ff 100%)',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 0 25px rgba(124, 77, 255, 0.5), 0 0 60px rgba(0, 229, 255, 0.2)',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
  },

  fallbackBox: {
    textAlign: 'center',
    padding: '16px 24px',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px)',
    maxWidth: '400px',
  },

  fallbackText: {
    fontSize: '0.95rem',
    color: '#ffab40',
    margin: '0 0 8px',
  },

  fallbackHint: {
    fontSize: '0.78rem',
    color: '#8892b0',
    margin: '0 0 14px',
    lineHeight: 1.5,
  },

  fallbackButton: {
    padding: '10px 28px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #ff6f00, #ff00ff)',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(255, 0, 255, 0.3)',
    transition: 'all 0.3s ease',
  },

  instructionOverlay: {
    position: 'fixed',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    pointerEvents: 'none',
  },

  instructionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 20px',
    borderRadius: '16px',
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(0, 229, 255, 0.2)',
    boxShadow: '0 0 30px rgba(0, 229, 255, 0.15)',
  },

  instructionIcon: {
    fontSize: '1.5rem',
  },

  instructionText: {
    fontSize: '0.85rem',
    color: '#e0e0e0',
    margin: 0,
    lineHeight: 1.4,
  },

  canvasContainer: {
    flex: 1,
    position: 'relative',
    minHeight: 0,
  },

  canvas: {
    width: '100%',
    height: '100%',
    touchAction: 'none',
  },

  footer: {
    padding: '8px 16px',
    textAlign: 'center',
    zIndex: 10,
    position: 'relative',
  },

  footerText: {
    margin: 0,
    fontSize: '0.65rem',
    color: '#4a5568',
    letterSpacing: '0.1em',
  },

  // Styles untuk DOM Overlay (di dalam AR session)
  overlayContainer: {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    pointerEvents: 'auto',
  },

  placementButton: {
    padding: '16px 32px',
    fontSize: '0.95rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#0a0a1a',
    background: 'linear-gradient(135deg, #00e5ff, #64ffda)',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 0 30px rgba(0, 229, 255, 0.6)',
    animation: 'pulse-glow 2s infinite',
  },

  nowPlaying: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 24px',
    borderRadius: '30px',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    color: '#64ffda',
    fontSize: '0.85rem',
    fontWeight: 500,
    border: '1px solid rgba(100, 255, 218, 0.2)',
  },

  nowPlayingDot: {
    color: '#ff4081',
    animation: 'blink 1s infinite',
    fontSize: '0.7rem',
  },
}

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
} from '@react-three/xr'
import { Matrix4, Vector3 } from 'three'
import { Play, Pause, Disc3, Info, Maximize } from 'lucide-react'

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

const AUDIO_SRC = `${import.meta.env.BASE_URL}audio/impostorsyndrome.mp3`

// ─────────────────────────────────────────────
// Buat XR Store
// ─────────────────────────────────────────────
const store = createXRStore({
  hitTest: true,
  domOverlay: true,
  anchors: true,
  planeDetection: true,
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

const _mat4 = new Matrix4()
const _vec3 = new Vector3()

// ─────────────────────────────────────────────
// Komponen: Reticle (indikator hit-test)
// ─────────────────────────────────────────────
function HitTestReticle({ onPositionUpdate }) {
  const reticleRef = useRef()
  const [visible, setVisible] = useState(false)

  useXRHitTest(
    (results, getWorldMatrix) => {
      if (results.length === 0) {
        setVisible(false)
        return
      }
      getWorldMatrix(_mat4, results[0])
      _vec3.setFromMatrixPosition(_mat4)

      if (reticleRef.current) {
        reticleRef.current.position.copy(_vec3)
        reticleRef.current.rotation.set(-Math.PI / 2, 0, 0)
      }
      setVisible(true)
      onPositionUpdate(_vec3.clone())
    },
    'viewer',
    'plane'
  )

  if (!visible) return null

  return (
    <mesh ref={reticleRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.08, 0.1, 32]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
    </mesh>
  )
}

// ─────────────────────────────────────────────
// Komponen: Minimal Lyric Text
// ─────────────────────────────────────────────
function MinimalLyricText({ position, audioRef }) {
  const textRef = useRef()
  const [currentText, setCurrentText] = useState(LYRICS[0].text)
  const baseY = position[1]

  useFrame((state) => {
    if (!textRef.current) return
    const elapsed = state.clock.getElapsedTime()
    
    // Subtle floating
    textRef.current.position.y = baseY + Math.sin(elapsed * 2) * 0.015

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
      font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf"
      color="#ffffff"
    >
      {currentText}
      <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
    </Text>
  )
}

// ─────────────────────────────────────────────
// Komponen: Subtle Glow Base
// ─────────────────────────────────────────────
function GlowBase({ position }) {
  return (
    <mesh
      position={[position[0], position[1] - 0.02, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[0.15, 32]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
    </mesh>
  )
}

// ─────────────────────────────────────────────
// Komponen: AR Scene
// ─────────────────────────────────────────────
function ARScene({ audioRef, onAnchorPlaced }) {
  const [anchorPos, setAnchorPos] = useState(null)
  const latestHitPos = useRef(null)
  const requestHitTest = useXRRequestHitTest()

  const handlePositionUpdate = useCallback((pos) => {
    latestHitPos.current = pos
  }, [])

  const handlePlacement = useCallback(async () => {
    if (anchorPos) return

    if (latestHitPos.current) {
      const pos = latestHitPos.current.clone()
      setAnchorPos([pos.x, pos.y + 0.15, pos.z])
      onAnchorPlaced()

      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
      return
    }

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
          audioRef.current.play().catch(() => {})
        }
      }
    } catch (err) {
      console.warn('Hit-test request gagal:', err)
    }
  }, [anchorPos, audioRef, onAnchorPlaced, requestHitTest])

  return (
    <>
      <ambientLight intensity={1} />
      
      {!anchorPos && (
        <HitTestReticle onPositionUpdate={handlePositionUpdate} />
      )}

      {anchorPos && (
        <>
          <MinimalLyricText position={anchorPos} audioRef={audioRef} />
          <GlowBase position={anchorPos} />
        </>
      )}

      <IfInSessionMode allow="immersive-ar">
        <XRDomOverlay>
          <div className="dom-overlay-container">
            {!anchorPos && (
              <button onClick={handlePlacement} className="btn-primary" id="btn-place-lyric">
                Tap to Place
              </button>
            )}
            {anchorPos && (
              <div className="playing-indicator">
                <Disc3 size={16} className="spin-anim" />
                <span>Now Playing</span>
              </div>
            )}
          </div>
        </XRDomOverlay>
      </IfInSessionMode>
    </>
  )
}

// ─────────────────────────────────────────────
// Komponen: Non-AR Fallback Scene (Magic Window)
// ─────────────────────────────────────────────
function FallbackScene({ audioRef }) {
  return (
    <>
      <ambientLight intensity={1} />
      <DeviceOrientationControls />
      <MinimalLyricText position={[0, 0, -2]} audioRef={audioRef} />
      <GlowBase position={[0, -0.2, -2]} />
    </>
  )
}

// ─────────────────────────────────────────────
// Komponen Utama: ARLyricSync
// ─────────────────────────────────────────────
export default function ARLyricSync() {
  const audioRef = useRef(null)
  const videoRef = useRef(null)
  const [isPlaced, setIsPlaced] = useState(false)
  const [arSupported, setArSupported] = useState(null)
  const [isInAR, setIsInAR] = useState(false)
  const [fallbackPlaying, setFallbackPlaying] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)

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

  // Start HTML Camera background
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraActive(true)
      }
    } catch (err) {
      console.warn('Gagal akses kamera:', err)
    }
  }

  // Stop HTML Camera background
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const handleFallbackPlay = async () => {
    // Gyroscope permission request (Safari iOS)
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission()
        if (permission !== 'granted') {
          console.warn('Gyroscope permission denied.')
        }
      } catch (err) {
        console.warn('Failed to request gyro permission:', err)
      }
    }

    if (audioRef.current) {
      if (fallbackPlaying) {
        audioRef.current.pause()
        stopCamera()
      } else {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
        startCamera()
      }
      setFallbackPlaying(!fallbackPlaying)
    }
  }

  const handleEnterAR = () => {
    store.enterAR()
    setIsInAR(true)
  }

  // Hide the solid background if camera is active or in AR
  const isTransparentBg = cameraActive || isInAR

  return (
    <div className={`app-root ${isTransparentBg ? 'transparent-bg' : 'solid-bg'}`}>
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        preload="auto"
        crossOrigin="anonymous"
        loop
      />

      {/* HTML Video Background for Fallback Mode */}
      <video
        ref={videoRef}
        className="camera-background"
        playsInline
        autoPlay
        muted
      />

      {/* ── HEADER ── */}
      {!isInAR && !fallbackPlaying && (
        <header className="app-header">
          <h1 className="logo">LYRIC SYNC</h1>
          <p className="subtitle">Minimalist AR Experience</p>
        </header>
      )}

      {/* ── CONTROLS ── */}
      {!isInAR && !fallbackPlaying && (
        <main className="app-controls">
          {arSupported === null && (
            <p className="text-muted">Checking compatibility...</p>
          )}

          {arSupported === true && (
            <div className="card">
              <div className="card-icon"><Maximize size={24} /></div>
              <h2>AR Ready</h2>
              <p>Experience lyrics in your real environment.</p>
              <button onClick={handleEnterAR} className="btn-primary">
                Launch AR Mode
              </button>
            </div>
          )}

          {arSupported === false && (
            <div className="card">
              <div className="card-icon"><Info size={24} /></div>
              <h2>WebXR Not Supported</h2>
              <p>Your browser (e.g. iOS Safari) blocks native WebXR.</p>
              
              <div className="divider" />
              
              <p className="small-text">
                Try <strong>Magic Window</strong> mode instead. It uses your camera and motion sensors.
              </p>
              <button onClick={handleFallbackPlay} className="btn-outline">
                <Play size={18} /> Start Magic Window
              </button>
            </div>
          )}
        </main>
      )}

      {/* ── MAGIC WINDOW UI OVERLAY ── */}
      {!isInAR && fallbackPlaying && (
        <div className="magic-window-overlay">
          <div className="playing-indicator">
            <Disc3 size={16} className="spin-anim" />
            <span>Now Playing</span>
          </div>
          <button onClick={handleFallbackPlay} className="btn-stop-magic">
            <Pause size={18} /> Stop
          </button>
        </div>
      )}

      {/* ── INSTRUCTION OVERLAY (AR) ── */}
      {isInAR && !isPlaced && (
        <div className="ar-instruction">
          <p>Scan a flat surface and tap to place.</p>
        </div>
      )}

      {/* ── 3D CANVAS ── */}
      <div className="canvas-wrapper">
        <Canvas
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 0, 0.5], fov: 70 }}
        >
          <XR store={store}>
            <ARScene audioRef={audioRef} onAnchorPlaced={() => setIsPlaced(true)} />
          </XR>

          {arSupported === false && fallbackPlaying && (
            <FallbackScene audioRef={audioRef} />
          )}
        </Canvas>
      </div>
    </div>
  )
}

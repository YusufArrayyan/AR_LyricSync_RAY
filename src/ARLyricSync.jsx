import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
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
import { Play, Pause, Disc3, Info, Maximize, MousePointerClick, Hand } from 'lucide-react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
// ─────────────────────────────────────────────
// Data lirik — array { time (detik), text }
// ─────────────────────────────────────────────
const LYRICS = [
  { time: 0, text: "♪ (Instrumental Intro) ♪" },
  { time: 2, text: "♪ Unfortunately, I am ♪" },
  { time: 6, text: "♪ My own dog, my own fur companion ♪" },
  { time: 10, text: "♪ My own old lady on a forum ♪" },
  { time: 15, text: "♪ Who types in glittery decorum ♪" },
  { time: 20, text: "♪ Unfortunately, I take ♪" },
  { time: 24, text: "♪ Myself out walking every day and ♪" },
  { time: 28, text: "♪ I hand my legs to the feet and ♪" },
  { time: 32, text: "♪ I give my head to the leash ♪" },
  { time: 34, text: "♪ Every other day, I'm wondering ♪" },
  { time: 39, text: "♪ What's a human being gotta be like? ♪" },
  { time: 43, text: "♪ What's a way to just be competent? ♪" },
  { time: 46, text: "♪ These sweet instincts ruin my life ♪" },
  { time: 52, text: "♪ Every other day, I'm wondering ♪" },
  { time: 56, text: "♪ Was it a mistake to try and define ♪" },
  { time: 60, text: "♪ What I'm certain's mad incompetence? ♪" },
  { time: 64, text: "♪ These sweet instincts ruin my life ♪" },
  { time: 74, text: "♪ I can't smell well, or tell the time ♪" },
  { time: 78, text: "♪ Not K through eight, nor K dash nine ♪" },
  { time: 82, text: "♪ For human, grossly underqualified ♪" },
  { time: 85, text: "♪ For canine, grossly overqualified ♪" },
  { time: 90, text: "♪ I don't blend in at PetSmart ♪" },
  { time: 94, text: "♪ And that truth remains for the Walmart ♪" },
  { time: 97, text: "♪ 'Cause in either case, they say to me ♪" },
  { time: 100, text: "♪ What the fuck is lost in aisle three? ♪" },
  { time: 101, text: "♪ Every other day, I'm wondering ♪" },
  { time: 105, text: "♪ What's a human being gotta be like? ♪" },
  { time: 109, text: "♪ What's a way to just be competent? ♪" },
  { time: 113, text: "♪ These sweet instincts ruin my life ♪" },
  { time: 114, text: "♪ Every other day, I'm wondering ♪" },
  { time: 118, text: "♪ Was it a mistake to try and define ♪" },
  { time: 123, text: "♪ What I'm certain's mad incompetence? ♪" },
  { time: 128, text: "♪ These sweet instincts ruin my life ♪" },
  { time: 135, text: "♪ (Da, da-da, da-da, da-da-da) ♪" },
  { time: 140, text: "♪ (Da, da-da, da-da, da-da-da) ♪" },
  { time: 144, text: "♪ (Da, da-da, da-da, da-da-da) ♪" },
  { time: 149, text: "♪ (Da, da-da, da-da, da-da) ♪" },
  { time: 170, text: "♪ Just watch me, moving far away ♪" },
  { time: 174, text: "♪ Nobody even knows my name, and ♪" },
  { time: 178, text: "♪ No one suspects that I'm not fine, and ♪" },
  { time: 182, text: "♪ Nobody outs behavioral Frankenstein ♪" },
  { time: 183, text: "♪ Just look at Victor in LA ♪" },
  { time: 188, text: "♪ And Syd with the Y at U of A ♪" },
  { time: 192, text: "♪ And all the majors at the labels ♪" },
  { time: 195, text: "♪ Rebooting soon as I am able ♪" },
  { time: 198, text: "♪ Every other day, I'm wondering ♪" },
  { time: 202, text: "♪ What's a human being gotta be like? ♪" },
  { time: 206, text: "♪ What's a way to just be competent? ♪" },
  { time: 210, text: "♪ These sweet instincts ruin my life ♪" },
  { time: 219, text: "♪ Every other day, I'm wondering ♪" },
  { time: 224, text: "♪ Was it a mistake to try and define ♪" },
  { time: 229, text: "♪ What I'm certain's mad incompetence? ♪" },
  { time: 232, text: "♪ These sweet instincts ruin my life ♪" },
  { time: 235, text: "♪ Da-da-da-da-da-da, da-da-da ♪" },
  { time: 239, text: "♪ Da-da-da-da-da-da, da-da-da, da ♪" },
  { time: 244, text: "♪ Da-da-da-da-da-da, da-da-da ♪" },
  { time: 248, text: "♪ These sweet instincts ruin my life ♪" },
  { time: 252, text: "♪ Da-da-da-da-da-da, da-da-da ♪" },
  { time: 256, text: "♪ Da-da-da-da-da-da, da-da-da, da ♪" },
  { time: 260, text: "♪ Da-da-da-da-da-da, da-da-da ♪" },
  { time: 264, text: "♪ These sweet instincts ruin my life ♪" },
  { time: 277, text: "♪ Attention, passengers, we've now reached our destination ♪" },
  { time: 281, text: "♪ We hope you enjoyed the flight, now have a nice day ♪" }
]

// Offset dikembalikan ke 0 karena array LYRICS sudah disesuaikan
const LYRIC_OFFSET = 0

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
  const adjustedTime = currentTime - LYRIC_OFFSET
  let result = LYRICS[0]
  for (let i = LYRICS.length - 1; i >= 0; i--) {
    if (adjustedTime >= LYRICS[i].time) {
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

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scale.set(0, 0, 0)
    }
  }, [])

  useFrame((state) => {
    if (!textRef.current) return
    const elapsed = state.clock.getElapsedTime()
    
    textRef.current.scale.lerp(new Vector3(1, 1, 1), 0.1)
    textRef.current.position.y = baseY + Math.sin(elapsed * 2) * 0.02

    if (audioRef.current && !audioRef.current.paused) {
      const time = audioRef.current.currentTime
      const newText = getCurrentLyric(time)
      if (newText !== currentText) {
        setCurrentText(newText)
        textRef.current.scale.set(1.2, 1.2, 1.2)
      }
    }
  })

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={0.22}
      maxWidth={2.5}
      textAlign="center"
      anchorX="center"
      anchorY="middle"
      font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf"
      color="#ffffff"
      outlineWidth={0.015}
      outlineColor="#000000"
    >
      {currentText}
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
// Komponen: Partikel Vibe VR Musik
// ─────────────────────────────────────────────
function MusicParticles() {
  const particlesRef = useRef()

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  // Generate titik-titik melayang
  const particles = useMemo(() => {
    const arr = []
    for (let i = 0; i < 150; i++) {
      const x = (Math.random() - 0.5) * 15
      const y = (Math.random() - 0.5) * 15
      const z = (Math.random() - 0.5) * 15
      arr.push(<mesh key={i} position={[x, y, z]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={Math.random() * 0.5 + 0.1} />
      </mesh>)
    }
    return arr
  }, [])

  return <group ref={particlesRef}>{particles}</group>
}

// ─────────────────────────────────────────────
// Komponen: Non-AR Fallback Scene (Magic Window)
// ─────────────────────────────────────────────
function FallbackScene({ audioRef, isPlaced, handPosRef }) {
  const { camera } = useThree()
  const groupRef = useRef()

  useFrame(() => {
    if (groupRef.current && !isPlaced) {
      // Mulai dari arah depan tengah
      const dir = new Vector3(0, 0, -1)
      
      // Jika tangan terdeteksi, geser arah sesuai posisi tangan
      if (handPosRef && handPosRef.current) {
        // Asumsi webcam biasanya di-mirror, kita balik sumbu X-nya
        dir.x = -handPosRef.current.x * 2.0
        dir.y = handPosRef.current.y * 2.0
      }
      
      dir.normalize()
      dir.applyQuaternion(camera.quaternion)
      dir.multiplyScalar(3) // Jarak 3 meter
      
      const targetPos = camera.position.clone().add(dir)
      
      // Lerp untuk mengikuti pergerakan kamera/tangan secara halus
      groupRef.current.position.lerp(targetPos, 0.2)
      groupRef.current.lookAt(camera.position)
    }
    // Jika isPlaced === true, grup akan diam di posisinya yang terakhir
  })

  return (
    <>
      <ambientLight intensity={1} />
      <DeviceOrientationControls />
      <MusicParticles />
      <group ref={groupRef}>
        <MinimalLyricText position={[0, 0, 0]} audioRef={audioRef} />
      </group>
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
  const [handTrackingReady, setHandTrackingReady] = useState(false)
  
  // State for Spotify UI
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const duration = 285 // durasi lagu dalam detik (sekitar 4:45)

  // Hand Tracking Refs
  const handLandmarkerRef = useRef(null)
  const handPosRef = useRef(null)

  // Initialize Hand Tracking
  useEffect(() => {
    const initHandTracking = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        )
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        })
        setHandTrackingReady(true)
      } catch (err) {
        console.error("Gagal memuat Hand Tracking:", err)
      }
    }
    initHandTracking()
  }, [])

  // Deteksi Tangan setiap frame saat kamera aktif
  useEffect(() => {
    if (!cameraActive || !handTrackingReady) return
    let animationId
    let lastVideoTime = -1

    const detect = () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && handLandmarkerRef.current) {
        const startTimeMs = performance.now()
        if (lastVideoTime !== videoRef.current.currentTime) {
          lastVideoTime = videoRef.current.currentTime
          const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs)
          
          if (results.landmarks && results.landmarks.length > 0) {
            // Ambil ujung jari telunjuk (index finger tip, landmark #8)
            const indexFinger = results.landmarks[0][8]
            // Ubah koordinat 0..1 menjadi -1..1 (Normalized Device Coordinates)
            handPosRef.current = {
              x: (indexFinger.x - 0.5) * 2,
              y: -(indexFinger.y - 0.5) * 2
            }
          } else {
            handPosRef.current = null
          }
        }
      }
      animationId = requestAnimationFrame(detect)
    }
    detect()
    return () => cancelAnimationFrame(animationId)
  }, [cameraActive, handTrackingReady])

  // Update progress bar
  useEffect(() => {
    let animationFrameId;
    const updateProgress = () => {
      if (audioRef.current && isPlaying) {
        setProgress(audioRef.current.currentTime)
      }
      animationFrameId = requestAnimationFrame(updateProgress)
    }
    if (isPlaying) {
      updateProgress()
    }
    return () => cancelAnimationFrame(animationFrameId)
  }, [isPlaying])

  const togglePlayPause = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
    setIsPlaying(!isPlaying)
  }

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
        setIsPlaced(false)
        setIsPlaying(false)
      } else {
        // Jangan langsung diputar, tunggu sampai diletakkan (isPlaced = true)
        startCamera()
      }
      setFallbackPlaying(!fallbackPlaying)
    }
  }

  const handleFallbackPlace = () => {
    setIsPlaced(true)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  const handleEnterAR = () => {
    store.enterAR()
    setIsInAR(true)
  }

  // Hide the solid background if camera is active or in AR
  const isTransparentBg = cameraActive || isInAR

  // Helper untuk format waktu mm:ss
  const formatTime = (time) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

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

      {/* ── MAGIC WINDOW UI OVERLAY (SPOTIFY STYLE) ── */}
      {!isInAR && fallbackPlaying && (
        <div className="spotify-player-overlay">
          {!isPlaced ? (
            <div className="spotify-setup">
              <button onClick={handleFallbackPlace} className="btn-primary" style={{ pointerEvents: 'auto' }}>
                <MousePointerClick size={18} /> Tap to Place Lyrics
              </button>
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: handTrackingReady ? '#1db954' : '#b3b3b3' }}>
                <Hand size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> 
                {handTrackingReady ? "Hand Tracking Active (Angkat tanganmu!)" : "Loading Hand Tracking..."}
              </div>
              <button onClick={handleFallbackPlay} className="btn-outline" style={{ pointerEvents: 'auto' }}>
                Exit
              </button>
            </div>
          ) : (
            <div className="spotify-player">
              <div className="spotify-header">
                <div className="spotify-album-art">
                  <Disc3 size={24} className={isPlaying ? "spin-anim" : ""} />
                </div>
                <div className="spotify-song-info">
                  <h3 className="spotify-title">Impostor Syndrome</h3>
                  <p className="spotify-artist">Sidney Gish</p>
                </div>
              </div>

              <div className="spotify-progress-container">
                <span className="spotify-time">{formatTime(progress)}</span>
                <div className="spotify-progress-bar">
                  <div className="spotify-progress-fill" style={{ width: `${(progress / duration) * 100}%` }}></div>
                </div>
                <span className="spotify-time">{formatTime(duration)}</span>
              </div>

              <div className="spotify-controls">
                <button onClick={togglePlayPause} className="spotify-btn-play" style={{ pointerEvents: 'auto' }}>
                  {isPlaying ? <Pause size={24} color="#000" /> : <Play size={24} color="#000" />}
                </button>
                <button onClick={handleFallbackPlay} className="spotify-btn-exit" style={{ pointerEvents: 'auto' }}>
                  Exit
                </button>
              </div>
            </div>
          )}
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
            <FallbackScene audioRef={audioRef} isPlaced={isPlaced} handPosRef={handPosRef} />
          )}
        </Canvas>
      </div>
    </div>
  )
}

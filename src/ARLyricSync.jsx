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
import { Play, Pause, Disc3, Info, Maximize, MousePointerClick, Hand, SkipForward, SwitchCamera } from 'lucide-react'
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision'
// ─────────────────────────────────────────────
// Data lirik — array { time (detik), text }
const LYRICS_IMPOSTOR = [
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

const LYRICS_SATURN = [
  { time: 0, text: "♪ (Instrumental Intro) ♪" },
  { time: 14, text: "♪ If there's another universe ♪" },
  { time: 17, text: "♪ Please make some noise (noise) ♪" },
  { time: 20, text: "♪ Give me a sign (sign) ♪" },
  { time: 23, text: "♪ This can't be life ♪" },
  { time: 25, text: "♪ If there's a point to losing love ♪" },
  { time: 28, text: "♪ Repeating pain (why?) ♪" },
  { time: 31, text: "♪ It's all the same ♪" },
  { time: 33, text: "♪ I hate this place ♪" },
  { time: 36, text: "♪ Stuck in this paradigm ♪" },
  { time: 39, text: "♪ Don't believe in paradise ♪" },
  { time: 41, text: "♪ This must be what Hell is like ♪" },
  { time: 44, text: "♪ There's got to be more, got to be more ♪" },
  { time: 47, text: "♪ Sick of this head of mine ♪" },
  { time: 49, text: "♪ Intrusive thoughts, they paralyze ♪" },
  { time: 52, text: "♪ Nirvana's not as advertised ♪" },
  { time: 55, text: "♪ There's got to be more, been here before ♪" },
  { time: 57, text: "♪ Ooh (ooh, ooh) ♪" },
  { time: 62, text: "♪ Life's better on Saturn ♪" },
  { time: 68, text: "♪ Got to break this pattern ♪" },
  { time: 71, text: "♪ Of floating away ♪" },
  { time: 73, text: "♪ Ooh (ooh, ooh) ♪" },
  { time: 79, text: "♪ Find something worth saving ♪" },
  { time: 84, text: "♪ It's all for the taking ♪" },
  { time: 87, text: "♪ I always say ♪" },
  { time: 89, text: "♪ I'll be better on Saturn ♪" },
  { time: 94, text: "♪ None of this matters ♪" },
  { time: 99, text: "♪ Dreaming of Saturn, oh ♪" },
  { time: 106, text: "♪ If karma's really real ♪" },
  { time: 109, text: "♪ How am I still here? ♪" },
  { time: 111, text: "♪ Just seems so unfair ♪" },
  { time: 114, text: "♪ I could be wrong though ♪" },
  { time: 117, text: "♪ If there's a point to being good ♪" },
  { time: 119, text: "♪ Then where's my reward? ♪" },
  { time: 122, text: "♪ The good die young and poor ♪" },
  { time: 125, text: "♪ I gave it all I could ♪" },
  { time: 128, text: "♪ Stuck in this terradome ♪" },
  { time: 130, text: "♪ All I see is terrible ♪" },
  { time: 133, text: "♪ Making us hysterical ♪" },
  { time: 135, text: "♪ There's got to be more, got to be more ♪" },
  { time: 138, text: "♪ Sick of this head of mine ♪" },
  { time: 141, text: "♪ Intrusive thoughts, they paralyze ♪" },
  { time: 144, text: "♪ Nirvana's not as advertised ♪" },
  { time: 146, text: "♪ There's got to be more, been here before ♪" },
  { time: 149, text: "♪ Ooh (ooh, ooh) ♪" },
  { time: 154, text: "♪ Life's better on Saturn ♪" },
  { time: 159, text: "♪ Got to break this pattern ♪" },
  { time: 162, text: "♪ Of floating away ♪" },
  { time: 165, text: "♪ Ooh (ooh, ooh) ♪" },
  { time: 170, text: "♪ Find something worth saving ♪" },
  { time: 175, text: "♪ It's all for the taking ♪" },
  { time: 178, text: "♪ I always say ♪" },
  { time: 181, text: "♪ I'll be better on Saturn ♪" },
  { time: 186, text: "♪ None of this matters ♪" },
  { time: 191, text: "♪ Dreaming of Saturn, oh ♪" }
]

const SONGS = [
  {
    title: "Saturn",
    artist: "SZA",
    src: `${import.meta.env.BASE_URL}audio/YTDown_YouTube_SZA-Saturn_Media_V2G8ESoDXm8_009_128k.mp3.mpeg`,
    duration: 186,
    lyrics: LYRICS_SATURN
  },
  {
    title: "Impostor Syndrome",
    artist: "Sidney Gish",
    src: `${import.meta.env.BASE_URL}audio/impostorsyndrome.mp3`,
    duration: 285,
    lyrics: LYRICS_IMPOSTOR
  },
  {
    title: "Shape of You (VR Remix)",
    artist: "Ed Sheeran (Dummy)",
    src: `${import.meta.env.BASE_URL}audio/impostorsyndrome.mp3`, // dummy, pakai file sama
    duration: 285,
    lyrics: [
      { time: 0, text: "♪ (Shape of You Beat) ♪" },
      { time: 5, text: "♪ The club isn't the best place... ♪" },
      { time: 10, text: "♪ ...to find a lover so the bar is where I go ♪" }
    ]
  },
  {
    title: "Bohemian Rhapsody",
    artist: "Queen (Dummy)",
    src: `${import.meta.env.BASE_URL}audio/impostorsyndrome.mp3`, // dummy
    duration: 285,
    lyrics: [
      { time: 0, text: "♪ Is this the real life? ♪" },
      { time: 5, text: "♪ Is this just fantasy? ♪" },
      { time: 10, text: "♪ Caught in a landslide... ♪" }
    ]
  }
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
function getCurrentLyric(currentTime, songLyrics) {
  const adjustedTime = currentTime - LYRIC_OFFSET
  let result = songLyrics[0]
  for (let i = songLyrics.length - 1; i >= 0; i--) {
    if (adjustedTime >= songLyrics[i].time) {
      result = songLyrics[i]
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
function MinimalLyricText({ position, audioRef, songLyrics, lyricOffset = 0 }) {
  const textRef = useRef()
  const [currentText, setCurrentText] = useState(songLyrics[0].text)
  const baseY = position[1]

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scale.set(0, 0, 0)
    }
  }, [songLyrics])

  useFrame((state) => {
    if (!textRef.current) return
    const elapsed = state.clock.getElapsedTime()
    
    textRef.current.scale.lerp(new Vector3(1, 1, 1), 0.1)
    textRef.current.position.y = baseY + Math.sin(elapsed * 2) * 0.02

    if (audioRef.current && !audioRef.current.paused) {
      const time = audioRef.current.currentTime
      const newText = getCurrentLyric(time, songLyrics, lyricOffset)
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
// Komponen: Planet Saturnus (Efek Spesial SZA)
// ─────────────────────────────────────────────
function SaturnPlanet() {
  const planetRef = useRef()
  const ringRef = useRef()

  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * -0.05
    }
  })

  // Tempatkan planet Saturnus besar di langit/jauh di belakang
  return (
    <group position={[0, 4, -10]} rotation={[0.4, 0.2, 0]}>
      {/* Planet */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color="#d4ac0d" roughness={0.7} />
      </mesh>
      
      {/* Cincin Saturnus */}
      <mesh ref={ringRef} rotation={[Math.PI / 2 + 0.3, 0, 0]}>
        <ringGeometry args={[2.5, 4.5, 64]} />
        <meshStandardMaterial color="#fcf3cf" side={2} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────
// Komponen: AR Scene
// ─────────────────────────────────────────────
function ARScene({ audioRef, onAnchorPlaced, songLyrics, showSaturn, showParticles, lyricOffset }) {
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
      {showSaturn && <SaturnPlanet />}
      {showParticles && <MusicParticles />}
      
      {!anchorPos && (
        <HitTestReticle onPositionUpdate={handlePositionUpdate} />
      )}

      {anchorPos && (
        <>
          <MinimalLyricText position={anchorPos} audioRef={audioRef} songLyrics={songLyrics} lyricOffset={lyricOffset} />
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
// Komponen: Mic Virtual 3D (Muncul saat Genggam Tangan)
// ─────────────────────────────────────────────
function Mic3D({ handPosRef, isFist }) {
  const groupRef = useRef()
  const { camera } = useThree()

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(isFist)
  }, [isFist])

  useFrame((state) => {
    if (groupRef.current && handPosRef.current && visible) {
      const dir = new Vector3(-handPosRef.current.x * 2.0, handPosRef.current.y * 2.0, -1)
      dir.normalize().applyQuaternion(camera.quaternion).multiplyScalar(1.5)
      const targetPos = camera.position.clone().add(dir)
      groupRef.current.position.lerp(targetPos, 0.4)
      
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 4) * 0.015
      groupRef.current.lookAt(camera.position)
      groupRef.current.rotateX(Math.PI / 4)
    }
  })

  if (!visible) return null

  return (
    <group ref={groupRef}>
      {/* Kepala Mic */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#888888" wireframe />
      </mesh>
      {/* Pegangan Mic */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.25, 16]} />
        <meshStandardMaterial color="#222222" roughness={0.7} />
      </mesh>
      {/* Cincin Spotify */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.02, 16]} />
        <meshStandardMaterial color="#1db954" emissive="#1db954" emissiveIntensity={2} />
      </mesh>
      <pointLight color="#1db954" intensity={2} distance={2} position={[0, 0, 0]} />
    </group>
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
function FallbackScene({ audioRef, isPlaced, handPosRef, songLyrics, isFist, showSaturn, showParticles, lyricOffset }) {
  const { camera } = useThree()
  const groupRef = useRef()

  useFrame(() => {
    if (groupRef.current && !isPlaced) {
      const dir = new Vector3(0, 0, -1)
      
      if (handPosRef && handPosRef.current) {
        dir.x = -handPosRef.current.x * 2.0
        dir.y = handPosRef.current.y * 2.0
      }
      
      dir.normalize()
      dir.applyQuaternion(camera.quaternion)
      dir.multiplyScalar(3)
      
      const targetPos = camera.position.clone().add(dir)
      groupRef.current.position.lerp(targetPos, 0.2)
      groupRef.current.lookAt(camera.position)
    }
  })

  return (
    <>
      <ambientLight intensity={1} />
      <DeviceOrientationControls />
      {showParticles && <MusicParticles />}
      {showSaturn && <SaturnPlanet />}
      <Mic3D handPosRef={handPosRef} isFist={isFist} />
      <group ref={groupRef}>
        <MinimalLyricText position={[0, 0, 0]} audioRef={audioRef} songLyrics={songLyrics} lyricOffset={lyricOffset} />
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
  const [isFrontCamera, setIsFrontCamera] = useState(false)
  
  // State for Spotify UI
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const currentSong = SONGS[currentSongIndex]
  const duration = currentSong.duration

  // Hand Tracking & Gesture Refs
  const recognizerRef = useRef(null)
  const handPosRef = useRef(null)
  const [detectedGesture, setDetectedGesture] = useState("None")
  const lastGestureRef = useRef("None")
  const [gestureFeedback, setGestureFeedback] = useState("")

  // Initialize Gesture Tracking
  useEffect(() => {
    const initTracking = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        )
        recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        })
        setHandTrackingReady(true)
      } catch (err) {
        console.error("Gagal memuat Gesture Tracking:", err)
      }
    }
    initTracking()
  }, [])

  // Deteksi Gerakan Tangan
  useEffect(() => {
    if (!cameraActive || !handTrackingReady) return
    let animationId
    let lastVideoTime = -1

    const detect = () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && recognizerRef.current) {
        const startTimeMs = performance.now()
        if (lastVideoTime !== videoRef.current.currentTime) {
          lastVideoTime = videoRef.current.currentTime
          const results = recognizerRef.current.recognizeForVideo(videoRef.current, startTimeMs)
          
          if (results.landmarks && results.landmarks.length > 0) {
            const indexFinger = results.landmarks[0][8]
            handPosRef.current = {
              x: (indexFinger.x - 0.5) * 2,
              y: -(indexFinger.y - 0.5) * 2
            }
            if (results.gestures && results.gestures.length > 0) {
              setDetectedGesture(results.gestures[0][0].categoryName)
            } else {
              setDetectedGesture("None")
            }
          } else {
            handPosRef.current = null
            setDetectedGesture("None")
          }
        }
      }
      animationId = requestAnimationFrame(detect)
    }
    detect()
    return () => cancelAnimationFrame(animationId)
  }, [cameraActive, handTrackingReady])

  // Handle Gesture Actions (Debounced)
  useEffect(() => {
    const gesture = detectedGesture
    if (gesture !== lastGestureRef.current) {
      if (gesture === "Victory") {
        // Peace Sign -> Next Song
        handleNextSong()
        showFeedback("✌️ Next Song!")
      } else if (gesture === "Thumb_Up") {
        // Thumb Up -> Play / Pause
        togglePlayPause()
        showFeedback("👍 Play / Pause")
      } else if (gesture === "Pointing_Up") {
        if (audioRef.current) {
           audioRef.current.volume = Math.min(1, audioRef.current.volume + 0.2)
        }
        showFeedback("👆 Vol Up")
      } else if (gesture === "Thumb_Down") {
        if (audioRef.current) {
           audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.2)
        }
        showFeedback("👎 Vol Down")
      }
    }
    lastGestureRef.current = gesture
  }, [detectedGesture])

  const showFeedback = (text) => {
    setGestureFeedback(text)
    setTimeout(() => setGestureFeedback(""), 2000)
  }

  const handleNextSong = () => {
    const nextIdx = (currentSongIndex + 1) % SONGS.length
    setCurrentSongIndex(nextIdx)
    if (audioRef.current) {
      // Dalam implementasi nyata, ganti src audio di sini. Karena kita pakai audio yang sama (dummy), kita reset waktu.
      audioRef.current.currentTime = 0
      if (isPlaying) {
        audioRef.current.play().catch(()=>{})
      }
    }
  }

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
  const startCamera = async (useFront = isFrontCamera) => {
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: useFront ? 'user' : 'environment' } 
        })
      } catch (e) {
        // Fallback jika tidak ada kamera belakang (misal di beberapa browser PC/emulator Android)
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        })
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraActive(true)
      }
    } catch (error) {
      console.error("Camera access denied or failed", error)
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

  const toggleCamera = () => {
    stopCamera()
    const nextFront = !isFrontCamera
    setIsFrontCamera(nextFront)
    startCamera(nextFront)
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
        src={currentSong.src}
        preload="auto"
        crossOrigin="anonymous"
        onEnded={() => {
          setIsPlaying(false)
          handleNextSong() // Auto play next song
        }}
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

          <div className="card" style={{ marginTop: '1rem', border: '1px solid rgba(29, 185, 84, 0.5)' }}>
            <div className="card-icon" style={{ color: '#1db954' }}><Hand size={24} /></div>
            <h2 style={{ marginBottom: '0.5rem' }}>Gesture Controls</h2>
            <ul style={{ textAlign: 'left', fontSize: '0.9rem', lineHeight: '1.6', paddingLeft: '1rem', color: '#ccc', listStyle: 'none' }}>
              <li>✊ <b>Fist</b>: Spawn Mic</li>
              <li>✌️ <b>Peace</b>: Next Song</li>
              <li>👍 <b>Thumb Up</b>: Play / Pause</li>
              <li>👆 <b>Point Up</b>: Volume Up</li>
              <li>👎 <b>Thumb Down</b>: Volume Down</li>
            </ul>
          </div>
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
              <button onClick={toggleCamera} className="btn-outline" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <SwitchCamera size={18} /> Flip Camera
              </button>
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: handTrackingReady ? '#1db954' : '#b3b3b3' }}>
                <Hand size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> 
                {handTrackingReady ? "Gestures Active (Fist=Mic, Peace=Next, Thumb=Play)" : "Loading Hand Tracking..."}
              </div>
              {gestureFeedback && (
                <div style={{ background: '#1db954', color: '#fff', padding: '5px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {gestureFeedback}
                </div>
              )}
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
                  <h3 className="spotify-title">{currentSong.title}</h3>
                  <p className="spotify-artist">{currentSong.artist}</p>
                </div>
                {/* Visual Feedback for Gestures inside player too */}
                {gestureFeedback && (
                  <div style={{ marginLeft: 'auto', background: '#1db954', color: '#fff', padding: '4px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {gestureFeedback}
                  </div>
                )}
              </div>

              <div className="spotify-progress-container">
                <span className="spotify-time">{formatTime(progress)}</span>
                <div className="spotify-progress-bar">
                  <div className="spotify-progress-fill" style={{ width: `${(progress / duration) * 100}%` }}></div>
                </div>
                <span className="spotify-time">{formatTime(duration)}</span>
              </div>

              <div className="spotify-controls">
                <button onClick={toggleCamera} className="spotify-btn-exit" style={{ pointerEvents: 'auto', border: 'none', background: 'transparent' }} title="Flip Camera">
                  <SwitchCamera size={24} color="#fff" />
                </button>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button onClick={togglePlayPause} className="spotify-btn-play" style={{ pointerEvents: 'auto' }}>
                    {isPlaying ? <Pause size={24} color="#000" /> : <Play size={24} color="#000" />}
                  </button>
                  <button onClick={handleNextSong} className="spotify-btn-exit" style={{ pointerEvents: 'auto', border: 'none', background: 'transparent' }}>
                    <SkipForward size={24} color="#fff" />
                  </button>
                </div>
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
            <ARScene 
              audioRef={audioRef} 
              onAnchorPlaced={() => setIsPlaced(true)} 
              songLyrics={currentSong.lyrics} 
              showSaturn={currentSong.title === "Saturn"}
              showParticles={currentSong.title !== "Saturn"}
              lyricOffset={currentSong.lyricOffset || 0}
            />
          </XR>

          {arSupported === false && fallbackPlaying && (
            <FallbackScene 
              audioRef={audioRef} 
              isPlaced={isPlaced} 
              handPosRef={handPosRef} 
              songLyrics={currentSong.lyrics}
              isFist={detectedGesture === "Closed_Fist"}
              showSaturn={currentSong.title === "Saturn"}
              showParticles={currentSong.title !== "Saturn"}
              lyricOffset={currentSong.lyricOffset || 0}
            />
          )}
        </Canvas>
      </div>
    </div>
  )
}

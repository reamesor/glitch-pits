"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEYS = {
  on: "glitch-pits-music-on",
  muted: "glitch-pits-music-muted",
  volume: "glitch-pits-music-volume",
  source: "glitch-pits-music-source",
  youtubeUrl: "glitch-pits-music-youtube-url",
  spotifyUrl: "glitch-pits-music-spotify-url",
} as const;

type MusicSource = "retro" | "ambient" | "youtube" | "spotify";

// Retro arpeggio
const NOTES_RETRO = [220, 277.18, 329.63, 392];
// Ambient: lower, slower
const NOTES_AMBIENT = [164.81, 196, 246.94, 293.66];
const NOTE_DURATION = 0.35;

function createLoop(ctx: AudioContext, gainNode: GainNode, notes: number[]) {
  const barDuration = NOTE_DURATION * notes.length;
  let nextTime = ctx.currentTime;

  function scheduleBar() {
    const now = ctx.currentTime;
    if (nextTime < now) nextTime = now;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      noteGain.gain.setValueAtTime(0, nextTime + i * NOTE_DURATION);
      noteGain.gain.linearRampToValueAtTime(0.06, nextTime + i * NOTE_DURATION + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, nextTime + i * NOTE_DURATION + NOTE_DURATION);
      osc.connect(noteGain);
      noteGain.connect(gainNode);
      osc.start(nextTime + i * NOTE_DURATION);
      osc.stop(nextTime + i * NOTE_DURATION + NOTE_DURATION);
    });
    nextTime += barDuration;
  }

  function tick() {
    scheduleBar();
    return setTimeout(tick, barDuration * 1000);
  }
  return tick;
}

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url.trim());
    const list = u.searchParams.get("list");
    if (list) return `https://www.youtube.com/embed/videoseries?list=${list}&autoplay=1`;
    const v = u.searchParams.get("v") || (u.hostname === "youtu.be" ? u.pathname.slice(1) : null);
    if (v) return `https://www.youtube.com/embed/${v}?autoplay=1`;
  } catch {}
  return null;
}

function getSpotifyEmbedUrl(url: string): string | null {
  if (!url?.trim()) return null;
  try {
    const m = url.trim().match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
    if (m) return `https://open.spotify.com/embed/playlist/${m[1]}`;
  } catch {}
  return null;
}

export function BackgroundMusic() {
  const [open, setOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(60);
  const [source, setSource] = useState<MusicSource>("retro");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [embedYoutube, setEmbedYoutube] = useState<string | null>(null);
  const [embedSpotify, setEmbedSpotify] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved preferences
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_KEYS.on) === "1") setIsPlaying(true);
      if (localStorage.getItem(STORAGE_KEYS.muted) === "1") setMuted(true);
      const v = localStorage.getItem(STORAGE_KEYS.volume);
      if (v != null) setVolume(Math.min(100, Math.max(0, Number(v))));
      const s = localStorage.getItem(STORAGE_KEYS.source);
      if (s && ["retro", "ambient", "youtube", "spotify"].includes(s)) setSource(s as MusicSource);
      const y = localStorage.getItem(STORAGE_KEYS.youtubeUrl);
      if (y) {
        setYoutubeUrl(y);
        setEmbedYoutube(getYoutubeEmbedUrl(y));
      }
      const sp = localStorage.getItem(STORAGE_KEYS.spotifyUrl);
      if (sp) {
        setSpotifyUrl(sp);
        setEmbedSpotify(getSpotifyEmbedUrl(sp));
      }
    } catch {}
  }, []);

  // Persist preferences
  const save = (key: keyof typeof STORAGE_KEYS, value: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS[key], value);
    } catch {}
  };

  // Procedural audio (retro / ambient)
  useEffect(() => {
    const playProcedural = isPlaying && !muted && (source === "retro" || source === "ambient");
    if (!playProcedural) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (gainRef.current) gainRef.current.gain.setValueAtTime(0, 0);
      if (ctxRef.current) ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
      gainRef.current = null;
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") ctx.resume();
    const gain = ctx.createGain();
    gain.gain.value = (volume / 100) * 0.4;
    gain.connect(ctx.destination);
    ctxRef.current = ctx;
    gainRef.current = gain;

    const notes = source === "ambient" ? NOTES_AMBIENT : NOTES_RETRO;
    const tick = createLoop(ctx, gain, notes);
    timeoutRef.current = tick();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      gain.gain.setValueAtTime(0, 0);
      ctx.close().catch(() => {});
      ctxRef.current = null;
      gainRef.current = null;
    };
  }, [isPlaying, muted, source]);

  // Update procedural volume when slider changes
  useEffect(() => {
    if (gainRef.current && (source === "retro" || source === "ambient"))
      gainRef.current.gain.setValueAtTime((volume / 100) * 0.4, 0);
  }, [volume, source]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const handleMute = () => {
    const next = !muted;
    setMuted(next);
    save("muted", next ? "1" : "0");
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(100, Math.max(0, Number(e.target.value)));
    setVolume(v);
    save("volume", String(v));
  };

  const handleSource = (s: MusicSource) => {
    setSource(s);
    save("source", s);
  };

  const handleYoutubeSubmit = () => {
    const emb = getYoutubeEmbedUrl(youtubeUrl);
    setEmbedYoutube(emb);
    if (youtubeUrl.trim()) save("youtubeUrl", youtubeUrl.trim());
  };

  const handleSpotifySubmit = () => {
    const emb = getSpotifyEmbedUrl(spotifyUrl);
    setEmbedSpotify(emb);
    if (spotifyUrl.trim()) save("spotifyUrl", spotifyUrl.trim());
  };

  const isProceduralOn = isPlaying && (source === "retro" || source === "ambient");
  const showEmbed = (source === "youtube" && embedYoutube) || (source === "spotify" && embedSpotify);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 border-2 border-[#4a4a4a] bg-[var(--bg-card)] px-2 py-1 font-pixel text-[9px] transition hover:border-[var(--glitch-pink)]/50"
        title="Music options"
      >
        <span className="text-sm" aria-hidden>{isPlaying || showEmbed ? "♫" : "♩"}</span>
        <span>{isPlaying || showEmbed ? "MUSIC ON" : "MUSIC"}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-72 border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-darker)] p-3 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="game-box-label mb-2">MUSIC</p>

          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleMute}
              className={`border-2 px-2 py-1 font-pixel text-[9px] ${muted ? "border-red-500/60 bg-red-500/20" : "border-[#4a4a4a] bg-[var(--bg-card)]"}`}
            >
              {muted ? "MUTED" : "MUTE"}
            </button>
            <span className="font-mono text-[9px] text-gray-500">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolume}
              className="h-2 flex-1 accent-[var(--glitch-pink)]"
            />
            <span className="font-mono text-[9px] text-gray-400">{volume}%</span>
          </div>

          <div className="mb-2">
            <p className="game-box-label mb-1">SOURCE</p>
            <div className="flex flex-wrap gap-1">
              {(["retro", "ambient", "youtube", "spotify"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSource(s)}
                  className={`border-2 px-2 py-1 font-pixel text-[8px] capitalize ${source === s ? "border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20" : "border-[#4a4a4a] bg-[var(--bg-card)]"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {source === "youtube" && (
            <div className="mb-2">
              <p className="game-box-label mb-1">YOUTUBE</p>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Paste video or playlist URL"
                  className="min-w-0 flex-1 border-2 border-[#4a4a4a] bg-[#1a1a1a] px-2 py-1 font-mono text-[9px] text-white placeholder-gray-500"
                />
                <button type="button" onClick={handleYoutubeSubmit} className="pixel-btn text-[8px]">
                  LOAD
                </button>
              </div>
              {embedYoutube && (
                <div className="mt-2 aspect-video w-full overflow-hidden rounded border border-white/10">
                  <iframe
                    title="YouTube"
                    src={embedYoutube}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          {source === "spotify" && (
            <div className="mb-2">
              <p className="game-box-label mb-1">SPOTIFY</p>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  placeholder="Paste playlist URL"
                  className="min-w-0 flex-1 border-2 border-[#4a4a4a] bg-[#1a1a1a] px-2 py-1 font-mono text-[9px] text-white placeholder-gray-500"
                />
                <button type="button" onClick={handleSpotifySubmit} className="pixel-btn text-[8px]">
                  LOAD
                </button>
              </div>
              {embedSpotify && (
                <div className="mt-2 h-20 w-full overflow-hidden rounded border border-white/10">
                  <iframe
                    title="Spotify"
                    src={embedSpotify}
                    className="h-full w-full"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  />
                </div>
              )}
            </div>
          )}

          {(source === "retro" || source === "ambient") && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const next = !isPlaying;
                  setIsPlaying(next);
                  save("on", next ? "1" : "0");
                }}
                className="pixel-btn pixel-btn-accent text-[9px]"
              >
                {isPlaying ? "PAUSE" : "PLAY"}
              </button>
            </div>
          )}

          <p className="mt-2 font-mono text-[8px] text-gray-500">
            Retro/Ambient = in-game loop. YouTube/Spotify = your playlist.
          </p>
        </div>
      )}
    </div>
  );
}

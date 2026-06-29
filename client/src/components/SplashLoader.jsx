import React, { useEffect, useState } from 'react';

const SplashLoader = ({ onComplete }) => {
  const [fade, setFade] = useState(false);
  const [themeMode, setThemeMode] = useState('light');

  useEffect(() => {
    // Detect theme setup
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setThemeMode(isDark ? 'dark' : 'light');

    const splashPlayed = sessionStorage.getItem('stayease_splash_played');
    if (splashPlayed) {
      onComplete();
      return;
    }

    // Smooth fade out transition after 2.4 seconds
    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 2400);

    const completeTimer = setTimeout(() => {
      sessionStorage.setItem('stayease_splash_played', 'true');
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (sessionStorage.getItem('stayease_splash_played')) {
    return null;
  }

  const isDark = themeMode === 'dark';

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-750 ease-in-out ${
        isDark ? 'bg-[#03060f]' : 'bg-neutral-50'
      } ${
        fade ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dynamic ambient color shifting morph meshes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-[70%] w-[70%] rounded-full bg-brand/10 blur-[130px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 h-[70%] w-[70%] rounded-full bg-blue-600/10 blur-[130px] animate-pulse-slow delay-1000" />
      </div>

      <div className="flex flex-col items-center space-y-8 select-none relative z-10">
        
        {/* Concentric Glass Ripple Waves & Logo Wrapper */}
        <div className="relative flex items-center justify-center h-44 w-44">
          
          {/* Expanding Glass Ripples */}
          <div className={`absolute inset-0 rounded-full border animate-ripple-1 ${
            isDark ? 'border-white/5 bg-white/[0.01]' : 'border-black/5 bg-black/[0.01]'
          }`} />
          <div className={`absolute inset-0 rounded-full border animate-ripple-2 ${
            isDark ? 'border-white/5 bg-white/[0.01]' : 'border-black/5 bg-black/[0.01]'
          }`} />
          <div className={`absolute inset-0 rounded-full border animate-ripple-3 ${
            isDark ? 'border-white/5 bg-white/[0.01]' : 'border-black/5 bg-black/[0.01]'
          }`} />

          {/* Logo Center Card */}
          <div className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-full backdrop-blur-xl shadow-2xl animate-logo-glow ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-neutral-200/60'
          }`}>
            <svg
              className="h-11 w-11 stroke-brand fill-none animate-svg-draw"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 100,
                strokeDashoffset: 100,
              }}
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>

        {/* Brand Labels */}
        <div className="text-center space-y-2.5">
          <h1 className={`text-3xl font-black tracking-[0.3em] animate-text-spacing pl-[0.3em] ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            STAYEASE
          </h1>
          <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-400 font-extrabold animate-fade-in-delayed">
            Premium Vacation Rentals
          </p>
        </div>

      </div>
    </div>
  );
};

export default SplashLoader;

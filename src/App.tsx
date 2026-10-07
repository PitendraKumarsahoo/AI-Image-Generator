/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  RefreshCw,
  ExternalLink,
  Dices,
  Lightbulb,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  Wand2,
  Trash2,
  Sliders,
  Share2,
  Palette,
  ChevronDown,
  Zap,
} from 'lucide-react';
import {
  AspectDimension,
  DIMENSIONS,
  DIMENSION_KEYS,
  STYLE_FILTERS,
  StyleFilter,
  enhancePromptWithAI,
  generateImage,
  downloadImageFile,
} from './lib/puter.ts';

interface SessionItem {
  id: string;
  prompt: string;
  fullPrompt: string;
  styleName?: string;
  imageUrl: string;
  dimension: AspectDimension;
  appliedDimension: string;
  createdAt: number;
}

const SAMPLE_PROMPTS = [
  'A futuristic city in neon style',
  'A serene mountain landscape',
  'A cute robot portrait',
];

const SURPRISE_PROMPTS = [
  'A futuristic cyberpunk cityscape bathed in torrential rain with glowing holographic neon signs, 8k resolution, cinematic lighting',
  'A serene alpine mountain landscape at sunrise, surrounded by pine forests and golden mist with crystal clear water reflections',
  'A cute robot portrait with luminous blue optic eyes holding a delicate glowing sunflower, intricate mechanical details',
  'An intricate steampunk brass pocket watch overgrown with blooming luminescent moss and clockwork flowers',
  'A majestic white stag with crystalline antlers standing inside a misty mystical grove under northern lights',
  'A cozy dimly lit coffee shop library in autumn with books stacked to the ceiling and raindrops on the window',
  'An astronaut floating through an ancient celestial cathedral in deep space surrounded by glowing star dust',
  'A retro-futuristic hovercar parked on an ocean highway during a vibrant synthwave sunset, high detail',
  'A mystical Japanese shrine surrounded by blooming cherry blossoms and floating lanterns at dusk',
  'A breathtaking underwater coral kingdom with bioluminescent sea creatures and rays of sun filtering through turquoise water',
  'A magical crystal cavern with floating illuminated geodes and a hidden underground waterfall',
  'A vintage botanical illustration of an ethereal glowing night-blooming lotus in deep twilight',
];

export default function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [selectedDimension, setSelectedDimension] = useState<AspectDimension>('1:1');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('none');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhancedNotice, setEnhancedNotice] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  // Active item reference
  const activeItem = sessionItems.find((item) => item.id === activeItemId) || sessionItems[0] || null;
  const selectedStyle = STYLE_FILTERS.find((f) => f.id === selectedStyleId) || STYLE_FILTERS[0];

  // Timer while generating
  useEffect(() => {
    if (isGenerating) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating]);

  // Handle generation with style tag prepending
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isGenerating) return;

    setError(null);
    setFallbackNotice(null);
    setIsGenerating(true);

    const activeFilter = STYLE_FILTERS.find((f) => f.id === selectedStyleId) || STYLE_FILTERS[0];
    const fullPrompt = activeFilter.tagPrefix ? `${activeFilter.tagPrefix}${cleanPrompt}` : cleanPrompt;

    try {
      const result = await generateImage(fullPrompt, selectedDimension);

      const newItem: SessionItem = {
        id: `gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        prompt: cleanPrompt,
        fullPrompt: fullPrompt,
        styleName: activeFilter.id !== 'none' ? activeFilter.name : undefined,
        imageUrl: result.imageUrl,
        dimension: selectedDimension,
        appliedDimension: result.appliedDimension,
        createdAt: Date.now(),
      };

      setSessionItems((prev) => [newItem, ...prev]);
      setActiveItemId(newItem.id);

      if (result.fallbackApplied && result.appliedDimension !== selectedDimension) {
        setFallbackNotice(
          `Model adjusted dimension to ${result.appliedDimension} for best compatibility.`
        );
      }

      // Smooth scroll preview into view on mobile
      setTimeout(() => {
        if (window.innerWidth < 1024) {
          previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(
        err?.message || 'An error occurred during generation. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle AI-powered prompt enhancement
  const handleEnhancePrompt = async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isGenerating || isEnhancing) return;

    setIsEnhancing(true);
    setError(null);

    try {
      const enhanced = await enhancePromptWithAI(cleanPrompt);
      setPrompt(enhanced);
      setEnhancedNotice(true);
      setTimeout(() => setEnhancedNotice(false), 3000);
    } catch (err: any) {
      console.error('Enhance prompt failed:', err);
      setError('Could not enhance prompt at this moment. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle Surprise Me random creative prompt
  const handleSurpriseMe = () => {
    if (isGenerating || isEnhancing) return;
    setError(null);
    const available = SURPRISE_PROMPTS.filter((p) => p !== prompt.trim());
    const randomPrompt =
      available[Math.floor(Math.random() * available.length)] || SURPRISE_PROMPTS[0];
    setPrompt(randomPrompt);
  };

  // Handle Copy Prompt to clipboard
  const handleCopyPrompt = async () => {
    const textToCopy = activeItem ? (activeItem.fullPrompt || activeItem.prompt) : prompt;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2200);
    } catch (err) {
      console.warn('Clipboard write failed, fallback used:', err);
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2200);
    }
  };

  // Handle download of current active image
  const handleDownload = async () => {
    if (!activeItem || isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const safePromptSlug = activeItem.prompt
        .slice(0, 24)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const filename = `${safePromptSlug || 'studio-ai'}-${activeItem.appliedDimension.replace(':', 'x')}-${Date.now()}.png`;

      await downloadImageFile(activeItem.imageUrl, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error('Download failed:', err);
      setError('Could not download image directly. Opening in a new window...');
      window.open(activeItem.imageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // Carousel navigation
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const amount = direction === 'left' ? -220 : 220;
      carouselRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Clear session history
  const handleClearSession = () => {
    if (confirm('Clear all images from the current session?')) {
      setSessionItems([]);
      setActiveItemId(null);
    }
  };

  // Handle keyboard shortcut (Ctrl/Cmd + Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  const currentDimConfig = DIMENSIONS[selectedDimension];

  return (
    <div className="min-h-screen bg-[#07080b] text-zinc-100 flex flex-col items-center justify-start selection:bg-zinc-700 selection:text-white relative overflow-x-hidden">
      {/* Top Ambient Light Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[850px] h-[480px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[30%] -right-[10%] w-[500px] h-[500px] bg-sky-500/[0.04] blur-[160px] rounded-full" />
        <div className="absolute top-[60%] -left-[10%] w-[500px] h-[500px] bg-purple-500/[0.04] blur-[160px] rounded-full" />
        {/* Subtle dot matrix texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 relative z-10 flex flex-col gap-8">
        {/* Top Professional App Header */}
        <header className="flex items-center justify-between pb-6 border-b border-white/[0.07]">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white via-zinc-200 to-zinc-400 p-[1px] shadow-lg shadow-white/10">
                <div className="w-full h-full bg-[#0a0c10] rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#07080b] rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
                  IMAGINE<span className="text-zinc-400 font-light ml-1">STUDIO</span>
                </span>
                <span className="hidden sm:inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.07] border border-white/[0.1] text-zinc-300">
                  Puter.js Ultra
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Professional text-to-image synthesis engine · Zero config · Free generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sessionItems.length > 0 && (
              <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-lg">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  <strong className="text-white font-medium">{sessionItems.length}</strong>{' '}
                  {sessionItems.length === 1 ? 'generation' : 'generations'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ready</span>
            </div>
          </div>
        </header>

        {/* Main 2-Column High-Converting Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Control Deck (5 cols) */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-[#0e1117]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex flex-col gap-5 relative overflow-hidden">
              {/* Subtle top card glow highlight */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              {/* Prompt Box Header */}
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-3.5 h-3.5 text-zinc-400" />
                    <label
                      htmlFor="prompt-input"
                      className="text-xs font-semibold uppercase tracking-wider text-zinc-300"
                    >
                      Prompt Creation
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* AI Enhance Prompt Button */}
                    <button
                      type="button"
                      onClick={handleEnhancePrompt}
                      disabled={isGenerating || isEnhancing || !prompt.trim()}
                      className="flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-sm shadow-amber-500/5"
                      title="AI automatically expands prompt with rich visual details"
                    >
                      {isEnhancing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                          <span>Enhancing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Enhance Prompt</span>
                        </>
                      )}
                    </button>

                    {/* Surprise Me Button */}
                    <button
                      type="button"
                      onClick={handleSurpriseMe}
                      disabled={isGenerating || isEnhancing}
                      className="flex items-center gap-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-50 group cursor-pointer shadow-sm"
                      title="Generate a randomized, creative, and detailed art prompt"
                    >
                      <Dices className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:rotate-45 transition-transform" />
                      <span>Surprise Me</span>
                    </button>
                  </div>
                </div>

                {/* Enhanced Notice Notification */}
                {enhancedNotice && (
                  <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1 animate-fadeIn">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Prompt enriched with aesthetic details by AI!</span>
                  </div>
                )}

                {/* Prompt Textarea */}
                <div className="relative group">
                  <textarea
                    id="prompt-input"
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe the image you want to create..."
                    disabled={isGenerating || isEnhancing}
                    className="w-full bg-[#08090c]/90 border border-white/[0.08] group-hover:border-white/[0.15] focus:border-white/40 rounded-xl p-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all resize-none shadow-inner disabled:opacity-60 disabled:cursor-not-allowed leading-relaxed"
                  />

                  {prompt.trim().length > 0 && !isGenerating && (
                    <button
                      type="button"
                      onClick={() => setPrompt('')}
                      className="absolute right-3 bottom-3 text-xs text-zinc-500 hover:text-zinc-200 transition-colors px-2 py-1 bg-white/[0.06] hover:bg-white/[0.1] rounded-md border border-white/[0.08]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                  <span>Press ⌘/Ctrl + Enter to generate</span>
                  <span>{prompt.length} characters</span>
                </div>
              </div>

              {/* Prompt Ideas Section */}
              <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400/90" />
                  <span>Prompt Ideas</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {SAMPLE_PROMPTS.map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        if (!isGenerating && !isEnhancing) {
                          setPrompt(sample);
                          setError(null);
                        }
                      }}
                      disabled={isGenerating || isEnhancing}
                      className="text-xs text-left px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.15] text-zinc-300 hover:text-white transition-all flex items-center justify-between group disabled:opacity-50 cursor-pointer"
                    >
                      <span className="truncate pr-2">“{sample}”</span>
                      <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 shrink-0 font-mono">
                        Use →
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Filter Selection Dropdown */}
              <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-zinc-400" />
                    Style Filter
                  </span>
                  {selectedStyle.id !== 'none' && (
                    <span className="text-[10px] font-medium text-amber-400/90 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                      Prepends tag
                    </span>
                  )}
                </div>

                <div className="relative">
                  <select
                    value={selectedStyleId}
                    onChange={(e) => setSelectedStyleId(e.target.value)}
                    disabled={isGenerating}
                    className="w-full bg-[#08090c]/90 border border-white/[0.08] hover:border-white/[0.18] focus:border-white/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all appearance-none cursor-pointer pr-10"
                  >
                    {STYLE_FILTERS.map((filter) => (
                      <option key={filter.id} value={filter.id} className="bg-zinc-900 text-zinc-100 py-1">
                        {filter.name} {filter.id !== 'none' ? `— ${filter.description}` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {selectedStyle.id !== 'none' && (
                  <div className="text-[11px] text-zinc-400 bg-white/[0.02] border border-white/[0.05] rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                    <span className="text-zinc-500 font-mono shrink-0">Tag:</span>
                    <span className="font-mono text-zinc-300 truncate">"{selectedStyle.tagPrefix}"</span>
                  </div>
                )}
              </div>

              {/* Dimension Selector */}
              <div className="flex flex-col gap-2.5 pt-1 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    Dimension
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {currentDimConfig.width} × {currentDimConfig.height}px
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {DIMENSION_KEYS.map((dimKey) => {
                    const item = DIMENSIONS[dimKey];
                    const isSelected = selectedDimension === dimKey;

                    return (
                      <button
                        key={dimKey}
                        type="button"
                        onClick={() => setSelectedDimension(dimKey)}
                        disabled={isGenerating}
                        className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-center transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-white text-zinc-950 border-white shadow-lg shadow-white/10 font-semibold'
                            : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08] hover:border-white/[0.2]'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {/* Visual aspect preview shape */}
                        <div className="h-6 flex items-center justify-center mb-1">
                          <div
                            className={`border rounded-[2px] transition-colors ${
                              isSelected
                                ? 'border-zinc-950 bg-zinc-950/20'
                                : 'border-zinc-500 bg-zinc-800/60'
                            }`}
                            style={{
                              aspectRatio: item.cssAspectRatio,
                              height:
                                dimKey === '1:1'
                                  ? '16px'
                                  : dimKey === '16:9'
                                  ? '11px'
                                  : dimKey === '9:16'
                                  ? '20px'
                                  : dimKey === '4:3'
                                  ? '14px'
                                  : '18px',
                            }}
                          />
                        </div>

                        <span className="text-xs font-mono tracking-tight leading-tight">
                          {dimKey}
                        </span>
                        <span
                          className={`text-[9px] mt-0.5 leading-none ${
                            isSelected ? 'text-zinc-700 font-medium' : 'text-zinc-500'
                          }`}
                        >
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Big High-Converting Generate Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full py-4 px-6 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-[0_4px_24px_rgba(255,255,255,0.12)] bg-gradient-to-r from-white via-zinc-100 to-zinc-200 text-zinc-950 hover:to-white active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer border border-white/40"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
                      <span>Synthesizing ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-zinc-950 fill-zinc-950" />
                      <span>Generate Image</span>
                    </>
                  )}
                </button>
              </div>

              {/* Feedback Notices */}
              {error && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="font-semibold text-red-100">Generation Notice</span>
                    <span className="text-red-300 leading-relaxed">{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-200 ml-1 font-mono"
                  >
                    ✕
                  </button>
                </div>
              )}

              {fallbackNotice && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs">
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{fallbackNotice}</span>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: Large Stage Showcase & Gallery (7 cols) */}
          <section className="lg:col-span-7 flex flex-col gap-6" ref={previewRef}>
            {/* Top Stage Bar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Canvas Preview
                </span>
                {activeItem && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-md">
                      Ratio {activeItem.appliedDimension}
                    </span>
                    {activeItem.styleName && (
                      <span className="text-[11px] font-medium text-amber-300/90 bg-amber-400/[0.08] border border-amber-400/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Palette className="w-3 h-3 text-amber-400" />
                        <span>{activeItem.styleName}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Copy Prompt Button near generated image area */}
              {activeItem && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
                    title="Copy this image's prompt to clipboard"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied Prompt!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Large Stage Frame */}
            <div
              className={`w-full rounded-2xl border border-white/[0.09] bg-[#090b0e] overflow-hidden relative shadow-[0_16px_48px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all ${
                isGenerating ? 'ring-1 ring-white/30' : ''
              }`}
              style={{
                minHeight: '440px',
                maxHeight: '740px',
              }}
            >
              {/* Studio Canvas Matte Grid Background */}
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />

              {/* 1. Loading Animation */}
              {isGenerating && (
                <div className="w-full h-full min-h-[460px] flex flex-col items-center justify-center p-8 gap-5 bg-[#090b0e]/95 z-20">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                    <Sparkles className="w-8 h-8 text-white absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center max-w-sm">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Rendering High-Fidelity Canvas
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Processing with Puter.js in {selectedDimension} format... ({elapsedSeconds}s)
                    </p>
                  </div>
                  <div className="w-56 h-1.5 bg-white/[0.08] rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-gradient-to-r from-zinc-300 to-white animate-pulse w-3/4 rounded-full" />
                  </div>
                </div>
              )}

              {/* 2. Active Image Display */}
              {!isGenerating && activeItem && (
                <div className="w-full h-full flex flex-col items-center justify-center relative group p-3 sm:p-5">
                  <img
                    src={activeItem.imageUrl}
                    alt={activeItem.prompt}
                    className="max-h-[640px] w-auto max-w-full rounded-xl object-contain shadow-2xl transition-transform"
                  />

                  {/* Top-Right Quick Inspection Badges */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(true)}
                      className="p-2.5 rounded-xl bg-black/75 hover:bg-black/90 border border-white/20 text-zinc-200 hover:text-white transition-all backdrop-blur-md shadow-lg cursor-pointer"
                      title="Fullscreen inspect"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <a
                      href={activeItem.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-black/75 hover:bg-black/90 border border-white/20 text-zinc-200 hover:text-white transition-all backdrop-blur-md shadow-lg cursor-pointer"
                      title="Open source URL in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Floating Prompt Overlay on Bottom of Image */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-3 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-300 line-clamp-1 italic">
                      "{activeItem.prompt}"
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="shrink-0 text-[11px] font-medium text-white hover:text-zinc-200 flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md transition-colors"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Empty State */}
              {!isGenerating && !activeItem && (
                <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 gap-4 min-h-[440px]">
                  <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 shadow-xl">
                    <Sparkles className="w-9 h-9" />
                  </div>
                  <div className="max-w-md flex flex-col gap-1.5">
                    <h3 className="text-base font-semibold text-zinc-200">
                      Your Canvas is Empty
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Type your description or hit <strong className="text-zinc-300">Surprise Me</strong>, pick an aspect ratio, and click <strong className="text-zinc-300">Generate Image</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar Below Generated Image (Download & Regenerate) */}
            {activeItem && (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full sm:flex-1 py-4 px-6 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(255,255,255,0.1)] bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
                      <span>Saving File...</span>
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Downloaded Successfully!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 text-zinc-950" />
                      <span>Download Image</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPrompt(activeItem.prompt);
                    setSelectedDimension(activeItem.dimension);
                    handleGenerate();
                  }}
                  disabled={isGenerating}
                  className="w-full sm:w-auto py-4 px-5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.1] text-zinc-200 hover:text-white hover:bg-white/[0.12] disabled:opacity-40 cursor-pointer"
                  title="Generate a new variation with this prompt"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Regenerate</span>
                </button>
              </div>
            )}

            {/* Thumbnail Carousel for Session's Generated Images */}
            {sessionItems.length > 0 && (
              <div className="flex flex-col gap-3 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Session Gallery
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      ({sessionItems.length} {sessionItems.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => scrollCarousel('left')}
                      className="p-1 rounded-md bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Scroll left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCarousel('right')}
                      className="p-1 rounded-md bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Scroll right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSession}
                      className="p-1 ml-2 rounded-md bg-white/[0.04] hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Clear session gallery"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Horizontal Scrolling Carousel Strip */}
                <div
                  ref={carouselRef}
                  className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scroll-smooth"
                >
                  {sessionItems.map((item, index) => {
                    const isActive = activeItem?.id === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveItemId(item.id)}
                        className={`relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden cursor-pointer transition-all border ${
                          isActive
                            ? 'border-white ring-2 ring-white/50 scale-[1.03] shadow-lg shadow-white/10'
                            : 'border-white/[0.1] opacity-60 hover:opacity-100 hover:border-white/30'
                        }`}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.prompt}
                          className="w-full h-full object-cover"
                        />

                        {/* Aspect badge */}
                        <div className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-[9px] font-mono px-1.5 py-0.5 rounded text-white border border-white/10">
                          {item.dimension}
                        </div>

                        {/* Active Indicator */}
                        {isActive && (
                          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-black" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && activeItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative max-w-6xl max-h-[92vh] flex flex-col items-center">
            <img
              src={activeItem.imageUrl}
              alt={activeItem.prompt}
              className="max-h-[84vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <div className="mt-4 flex items-center gap-6 text-xs text-zinc-400">
              <span className="italic max-w-md truncate">"{activeItem.prompt}"</span>
              <span>·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPrompt();
                }}
                className="text-white hover:underline flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedPrompt ? 'Copied!' : 'Copy Prompt'}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="text-white hover:underline flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

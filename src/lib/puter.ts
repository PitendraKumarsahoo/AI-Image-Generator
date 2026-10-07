/**
 * Puter.js AI Image Generation Client & Utilities
 */

export type AspectDimension = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface DimensionConfig {
  id: AspectDimension;
  label: string;
  name: string;
  ratio: { w: number; h: number };
  aspectRatio: string;
  width: number;
  height: number;
  cssAspectRatio: string;
  closestFallback: AspectDimension;
}

export const DIMENSIONS: Record<AspectDimension, DimensionConfig> = {
  '1:1': {
    id: '1:1',
    label: '1:1',
    name: 'Square',
    ratio: { w: 1, h: 1 },
    aspectRatio: '1:1',
    width: 1024,
    height: 1024,
    cssAspectRatio: '1 / 1',
    closestFallback: '1:1',
  },
  '16:9': {
    id: '16:9',
    label: '16:9',
    name: 'Landscape',
    ratio: { w: 16, h: 9 },
    aspectRatio: '16:9',
    width: 1344,
    height: 768,
    cssAspectRatio: '16 / 9',
    closestFallback: '16:9',
  },
  '9:16': {
    id: '9:16',
    label: '9:16',
    name: 'Portrait',
    ratio: { w: 9, h: 16 },
    aspectRatio: '9:16',
    width: 768,
    height: 1344,
    cssAspectRatio: '9 / 16',
    closestFallback: '9:16',
  },
  '4:3': {
    id: '4:3',
    label: '4:3',
    name: 'Standard',
    ratio: { w: 4, h: 3 },
    aspectRatio: '4:3',
    width: 1152,
    height: 864,
    cssAspectRatio: '4 / 3',
    closestFallback: '16:9',
  },
  '3:4': {
    id: '3:4',
    label: '3:4',
    name: 'Vertical',
    ratio: { w: 3, h: 4 },
    aspectRatio: '3:4',
    width: 864,
    height: 1152,
    cssAspectRatio: '3 / 4',
    closestFallback: '9:16',
  },
};

export const DIMENSION_KEYS: AspectDimension[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

export interface StyleFilter {
  id: string;
  name: string;
  tagPrefix: string;
  description: string;
}

export const STYLE_FILTERS: StyleFilter[] = [
  {
    id: 'none',
    name: 'None (Natural)',
    tagPrefix: '',
    description: 'No style filter applied',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    tagPrefix: 'Cyberpunk style, neon lights, high-tech dystopian futuristic aesthetic: ',
    description: 'Neon hues, futuristic tech & rainy night glow',
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    tagPrefix: 'Classical oil painting, rich textured canvas and expressive brushwork: ',
    description: 'Textured canvas & classical painterly tones',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    tagPrefix: 'Minimalist aesthetic, negative space, clean lines, elegant simplicity: ',
    description: 'Stripped back, elegant composition & negative space',
  },
  {
    id: 'sketch',
    name: 'Sketch',
    tagPrefix: 'Detailed pencil sketch, fine charcoal lines, hand-drawn illustration: ',
    description: 'Intricate graphite & charcoal linework',
  },
  {
    id: 'anime',
    name: 'Anime',
    tagPrefix: 'Vibrant modern anime art style, detailed cel-shaded illustration: ',
    description: 'Luminous Japanese animation illustration',
  },
  {
    id: 'cinematic-3d',
    name: 'Cinematic 3D',
    tagPrefix: 'Cinematic 3D render, octane render, Unreal Engine 5 volumetric lighting: ',
    description: 'Hyper-detailed 3D CGI & volumetric lighting',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    tagPrefix: 'Soft watercolor painting, translucent fluid washes, artistic paper texture: ',
    description: 'Translucent pigments & flowing color washes',
  },
  {
    id: 'vintage-film',
    name: 'Vintage Film',
    tagPrefix: 'Vintage 35mm film photograph, nostalgic color grade, subtle analog grain: ',
    description: 'Warm analog nostalgia & authentic grain',
  },
  {
    id: 'fantasy-art',
    name: 'Fantasy Art',
    tagPrefix: 'Epic fantasy concept art, mystical ethereal lighting, magical atmosphere: ',
    description: 'Mythical worlds, glowing runes & epic scope',
  },
];

declare global {
  interface Window {
    puter?: any;
  }
}

/**
 * AI-powered prompt expansion using Puter.js chat engine with
 * graceful aesthetic enrichment fallback.
 */
export async function enhancePromptWithAI(rawPrompt: string): Promise<string> {
  const trimmed = rawPrompt.trim();
  if (!trimmed) return rawPrompt;

  try {
    const puter = await getPuterInstance();
    if (puter?.ai?.chat) {
      const response = await puter.ai.chat(
        `You are an expert AI prompt artist. Expand this basic description into an evocative, visually rich, detailed image prompt. Include lighting, mood, textures, depth, and aesthetics. Keep it under 50 words. Do not use quotes or introductory text. Respond ONLY with the expanded prompt:\n\n"${trimmed}"`
      );

      let text = '';
      if (typeof response === 'string') {
        text = response;
      } else if (response?.message?.content) {
        if (typeof response.message.content === 'string') {
          text = response.message.content;
        } else if (Array.isArray(response.message.content)) {
          text = response.message.content.map((b: any) => b.text || '').join(' ');
        }
      } else if (response?.text) {
        text = response.text;
      } else if (typeof response?.toString === 'function') {
        text = response.toString();
      }

      text = text.replace(/^["'\s]+|["'\s]+$/g, '').trim();
      // Remove any prefix like "Expanded prompt:" or "Here is the prompt:"
      text = text.replace(/^(Here is (the|an) (expanded|enhanced) prompt:?|Expanded prompt:?|Prompt:?)\s*/i, '');

      if (text && text.length > trimmed.length) {
        return text;
      }
    }
  } catch (err) {
    console.warn('Puter.ai.chat prompt enhance failed, applying curated enrichment:', err);
  }

  // Curated aesthetic visual enhancements fallback
  const fallbackModifiers = [
    'cinematic lighting, volumetric atmosphere, ultra-detailed 8k resolution, photorealistic textures, masterwork composition',
    'rich dramatic chiaroscuro lighting, intricate details, vivid atmospheric depth, studio quality, fine render',
    'hyper-detailed foreground, subtle particle haze, golden hour illumination, cinematic color grading',
    'ethereal glowing ambiance, sharp focal depth, masterfully composed, vivid naturalistic details',
  ];
  const chosen = fallbackModifiers[Math.floor(Math.random() * fallbackModifiers.length)];
  return `${trimmed}, ${chosen}`;
}

/**
 * Ensures the Puter.js client is loaded and accessible.
 */
export async function getPuterInstance(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Puter.js is only available in the browser.');
  }

  if (window.puter && window.puter.ai && typeof window.puter.ai.txt2img === 'function') {
    return window.puter;
  }

  // Check if script tag is already in DOM, or inject it
  return new Promise((resolve, reject) => {
    let script = document.querySelector('script[src*="js.puter.com"]') as HTMLScriptElement | null;
    
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      document.head.appendChild(script);
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.puter && window.puter.ai && typeof window.puter.ai.txt2img === 'function') {
        clearInterval(interval);
        resolve(window.puter);
      } else if (attempts > 50) {
        clearInterval(interval);
        reject(
          new Error(
            'Puter.js failed to initialize. Please check your internet connection or ad-blocker.'
          )
        );
      }
    }, 150);
  });
}

/**
 * Extracts the image src URL or data-URL from Puter txt2img response.
 */
function parseImageSrc(result: any): string {
  if (!result) return '';
  if (typeof result === 'string') return result;

  // HTMLImageElement in browsers
  if (typeof HTMLImageElement !== 'undefined' && result instanceof HTMLImageElement) {
    return result.src || '';
  }

  if (typeof result === 'object') {
    if (result.src && typeof result.src === 'string') return result.src;
    if (result.url && typeof result.url === 'string') return result.url;
    if (result.image) {
      if (typeof result.image === 'string') return result.image;
      if (result.image.src) return result.image.src;
      if (result.image.url) return result.image.url;
    }
    if (typeof result.toString === 'function') {
      const str = result.toString();
      if (str.startsWith('http') || str.startsWith('data:') || str.startsWith('blob:')) {
        return str;
      }
    }
  }

  return '';
}

export interface GenerationResult {
  imageUrl: string;
  appliedDimension: AspectDimension | 'default';
  fallbackApplied: boolean;
}

/**
 * Generates an image using Puter.js txt2img API.
 * Applies the selected dimension whenever supported, and falls back to
 * closest supported dimension rather than breaking the application.
 */
export async function generateImage(
  prompt: string,
  dimension: AspectDimension
): Promise<GenerationResult> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error('Please enter a description for the image.');
  }

  const puter = await getPuterInstance();
  const config = DIMENSIONS[dimension];

  // Strategy 1: Request with primary dimension options (ratio + aspect_ratio + width + height)
  try {
    const res = await puter.ai.txt2img(trimmed, {
      ratio: config.ratio,
      aspect_ratio: config.aspectRatio,
      width: config.width,
      height: config.height,
    });
    const src = parseImageSrc(res);
    if (src) {
      return {
        imageUrl: src,
        appliedDimension: dimension,
        fallbackApplied: false,
      };
    }
  } catch (err1: any) {
    console.warn(`Puter txt2img with primary options for ${dimension} failed:`, err1);

    // Strategy 2: If model rejected the specific dimension (e.g. 4:3 or 3:4 not supported),
    // try the closest supported option
    if (config.closestFallback && config.closestFallback !== dimension) {
      try {
        const fallbackConfig = DIMENSIONS[config.closestFallback];
        console.info(`Falling back to closest supported dimension: ${fallbackConfig.id}`);
        const res = await puter.ai.txt2img(trimmed, {
          ratio: fallbackConfig.ratio,
          aspect_ratio: fallbackConfig.aspectRatio,
          width: fallbackConfig.width,
          height: fallbackConfig.height,
        });
        const src = parseImageSrc(res);
        if (src) {
          return {
            imageUrl: src,
            appliedDimension: config.closestFallback,
            fallbackApplied: true,
          };
        }
      } catch (err2) {
        console.warn(`Puter txt2img fallback dimension attempt failed:`, err2);
      }
    }

    // Strategy 3: Try with simple aspect_ratio string only
    try {
      const res = await puter.ai.txt2img(trimmed, {
        aspect_ratio: config.aspectRatio,
      });
      const src = parseImageSrc(res);
      if (src) {
        return {
          imageUrl: src,
          appliedDimension: dimension,
          fallbackApplied: false,
        };
      }
    } catch (err3) {
      console.warn(`Puter txt2img aspect_ratio only failed:`, err3);
    }

    // Strategy 4: Fallback to basic prompt call without dimension constraints rather than failing
    try {
      console.info('Retrying Puter txt2img without dimension constraint...');
      const res = await puter.ai.txt2img(trimmed);
      const src = parseImageSrc(res);
      if (src) {
        return {
          imageUrl: src,
          appliedDimension: 'default',
          fallbackApplied: true,
        };
      }
    } catch (finalErr: any) {
      console.error('Puter txt2img final attempt failed:', finalErr);
      const errorMsg =
        finalErr?.message ||
        err1?.message ||
        'Failed to generate image. Please try again with a different prompt.';
      throw new Error(errorMsg);
    }
  }

  throw new Error('Image generation finished without returning an image.');
}

/**
 * Downloads the actual generated image file directly to the user's computer.
 */
export async function downloadImageFile(imageUrl: string, suggestedFilename?: string): Promise<void> {
  if (!imageUrl) return;

  const defaultName = suggestedFilename || `puter-ai-${Date.now()}.png`;

  // 1. Data URLs
  if (imageUrl.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = defaultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 2. Blob URLs
  if (imageUrl.startsWith('blob:')) {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = defaultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 3. Remote URL via CORS fetch to blob
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      return;
    }
  } catch (err) {
    console.warn('Fetch to blob failed, falling back to Canvas rendering:', err);
  }

  // 4. Remote URL via Canvas (handles cross-origin image drawing)
  try {
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = defaultName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 15000);
                resolve();
              } else {
                reject(new Error('Canvas export produced empty blob'));
              }
            },
            'image/png'
          );
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image into canvas'));
      img.src = imageUrl;
    });
    return;
  } catch (canvasErr) {
    console.warn('Canvas export failed, falling back to direct link download:', canvasErr);
  }

  // 5. Ultimate fallback: anchor click
  const a = document.createElement('a');
  a.href = imageUrl;
  a.download = defaultName;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

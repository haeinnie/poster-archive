/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText } from 'lucide-react';

interface PosterMediaProps {
  url: string;
  title: string;
  designer: string;
  week: string;
  subtitle?: string;
  className?: string;
  isThumbnail?: boolean; // Thumbnail view inside a grid card
}

export const isPdf = (url: string | undefined): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('application/pdf') ||
    lower.includes('.pdf') ||
    url.startsWith('data:application/pdf')
  );
};

// Helper to convert base64 PDF into Uint8Array for PDF.js compatibility
const convertBase64ToUint8Array = (base64Str: string): Uint8Array => {
  const parts = base64Str.split(';base64,');
  const rawBase64 = parts[1] || parts[0];
  const binaryString = atob(rawBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Dynamic CDN Loader for PDF.js to stay standalone and compatible
const loadPdfJS = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const windowWithPdfjs = window as any;
    if (windowWithPdfjs.pdfjsLib) {
      resolve(windowWithPdfjs.pdfjsLib);
      return;
    }

    const existingScript = document.getElementById('pdfjs-cdn-script');
    if (existingScript) {
      const handleLoad = () => resolve(windowWithPdfjs.pdfjsLib);
      existingScript.addEventListener('load', handleLoad);
      return;
    }

    const script = document.createElement('script');
    script.id = 'pdfjs-cdn-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.async = true;
    script.onload = () => {
      windowWithPdfjs.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      resolve(windowWithPdfjs.pdfjsLib);
    };
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};

function PdfRenderer({ url, className = '' }: { url: string; className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorFlag, setErrorFlag] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const renderPdf = async () => {
      try {
        setLoading(true);
        setErrorFlag(false);
        const pdfjs = await loadPdfJS();
        
        let pdfData: string | Uint8Array = url;
        if (url.startsWith('data:application/pdf;base64,')) {
          pdfData = convertBase64ToUint8Array(url);
        }

        const loadingTask = pdfjs.getDocument(
          typeof pdfData === 'string' ? pdfData : { data: pdfData }
        );
        const pdf = await loadingTask.promise;
        
        if (!active) return;
        
        const page = await pdf.getPage(1);
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Determine viewport and high rendering resolution
        const unscaledViewport = page.getViewport({ scale: 1 });
        const parentWidth = canvas.parentElement?.clientWidth || 400;
        const scale = parentWidth / unscaledViewport.width;
        
        const viewport = page.getViewport({ scale: Math.max(scale * 1.5, 2.0) }); // high quality render

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        if (active) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error rendering PDF as image:', err);
        if (active) {
          setErrorFlag(true);
          setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      active = false;
    };
  }, [url]);

  if (errorFlag) {
    return (
      <div className="w-full h-full bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-neutral-300 rounded-sm">
        <FileText className="w-10 h-10 text-neutral-400 mb-2" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-bold">
          PDF DOCUMENT (BLOCKED VIEW)
        </span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-neutral-100 ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF9F6]/80 backdrop-blur-xs z-10">
          <div className="w-6 h-6 rounded-full border-2 border-t-neutral-900 border-neutral-250 animate-spin mb-2" />
          <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
            Rendering PDF page...
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain max-h-full"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
}

export default function PosterMedia({
  url,
  title,
  designer,
  week,
  subtitle,
  className = '',
  isThumbnail = false,
}: PosterMediaProps) {
  if (!url) {
    return (
      <div className={`w-full h-full bg-[#EAE8E1] flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">No Media</span>
      </div>
    );
  }

  const isPdfFile = isPdf(url);

  if (isPdfFile) {
    return (
      <div className={`w-full h-full relative overflow-hidden bg-neutral-100 ${className}`}>
        <PdfRenderer url={url} />
        {/* PDF Badge Indicator Overlays */}
        <div className="absolute top-2.5 right-2.5 bg-[#262626] text-white text-[8px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded-sm font-bold shadow-xs border border-white/10 z-10">
          PDF
        </div>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={title}
      className={`w-full h-full object-cover ${className}`}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}

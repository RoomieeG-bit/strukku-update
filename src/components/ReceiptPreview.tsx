/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Receipt, ReceiptFontFamily, ReceiptPaperSizePreset, CustomLabel } from '../types';
import { formatCurrency, formatDateTime, RECEIPT_FONTS, getFontFamilyCss, PAPER_SIZE_OPTIONS, getPaperWidthMm, getReceiptLabels } from '../utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Printer, 
  Download, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  Copy, 
  Info, 
  QrCode, 
  Type, 
  Maximize2, 
  Sliders, 
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react';

// Helper to parse oklch color string and convert to standard rgb/rgba
const parseOklchToRgb = (colorStr: string): string => {
  if (!colorStr || !colorStr.includes('oklch')) return colorStr;
  
  try {
    // Extract numbers from something like: oklch(0.208 0.042 265.755) or oklch(0.9 0.01 200 / 0.5)
    // Also handles color(oklch 0.208 0.042 265.755)
    const match = colorStr.match(/(?:oklch|color\s*\(\s*oklch)\s*\(\s*([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+%?)(?:\s*\/\s*([0-9.]+%?))?\s*\)?/i) 
                  || colorStr.match(/(?:oklch|color\s+oklch)\s+([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+%?)(?:\s*\/?\s*([0-9.]+%?))?/i);
                  
    if (match) {
      const lVal = match[1];
      const cVal = match[2];
      const hVal = match[3];
      const aVal = match[4] || '1';
      
      // Convert percentage lightness to 0-1
      let l = lVal.endsWith('%') ? parseFloat(lVal) / 100 : parseFloat(lVal);
      let c = cVal.endsWith('%') ? parseFloat(cVal) / 100 : parseFloat(cVal);
      let h = hVal.endsWith('%') ? parseFloat(hVal) / 100 : parseFloat(hVal);
      let a = aVal.endsWith('%') ? parseFloat(aVal) / 100 : parseFloat(aVal);
      
      if (isNaN(l)) l = 0.5;
      if (isNaN(c)) c = 0;
      if (isNaN(h)) h = 0;
      if (isNaN(a)) a = 1;
      
      // Grayscale mapping for very low chroma or simple conversion
      if (c < 0.01) {
        const gray = Math.round(l * 255);
        return `rgba(${gray}, ${gray}, ${gray}, ${a})`;
      }
      
      // Oklch to Oklab:
      const L = l;
      const a_coord = c * Math.cos((h * Math.PI) / 180);
      const b_coord = c * Math.sin((h * Math.PI) / 180);
      
      // Oklab to LMS:
      const l_lms = L + 0.3963377774 * a_coord + 0.2158037573 * b_coord;
      const m_lms = L - 0.1055613458 * a_coord - 0.0638541728 * b_coord;
      const s_lms = L - 0.0894841775 * a_coord - 1.2914855480 * b_coord;
      
      // LMS to linear sRGB:
      const l_lms_cube = l_lms * l_lms * l_lms;
      const m_lms_cube = m_lms * m_lms * m_lms;
      const s_lms_cube = s_lms * s_lms * s_lms;
      
      const r_lin = +4.0767416621 * l_lms_cube - 3.3077115913 * m_lms_cube + 0.2309699292 * s_lms_cube;
      const g_lin = -1.2684380046 * l_lms_cube + 2.6097574011 * m_lms_cube - 0.3413193965 * s_lms_cube;
      const b_lin = -0.0041960863 * l_lms_cube - 0.7034186147 * m_lms_cube + 1.7076147010 * s_lms_cube;
      
      // Helper function to convert linear sRGB to sRGB
      const transfer = (x: number) => {
        return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
      };
      
      const r = Math.round(Math.max(0, Math.min(1, transfer(r_lin))) * 255);
      const g = Math.round(Math.max(0, Math.min(1, transfer(g_lin))) * 255);
      const b = Math.round(Math.max(0, Math.min(1, transfer(b_lin))) * 255);
      
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  } catch (err) {
    console.error('Error parsing oklch color:', err);
  }
  
  // Grayscale fallback
  return 'rgba(0, 0, 0, 1)';
};

// Helper to replace oklch inside custom stylesheet texts with RGB/RGBA
const replaceOklchInCss = (cssText: string): string => {
  if (!cssText || !cssText.includes('oklch')) return cssText;
  
  return cssText.replace(/oklch\s*\(\s*([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+%?)(?:\s*\/\s*([^)]+))?\s*\)/gi, (match, lVal, cVal, hVal, aVal) => {
    try {
      let l = lVal.endsWith('%') ? parseFloat(lVal) / 100 : parseFloat(lVal);
      let c = cVal.endsWith('%') ? parseFloat(cVal) / 100 : parseFloat(cVal);
      let h = hVal.endsWith('%') ? parseFloat(hVal) / 100 : parseFloat(hVal);
      
      let a = 1;
      if (aVal) {
        const cleanA = aVal.trim();
        if (cleanA.startsWith('var(')) {
          a = 1; // Default fallback for CSS variable opacity
        } else {
          a = cleanA.endsWith('%') ? parseFloat(cleanA) / 100 : parseFloat(cleanA);
        }
      }
      
      if (isNaN(l)) l = 0.5;
      if (isNaN(c)) c = 0;
      if (isNaN(h)) h = 0;
      if (isNaN(a)) a = 1;
      
      // Convert OKLCH to RGB
      if (c < 0.001) {
        const gray = Math.round(l * 255);
        return `rgba(${gray}, ${gray}, ${gray}, ${a})`;
      }
      
      const L = l;
      const a_coord = c * Math.cos((h * Math.PI) / 180);
      const b_coord = c * Math.sin((h * Math.PI) / 180);
      
      const l_lms = L + 0.3963377774 * a_coord + 0.2158037573 * b_coord;
      const m_lms = L - 0.1055613458 * a_coord - 0.0638541728 * b_coord;
      const s_lms = L - 0.0894841775 * a_coord - 1.2914855480 * b_coord;
      
      const l_lms_cube = l_lms * l_lms * l_lms;
      const m_lms_cube = m_lms * m_lms * m_lms;
      const s_lms_cube = s_lms * s_lms * s_lms;
      
      const r_lin = +4.0767416621 * l_lms_cube - 3.3077115913 * m_lms_cube + 0.2309699292 * s_lms_cube;
      const g_lin = -1.2684380046 * l_lms_cube + 2.6097574011 * m_lms_cube - 0.3413193965 * s_lms_cube;
      const b_lin = -0.0041960863 * l_lms_cube - 0.7034186147 * m_lms_cube + 1.7076147010 * s_lms_cube;
      
      const transfer = (x: number) => {
        return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
      };
      
      const r = Math.round(Math.max(0, Math.min(1, transfer(r_lin))) * 255);
      const g = Math.round(Math.max(0, Math.min(1, transfer(g_lin))) * 255);
      const b = Math.round(Math.max(0, Math.min(1, transfer(b_lin))) * 255);
      
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    } catch (e) {
      return 'rgba(255, 255, 255, 1)';
    }
  });
};

// Preprocesses all stylesheets on the page to replace oklch with rgb/rgba before html2canvas runs
const prepareStylesheets = async (): Promise<() => void> => {
  const cleanups: Array<() => void> = [];

  try {
    // 1. Process all existing <style> elements in the document
    const styles = Array.from(document.querySelectorAll('style'));
    for (const style of styles) {
      const originalText = style.textContent;
      if (originalText && originalText.includes('oklch')) {
        const cleanedText = replaceOklchInCss(originalText);
        style.textContent = cleanedText;
        cleanups.push(() => {
          style.textContent = originalText;
        });
      }
    }

    // 2. Process all <link rel="stylesheet"> elements
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    for (const link of links) {
      try {
        const href = link.href;
        if (href) {
          // Check if same origin to avoid CORS issue on fetch
          const url = new URL(href, window.location.href);
          if (url.origin === window.location.origin) {
            // Fetch stylesheet content
            const response = await fetch(href);
            if (response.ok) {
              const cssText = await response.text();
              if (cssText.includes('oklch')) {
                // Create a temporary style element with cleaned css
                const tempStyle = document.createElement('style');
                tempStyle.id = 'temp-html2canvas-style';
                tempStyle.textContent = replaceOklchInCss(cssText);
                document.head.appendChild(tempStyle);

                // Disable original link
                const originalDisabled = link.disabled;
                link.disabled = true;

                cleanups.push(() => {
                  if (tempStyle.parentNode) {
                    tempStyle.parentNode.removeChild(tempStyle);
                  }
                  link.disabled = originalDisabled;
                });
              }
            }
          }
        }
      } catch (linkErr) {
        console.error('Error preprocessing link stylesheet:', linkErr);
      }
    }
  } catch (err) {
    console.error('Error inside prepareStylesheets:', err);
  }

  // Return restore function
  return () => {
    cleanups.forEach(restore => {
      try {
        restore();
      } catch (e) {
        // Ignore restoration errors
      }
    });
  };
};

// Common onclone function to resolve oklch values before canvas capture
const resolveOklchStylesInClone = (clonedDoc: Document, clonedElement: HTMLElement) => {
  const traverse = (el: Element) => {
    if (el instanceof HTMLElement || el instanceof SVGElement) {
      const computed = window.getComputedStyle(el);
      const props = [
        'color', 
        'backgroundColor', 
        'borderColor', 
        'borderTopColor', 
        'borderBottomColor', 
        'borderLeftColor', 
        'borderRightColor',
        'outlineColor',
        'fill',
        'stroke'
      ];
      
      props.forEach(prop => {
        try {
          const val = computed[prop as any];
          if (val && val.includes('oklch')) {
            el.style[prop as any] = parseOklchToRgb(val);
          }
        } catch (e) {
          // Ignore style access errors
        }
      });
    }
    
    // Recurse children
    for (let i = 0; i < el.children.length; i++) {
      traverse(el.children[i]);
    }
  };
  
  traverse(clonedElement);
};

// Robust helper to capture receipt with exact active fonts, colors, and crisp scale
const captureReceiptCanvas = async (element: HTMLElement, receipt: Receipt): Promise<HTMLCanvasElement> => {
  // 1. Ensure all document fonts are fully loaded before rendering to canvas
  if (document.fonts) {
    try {
      await document.fonts.ready;
      const activeFontCss = getFontFamilyCss(receipt.fontFamily);
      const primaryFont = activeFontCss.split(',')[0].replace(/["']/g, '').trim();
      if (primaryFont) {
        await Promise.allSettled([
          document.fonts.load(`10px "${primaryFont}"`),
          document.fonts.load(`bold 10px "${primaryFont}"`),
          document.fonts.load(`11px "${primaryFont}"`),
          document.fonts.load(`bold 11px "${primaryFont}"`),
          document.fonts.load(`14px "${primaryFont}"`),
          document.fonts.load(`bold 14px "${primaryFont}"`),
          document.fonts.load(`16px "${primaryFont}"`),
          document.fonts.load(`bold 16px "${primaryFont}"`),
          document.fonts.load(`28px "${primaryFont}"`),
          document.fonts.load(`bold 28px "${primaryFont}"`),
          document.fonts.load(`34px "${primaryFont}"`),
          document.fonts.load(`900 34px "${primaryFont}"`),
        ]);
      }
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font preload warning:', e);
    }
  }

  const activeFontCss = getFontFamilyCss(receipt.fontFamily);

  return await html2canvas(element, {
    scale: 3, // Crisp 3x HD scale for ultra-clear typography
    useCORS: true,
    backgroundColor: '#ffffff', // Solid white backdrop
    logging: false,
    onclone: (clonedDoc, clonedElement) => {
      // A. Transfer loaded FontFace instances directly to the cloned iframe document
      if ('fonts' in document && 'fonts' in clonedDoc) {
        try {
          document.fonts.forEach((fontFace) => {
            try {
              (clonedDoc as any).fonts.add(fontFace);
            } catch (err) {}
          });
        } catch (err) {}
      }

      // B. Copy all link stylesheet elements and style tags to clonedDoc head
      const headLinksAndStyles = document.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"], style');
      headLinksAndStyles.forEach((el) => {
        try {
          clonedDoc.head.appendChild(el.cloneNode(true));
        } catch (e) {}
      });

      // C. Inject explicit font import and mandatory override CSS into clonedDoc head
      const fontOverride = clonedDoc.createElement('style');
      fontOverride.id = 'export-font-override';
      fontOverride.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=DotGothic16&family=Inconsolata:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Roboto+Mono:wght@400;500;600;700&family=Share+Tech+Mono&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=VT323&display=swap');

        .receipt-paper, #receipt-print-area {
          font-family: ${activeFontCss} !important;
        }
        #receipt-print-area *:not(svg):not(path):not(rect):not(circle):not(tspan) {
          font-family: inherit !important;
        }
      `;
      clonedDoc.head.appendChild(fontOverride);

      // D. Enforce font family on root cloned element
      (clonedElement as HTMLElement).style.fontFamily = activeFontCss;

      // E. Update SVG text for watermark status stamp
      const watermarkTexts = (clonedElement as HTMLElement).querySelectorAll('#receipt-status-watermark text');
      watermarkTexts.forEach((txt) => {
        txt.setAttribute('font-family', activeFontCss);
        (txt as HTMLElement).style.fontFamily = activeFontCss;
      });

      // F. Resolve OKLCH colors
      resolveOklchStylesInClone(clonedDoc, clonedElement as HTMLElement);
    },
  });
};

// Helper to update dynamic print styling based on active paper width in mm
const updatePrintStyles = (widthMm: number) => {
  let styleEl = document.getElementById('dynamic-receipt-print-style') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-receipt-print-style';
    document.head.appendChild(styleEl);
  }
  const paddingMm = widthMm <= 58 ? '2.5mm' : '4.5mm';
  styleEl.textContent = `
    @media print {
      @page {
        size: ${widthMm}mm auto !important;
        margin: 0mm !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        width: 100% !important;
      }
      body * {
        visibility: hidden !important;
      }
      #receipt-print-area, #receipt-print-area * {
        visibility: visible !important;
      }
      #receipt-print-area {
        position: absolute !important;
        left: 50% !important;
        top: 0 !important;
        transform: translateX(-50%) !important;
        width: ${widthMm}mm !important;
        max-width: ${widthMm}mm !important;
        margin: 0 !important;
        padding: ${paddingMm} !important;
        box-shadow: none !important;
        background: #ffffff !important;
        color: #000000 !important;
      }
      .receipt-paper::after {
        display: none !important;
      }
    }
  `;
};

interface ReceiptPreviewProps {
  receipt: Receipt;
  currencySymbol: string;
  onUpdateReceipt?: (updated: Partial<Receipt>) => void;
}

export default function ReceiptPreview({ receipt, currencySymbol, onUpdateReceipt }: ReceiptPreviewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);
  const [showCustomSizeModal, setShowCustomSizeModal] = useState(false);

  const labels = getReceiptLabels(receipt.labels);

  const headerCustomLabels = (receipt.customLabels || []).filter(l => l.position === 'HEADER' && (l.label || l.value));
  const metaCustomLabels = (receipt.customLabels || []).filter(l => l.position === 'META' && (l.label || l.value));
  const itemsSummaryCustomLabels = (receipt.customLabels || []).filter(l => l.position === 'ITEMS_SUMMARY' && (l.label || l.value));
  const paymentCustomLabels = (receipt.customLabels || []).filter(l => l.position === 'PAYMENT' && (l.label || l.value));
  const footerCustomLabels = (receipt.customLabels || []).filter(l => l.position === 'FOOTER' && (l.label || l.value));

  const renderCustomLabelItem = (item: CustomLabel) => {
    const showColon = item.showColon !== false;
    return (
      <div key={item.id} className={`flex justify-between items-start gap-2 ${item.isBold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
        <span className="shrink-0">{item.label}{showColon ? ':' : ''}</span>
        <span className="text-right break-words">{item.value}</span>
      </div>
    );
  };

  const activePaperWidthMm = getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm);
  // Convert mm to screen preview pixel max-width (~250px for 58mm, ~350px for 80mm, ~435px for 100mm)
  const previewMaxWidthPx = Math.max(240, Math.min(680, Math.round(activePaperWidthMm * 4.375)));
  const isNarrowPaper = activePaperWidthMm <= 62;

  // Sync dynamic print stylesheet whenever paper size changes
  useEffect(() => {
    updatePrintStyles(activePaperWidthMm);
  }, [activePaperWidthMm]);

  // Helper to copy Transaction ID to clipboard
  const handleCopyTxId = () => {
    navigator.clipboard.writeText(receipt.transactionId);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  // Export to Image (PNG)
  const handleExportPNG = async () => {
    if (!receiptRef.current) return;
    let restoreStyles: (() => void) | null = null;
    try {
      setExporting('PNG');
      restoreStyles = await prepareStylesheets();
      
      const canvas = await captureReceiptCanvas(receiptRef.current, receipt);
      
      const link = document.createElement('a');
      link.download = `Struk-${receipt.storeName.replace(/\s+/g, '_')}-${receipt.transactionId.replace(/[\/\s:]/g, '-')}-${activePaperWidthMm}mm.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error exporting PNG:', err);
    } finally {
      if (restoreStyles) {
        restoreStyles();
      }
      setExporting(null);
    }
  };

  // Export to Image (JPG)
  const handleExportJPG = async () => {
    if (!receiptRef.current) return;
    let restoreStyles: (() => void) | null = null;
    try {
      setExporting('JPG');
      restoreStyles = await prepareStylesheets();
      
      const canvas = await captureReceiptCanvas(receiptRef.current, receipt);
      
      const link = document.createElement('a');
      link.download = `Struk-${receipt.storeName.replace(/\s+/g, '_')}-${receipt.transactionId.replace(/[\/\s:]/g, '-')}-${activePaperWidthMm}mm.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (err) {
      console.error('Error exporting JPG:', err);
    } finally {
      if (restoreStyles) {
        restoreStyles();
      }
      setExporting(null);
    }
  };

  // Export to PDF with custom exact thermal paper width
  const handleExportPDF = async () => {
    if (!receiptRef.current) return;
    let restoreStyles: (() => void) | null = null;
    try {
      setExporting('PDF');
      restoreStyles = await prepareStylesheets();
      
      const canvas = await captureReceiptCanvas(receiptRef.current, receipt);
      const imgData = canvas.toDataURL('image/png');
      
      const receiptWidthMm = activePaperWidthMm;
      const receiptHeightMm = (canvas.height * receiptWidthMm) / canvas.width;
      const topBottomMargin = receiptWidthMm <= 58 ? 3 : 5;

      // Create PDF with custom receipt dimensions matching active paper width
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [receiptWidthMm, Math.max(receiptWidthMm, Math.ceil(receiptHeightMm + (topBottomMargin * 2)))],
      });

      pdf.addImage(imgData, 'PNG', 0, topBottomMargin, receiptWidthMm, receiptHeightMm);
      pdf.save(`Struk-${receipt.storeName.replace(/\s+/g, '_')}-${receipt.transactionId.replace(/[\/\s:]/g, '-')}-${activePaperWidthMm}mm.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      if (restoreStyles) {
        restoreStyles();
      }
      setExporting(null);
    }
  };

  // Print Receipt directly
  const handlePrint = () => {
    updatePrintStyles(activePaperWidthMm);
    window.print();
  };

  // Barcode & QR Code Generator for Receipt Footer
  const renderBarcodeAndQr = () => {
    const displayType = receipt.codeDisplayType || 'BOTH';
    if (displayType === 'NONE') return null;

    const defaultQrValue = receipt.storeWebsite 
      ? (receipt.storeWebsite.startsWith('http') ? receipt.storeWebsite : `https://${receipt.storeWebsite}`) 
      : `STRUK ID: ${receipt.transactionId}\nTOKO: ${receipt.storeName}\nTANGGAL: ${receipt.dateTime}\nTOTAL: ${formatCurrency(receipt.total, currencySymbol)}\nSTATUS: ${receipt.paymentStatus === 'SUDAH_LUNAS' ? 'LUNAS' : receipt.paymentStatus}`;

    const effectiveQrValue = (receipt.qrValue && receipt.qrValue.trim()) ? receipt.qrValue.trim() : defaultQrValue;
    const qrSize = receipt.qrSize || 90;
    const qrLabel = receipt.qrLabel !== undefined ? receipt.qrLabel : 'Scan untuk cek keaslian struk';
    const barcodeNumber = receipt.barcodeValue || receipt.transactionId.split('/')[0];
    const showBarcodeNumber = receipt.showBarcodeNumber !== false;

    // Standard simulated realistic barcode bars
    const bars = [1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 1];

    return (
      <div className="flex flex-col items-center mt-5 mb-2 gap-3 select-none" id="receipt-code-section">
        {/* QR Code section */}
        {(displayType === 'QR' || displayType === 'BOTH') && (
          <div className="flex flex-col items-center p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <div className="bg-white p-1 flex justify-center">
              <QRCodeSVG 
                value={effectiveQrValue}
                size={qrSize}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            {qrLabel && (
              <span className="text-[8px] font-sans font-medium text-slate-500 mt-1 max-w-[200px] text-center leading-tight">
                {qrLabel}
              </span>
            )}
          </div>
        )}

        {/* Barcode section */}
        {(displayType === 'BARCODE' || displayType === 'BOTH') && (
          <div className="flex flex-col items-center">
            <div className="flex items-end justify-center h-8 bg-transparent w-48 mb-1">
              {bars.map((weight, idx) => (
                <div 
                  key={idx} 
                  className="bg-black h-full" 
                  style={{ 
                    width: `${weight * 2}px`, 
                    marginRight: idx % 2 === 0 ? '2px' : '0px',
                    backgroundColor: idx % 3 === 0 ? '#000000' : idx % 3 === 1 ? '#000000' : 'transparent' 
                  }} 
                />
              ))}
            </div>
            {showBarcodeNumber && (
              <span className="text-[9px] font-mono tracking-widest text-slate-600 uppercase font-semibold">
                *{barcodeNumber}*
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-4" id="receipt-preview-panel">
      {/* Control Actions Header */}
      <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-800 text-slate-300 rounded-lg">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-300">Pratinjau Struk</h4>
            <span className="text-[10px] text-slate-400 font-mono">Simulasi Kasir Fisik</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Quick Paper Size Selector Dropdown */}
          {onUpdateReceipt && (
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-300">
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={receipt.paperSizePreset || (receipt.paperWidthMm && receipt.paperWidthMm !== 80 ? 'CUSTOM' : '80mm')}
                onChange={(e) => {
                  const val = e.target.value as ReceiptPaperSizePreset;
                  if (val === 'CUSTOM') {
                    onUpdateReceipt({
                      paperSizePreset: 'CUSTOM',
                      paperWidthMm: receipt.paperWidthMm || 80,
                    });
                    setShowCustomSizeModal(true);
                  } else {
                    const opt = PAPER_SIZE_OPTIONS.find((p) => p.id === val);
                    onUpdateReceipt({
                      paperSizePreset: val,
                      paperWidthMm: opt ? opt.widthMm : 80,
                    });
                  }
                }}
                className="bg-transparent text-white font-medium text-[11px] outline-none cursor-pointer pr-1"
                title="Pilih ukuran lebar kertas struk thermal / cetak"
                id="quick-paper-size-selector"
              >
                <optgroup label="🖨️ Standar Printer POS">
                  <option value="58mm" className="bg-slate-900 text-white">58 mm (Mini Bluetooth)</option>
                  <option value="80mm" className="bg-slate-900 text-white">80 mm (Standar POS Kasir)</option>
                  <option value="76mm" className="bg-slate-900 text-white">76 mm (Dot Matrix)</option>
                  <option value="100mm" className="bg-slate-900 text-white">100 mm (Struk Lebar)</option>
                </optgroup>
                <optgroup label="⚙️ Kustomisasi">
                  <option value="CUSTOM" className="bg-slate-900 text-white">
                    Kustom ({activePaperWidthMm} mm)...
                  </option>
                </optgroup>
              </select>

              <button
                type="button"
                onClick={() => setShowCustomSizeModal(true)}
                className={`p-0.5 rounded transition cursor-pointer ${
                  receipt.paperSizePreset === 'CUSTOM'
                    ? 'text-amber-400 hover:bg-slate-700 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
                title="Buka pengaturan kustom lebar struk"
                id="open-custom-paper-width-btn"
              >
                <Sliders className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Quick Font Selector Dropdown */}
          {onUpdateReceipt && (
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-300">
              <Type className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={receipt.fontFamily || 'DEFAULT'}
                onChange={(e) => onUpdateReceipt({ fontFamily: e.target.value as ReceiptFontFamily })}
                className="bg-transparent text-white font-medium text-[11px] outline-none cursor-pointer pr-1"
                title="Pilih jenis font struk"
                id="quick-font-selector"
              >
                <optgroup label="⚡ EAS & Retro Alert">
                  <option value="EAS" className="bg-slate-900 text-white">EAS Font Pack (Share Tech)</option>
                  <option value="RETRO_TERMINAL" className="bg-slate-900 text-white">Retro Terminal / EAS 8-Bit (VT323)</option>
                </optgroup>
                <optgroup label="🖨️ POS & Minimarket">
                  <option value="DEFAULT" className="bg-slate-900 text-white">Default (JetBrains Mono)</option>
                  <option value="DOT_MATRIX" className="bg-slate-900 text-white">Dot Matrix 9-Pin (DotGothic16)</option>
                  <option value="SPACE_MONO" className="bg-slate-900 text-white">Space Mono (Mechanical POS)</option>
                  <option value="COURIER" className="bg-slate-900 text-white">Courier Prime (Mesin Tik Kasir)</option>
                  <option value="INCONSOLATA" className="bg-slate-900 text-white">Inconsolata (Compact POS)</option>
                  <option value="ROBOTO_MONO" className="bg-slate-900 text-white">Roboto Mono</option>
                </optgroup>
                <optgroup label="☕ Modern Clean">
                  <option value="MODERN_SANS" className="bg-slate-900 text-white">Modern Clean Sans (Jakarta)</option>
                </optgroup>
              </select>
            </div>
          )}

          <div className="flex gap-1.5 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
              title={`Cetak ke Printer Thermal (${activePaperWidthMm}mm) / PDF`}
              id="print-action"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak ({activePaperWidthMm}mm)
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={exporting !== null}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
              id="export-pdf-action"
              title={`Unduh PDF ukuran pas (${activePaperWidthMm}mm)`}
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>

            <button
              type="button"
              onClick={handleExportJPG}
              disabled={exporting !== null}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
              id="export-jpg-action"
              title="Unduh struk format JPG"
            >
              <ImageIcon className="w-3.5 h-3.5" /> JPG
            </button>

            <button
              type="button"
              onClick={handleExportPNG}
              disabled={exporting !== null}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
              id="export-png-action"
              title="Unduh struk format PNG latar transparan/putih"
            >
              <ImageIcon className="w-3.5 h-3.5" /> PNG
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Frame */}
      <div className="flex-1 overflow-y-auto bg-slate-100 border border-slate-200/60 rounded-2xl p-4 sm:p-6 flex justify-center items-start min-h-[400px] relative">
        {exporting && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-center items-center z-50 rounded-2xl text-white font-semibold text-xs gap-2">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            Menyiapkan Ekspor {exporting}...
          </div>
        )}

        {/* Custom Paper Width Modal / Floating Popover */}
        {showCustomSizeModal && onUpdateReceipt && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-scaleIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Atur Ukuran Kertas Struk</h3>
                    <p className="text-xs text-slate-500">Sesuaikan lebar tepat untuk printer thermal kasir Anda</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomSizeModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-sm font-bold transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Preset Quick Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Preset Standar Industri:</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAPER_SIZE_OPTIONS.filter(o => o.id !== 'CUSTOM').map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onUpdateReceipt({
                          paperSizePreset: preset.id,
                          paperWidthMm: preset.widthMm,
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        receipt.paperSizePreset === preset.id
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/10'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                        {receipt.paperSizePreset === preset.id && (
                          <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 leading-tight line-clamp-2">{preset.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Millimeter Adjuster */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-900" htmlFor="custom-paper-width-input">
                    Lebar Kertas Kustom:
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {activePaperWidthMm} mm (~{Math.round(activePaperWidthMm * 4.375)}px)
                  </span>
                </div>

                {/* Slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    id="custom-paper-width-slider"
                    min="40"
                    max="150"
                    step="1"
                    value={activePaperWidthMm}
                    onChange={(e) => {
                      const newWidth = parseInt(e.target.value, 10);
                      onUpdateReceipt({
                        paperSizePreset: 'CUSTOM',
                        paperWidthMm: newWidth,
                      });
                    }}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>40 mm (Super Mini)</span>
                    <span>58 mm</span>
                    <span>80 mm</span>
                    <span>100 mm</span>
                    <span>150 mm (Lebar)</span>
                  </div>
                </div>

                {/* Stepper buttons & number input */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(40, activePaperWidthMm - 5);
                      onUpdateReceipt({
                        paperSizePreset: 'CUSTOM',
                        paperWidthMm: next,
                      });
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 transition"
                  >
                    <Minus className="w-3.5 h-3.5" /> -5mm
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      id="custom-paper-width-input"
                      min="40"
                      max="210"
                      value={activePaperWidthMm}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 30 && val <= 250) {
                          onUpdateReceipt({
                            paperSizePreset: 'CUSTOM',
                            paperWidthMm: val,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-center font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">mm</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(210, activePaperWidthMm + 5);
                      onUpdateReceipt({
                        paperSizePreset: 'CUSTOM',
                        paperWidthMm: next,
                      });
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> +5mm
                  </button>
                </div>
              </div>

              {/* Thermal Print Guidance */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold flex items-center gap-1 mb-0.5">
                  <Printer className="w-3.5 h-3.5 text-amber-700" /> Tips Cetak Thermal:
                </span>
                Saat dialog cetak browser muncul, pilih <strong>Margins: None</strong> dan centang <strong>Background Graphics</strong> untuk hasil cetak thermal yang presisi tanpa margin terpotong.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomSizeModal(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Terapkan Ukuran Kertas ({activePaperWidthMm} mm)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Thermal Print Area */}
        <div 
          ref={receiptRef}
          id="receipt-print-area"
          className={`receipt-paper w-full text-[11px] leading-relaxed text-black shadow-lg flex flex-col animate-fadeIn relative overflow-hidden transition-all duration-150 ${
            isNarrowPaper ? 'px-3.5 py-6 text-[10.5px]' : 'px-6 py-8'
          }`}
          style={{ 
            fontFamily: getFontFamilyCss(receipt.fontFamily),
            maxWidth: `${previewMaxWidthPx}px`
          }}
        >
          {/* Watermark / Status Stamp Overlay (Natural -18° angle with robust SVG rendering for PNG/JPG/PDF exports) */}
          {['BELUM_LUNAS', 'SUDAH_LUNAS', 'HUTANG'].includes(receipt.paymentStatus) && (
            <div 
              className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden select-none z-0"
              style={{ opacity: 0.18 }}
              id="receipt-status-watermark"
            >
              <svg 
                viewBox="0 0 320 200" 
                className="w-72 h-44 overflow-visible"
                style={{
                  color: receipt.paymentStatus === 'SUDAH_LUNAS' 
                    ? '#15803d' 
                    : receipt.paymentStatus === 'BELUM_LUNAS' 
                      ? '#b91c1c' 
                      : '#d97706'
                }}
              >
                <g transform="rotate(-18 160 100)">
                  {/* Outer Stamp Box with Rounded Corners and Bold Border */}
                  <rect 
                    x="20" 
                    y="62" 
                    width="280" 
                    height="76" 
                    rx="10" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="5" 
                  />
                  {/* Inner dashed accent border for authentic rubber stamp effect */}
                  <rect 
                    x="27" 
                    y="69" 
                    width="266" 
                    height="62" 
                    rx="7" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 2"
                    opacity="0.6"
                  />
                  {/* Stamp Text */}
                  <text 
                    x="160" 
                    y="101" 
                    fill="currentColor" 
                    fontSize={receipt.paymentStatus === 'BELUM_LUNAS' ? '26' : '34'} 
                    fontWeight="900" 
                    fontFamily={getFontFamilyCss(receipt.fontFamily)}
                    textAnchor="middle" 
                    dominantBaseline="central" 
                    letterSpacing="3.5"
                  >
                    {receipt.paymentStatus === 'SUDAH_LUNAS' ? 'LUNAS' : receipt.paymentStatus === 'BELUM_LUNAS' ? 'BELUM LUNAS' : 'HUTANG'}
                  </text>
                </g>
              </svg>
            </div>
          )}

          {/* Feed Header Space */}
          <div className="border-t-2 border-dashed border-slate-300 w-full mb-4 self-center" />

          {/* Slogan / Slogan Header */}
          {receipt.notesHeader && (
            <div className="text-center text-slate-600 mb-2 font-medium break-words uppercase">
              {receipt.notesHeader}
            </div>
          )}

          {/* Render Logo based on Selected Type */}
          {receipt.logoType === 'INDOMARET' && (
            <div className="flex justify-center mb-3 select-none">
              <svg width="150" height="34" viewBox="0 0 150 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-8">
                {/* Blue box for 'i' */}
                <rect x="2" y="4" width="22" height="22" rx="4" fill="#0154a0" />
                <text x="13" y="20" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#ffffff" textAnchor="middle" dominantBaseline="central">i</text>
                
                {/* Yellow box for 'n' */}
                <rect x="27" y="4" width="22" height="22" rx="4" fill="#fff100" />
                <text x="38" y="19" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#e31e24" textAnchor="middle" dominantBaseline="central">n</text>
                
                {/* Red box for 'd' */}
                <rect x="52" y="4" width="22" height="22" rx="4" fill="#e31e24" />
                <text x="63" y="19" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#ffffff" textAnchor="middle" dominantBaseline="central">d</text>
                
                {/* 'omaret' text */}
                <text x="78" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="19" fill="#0154a0" letterSpacing="-0.5">omaret</text>
                
                {/* Blue and Yellow bottom line for retail style */}
                <rect x="2" y="28" width="144" height="2" fill="#0154a0" />
                <rect x="75" y="28" width="71" height="2" fill="#fff100" />
              </svg>
            </div>
          )}

          {receipt.logoType === 'ALFAMART' && (
            <div className="flex justify-center mb-3 select-none">
              <svg width="150" height="34" viewBox="0 0 150 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-8">
                <rect x="2" y="2" width="146" height="30" rx="5" fill="#e11a22" />
                <text x="12" y="21" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontStyle="italic" fontSize="18" fill="#ffffff" letterSpacing="-0.5">
                  Alfa<tspan fill="#fff200">mart</tspan>
                </text>
                {/* Yellow accent strip */}
                <rect x="2" y="27" width="146" height="3" fill="#fff200" rx="1" />
                {/* Slogan */}
                <text x="140" y="21" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="5" fill="#ffffff" textAnchor="end" letterSpacing="0.2">
                  BELANJA PUAS, HARGA PAS
                </text>
              </svg>
            </div>
          )}

          {receipt.logoType === 'OSAVE' && (
            <div className="flex justify-center mb-3 select-none">
              <svg width="150" height="34" viewBox="0 0 150 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-8">
                {/* Green background */}
                <rect x="2" y="3" width="146" height="28" rx="14" fill="#007a33" />
                {/* Yellow circle */}
                <circle cx="20" cy="17" r="9" fill="#ffcc00" />
                {/* Lowercase o! in green */}
                <text x="20" y="21.5" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="13" fill="#007a33" textAnchor="middle">o!</text>
                {/* SAVE in bold white */}
                <text x="36" y="23" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="16" fill="#ffffff" letterSpacing="0.5">SAVE</text>
                {/* Dot or small accent */}
                <circle cx="85" cy="17" r="1.5" fill="#ffcc00" />
              </svg>
            </div>
          )}

          {receipt.logoType === 'CUSTOM' && receipt.logoUrl && (
            <div className="flex justify-center mb-3">
              <img 
                src={receipt.logoUrl} 
                alt="Logo Toko" 
                className="max-h-12 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Store Name */}
          <div className="text-center text-base font-extrabold tracking-wide uppercase break-words mb-1 text-slate-900">
            {receipt.storeName || 'TOKO SAYA'}
          </div>

          {/* Store Address & Contact */}
          <div className="text-center text-slate-600 space-y-0.5 text-[10px] break-words px-2">
            {receipt.storeAddress && <div>{receipt.storeAddress}</div>}
            {receipt.storePhone && <div>Telp: {receipt.storePhone}</div>}
            {receipt.storeWebsite && <div className="lowercase">{receipt.storeWebsite}</div>}
          </div>

          {/* Header Custom Labels */}
          {headerCustomLabels.length > 0 && (
            <div className="text-slate-700 text-[10px] space-y-1 pt-1.5 border-t border-dotted border-slate-300 mt-2 px-1">
              {headerCustomLabels.map(renderCustomLabelItem)}
            </div>
          )}

          {/* Top Divider */}
          <div className="border-t border-dashed border-slate-400 my-4" />

          {/* Receipt Meta Details */}
          <div className="space-y-1 text-slate-700 text-[10px]">
            <div className="flex justify-between">
              <span>{labels.transactionIdLabel}</span>
              <div className="flex items-center gap-1 relative">
                <span className="font-bold">{receipt.transactionId}</span>
                <button 
                  onClick={handleCopyTxId} 
                  className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 pointer-events-auto relative"
                  title="Copy ID Transaksi"
                  id="copy-tx-btn"
                >
                  {copiedTx ? (
                    <Check className="w-3 h-3 text-slate-900 animate-scaleIn" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  
                  {/* Floating Tooltip */}
                  {copiedTx && (
                    <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap animate-bounce pointer-events-none z-10">
                      Disalin!
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span>{labels.dateTimeLabel}</span>
              <span>{formatDateTime(receipt.dateTime)}</span>
            </div>
            <div className="flex justify-between">
              <span>{labels.cashierLabel}</span>
              <span>{receipt.cashierName || 'Kasir Default'}</span>
            </div>
            {receipt.customerName && (
              <div className="flex justify-between">
                <span>{labels.customerLabel}</span>
                <span className="font-semibold">{receipt.customerName}</span>
              </div>
            )}
            {/* Meta Custom Labels */}
            {metaCustomLabels.map(renderCustomLabelItem)}
          </div>

          {/* Middle Divider */}
          <div className="border-t border-dashed border-slate-400 my-4" />

          {/* Items List */}
          <div className="space-y-3">
            {receipt.items.length === 0 ? (
              <div className="text-center italic text-slate-400 my-6">
                (Struk Kosong)
              </div>
            ) : (
              receipt.items.map((item, idx) => (
                <div key={item.id || idx} className="space-y-0.5">
                  <div className="font-bold text-slate-900 uppercase break-words leading-tight">
                    {item.name}
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="pl-3">
                      {item.quantity}  x  {formatCurrency(item.price, currencySymbol)}
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(item.price * item.quantity, currencySymbol)}
                    </span>
                  </div>
                  {item.discountRate && item.discountRate > 0 && (
                    <div className="flex justify-between text-slate-600 text-[11px] pl-3">
                      <span>  * DISKON ({item.discountRate}%)</span>
                      <span>-{formatCurrency(Math.round((item.price * item.quantity) * (item.discountRate / 100)), currencySymbol)}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Items Summary Custom Labels */}
          {itemsSummaryCustomLabels.length > 0 && (
            <div className="space-y-1 my-2 bg-slate-50/70 p-2 rounded border border-dotted border-slate-300 text-[10px]">
              {itemsSummaryCustomLabels.map(renderCustomLabelItem)}
            </div>
          )}

          {/* Bottom Middle Divider */}
          <div className="border-t border-dashed border-slate-400 my-4" />

          {/* Calculations Table */}
          <div className="space-y-1.5 text-slate-800">
            <div className="flex justify-between">
              <span>{labels.subtotalLabel}</span>
              <span>{formatCurrency(receipt.subtotal, currencySymbol)}</span>
            </div>

            {/* Discount */}
            {receipt.discountAmount > 0 && (
              <>
                {/* Check if there are individual item discounts */}
                {receipt.items.some(i => i.discountRate && i.discountRate > 0) ? (
                  <div className="space-y-1 my-1 bg-slate-50 p-2 rounded-lg border border-dotted border-slate-200">
                    <div className="flex justify-between text-slate-700 text-xs">
                      <span>{labels.itemDiscountLabel}</span>
                      <span>-{formatCurrency(receipt.items.reduce((sum, item) => sum + Math.round((item.price * item.quantity) * ((item.discountRate || 0) / 100)), 0), currencySymbol)}</span>
                    </div>
                    {(() => {
                      const itemDiscTotal = receipt.items.reduce((sum, item) => sum + Math.round((item.price * item.quantity) * ((item.discountRate || 0) / 100)), 0);
                      const txDiscount = receipt.discountAmount - itemDiscTotal;
                      if (txDiscount > 0) {
                        return (
                          <div className="flex justify-between text-slate-700 text-xs">
                            <span>{labels.discountLabel} UTAMA {receipt.discountType === 'PERCENT' ? `(${receipt.discountRate}%)` : ''}:</span>
                            <span>-{formatCurrency(txDiscount, currencySymbol)}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <div className="flex justify-between text-slate-900 font-bold border-t border-dotted border-slate-350 pt-1">
                      <span>TOTAL POTONGAN:</span>
                      <span>-{formatCurrency(receipt.discountAmount, currencySymbol)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between text-slate-800 font-bold">
                    <span>
                      {labels.discountLabel} {receipt.discountType === 'PERCENT' ? `(${receipt.discountRate}%)` : ''}:
                    </span>
                    <span>-{formatCurrency(receipt.discountAmount, currencySymbol)}</span>
                  </div>
                )}
              </>
            )}

            {/* Tax */}
            {receipt.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>{labels.taxLabel} ({receipt.taxRate}%):</span>
                <span>{formatCurrency(receipt.taxAmount, currencySymbol)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold border-t border-slate-200 pt-1.5 text-slate-950">
              <span>{labels.totalLabel}</span>
              <span>{formatCurrency(receipt.total, currencySymbol)}</span>
            </div>
          </div>

          {/* Bottom Divider */}
          <div className="border-t border-dashed border-slate-400 my-4" />

          {/* Payment Method / Cash details */}
          <div className="space-y-1.5 text-slate-800">
            <div className="flex justify-between font-bold">
              <span>{labels.paymentMethodLabel}</span>
              <span className="uppercase">{receipt.paymentMethod}</span>
            </div>

            <div className="flex justify-between font-bold">
              <span>{labels.paymentStatusLabel}</span>
              <span className={`uppercase font-extrabold ${
                receipt.paymentStatus === 'SUDAH_LUNAS' 
                  ? 'text-green-800' 
                  : 'text-rose-700'
              }`}>
                {receipt.paymentStatus === 'SUDAH_LUNAS' ? 'SUDAH LUNAS' :
                 receipt.paymentStatus === 'BELUM_LUNAS' ? 'BELUM LUNAS' :
                 'HUTANG'}
              </span>
            </div>

            {receipt.paymentMethod === 'CASH' && (
              <>
                <div className="flex justify-between">
                  <span>{labels.cashReceivedLabel}</span>
                  <span>{formatCurrency(receipt.cashReceived, currencySymbol)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-950 border-t border-slate-200 pt-1">
                  <span>{labels.changeAmountLabel}</span>
                  <span>{formatCurrency(receipt.changeAmount, currencySymbol)}</span>
                </div>
              </>
            )}

            {/* Payment Custom Labels */}
            {paymentCustomLabels.map(renderCustomLabelItem)}
          </div>

          {/* Barcode & QR Code Section */}
          {renderBarcodeAndQr()}

          {/* Footer Custom Labels */}
          {footerCustomLabels.length > 0 && (
            <div className="space-y-1 my-2.5 pt-2 border-t border-dotted border-slate-300 text-slate-700 text-[10px]">
              {footerCustomLabels.map(renderCustomLabelItem)}
            </div>
          )}

          {/* Slogan / Thank you Footer */}
          {receipt.notesFooter && (
            <div className="text-center text-slate-600 mt-4 pt-2 border-t border-dashed border-slate-300 text-[9px] whitespace-pre-line leading-relaxed break-words uppercase">
              {receipt.notesFooter}
            </div>
          )}

          {/* Feed Footer Cut */}
          <div className="mb-4" />
        </div>
      </div>

      {/* Tiny helper banner */}
      <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex gap-2 items-start text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-900 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold text-slate-800">Tips POS:</span> Ubah nama barang, harga, dan jumlah secara instan langsung dari tabel <strong>Daftar Barang</strong>. Preset toko membantu Anda menguji layout minimarket dalam hitungan detik.
        </div>
      </div>
    </div>
  );
}

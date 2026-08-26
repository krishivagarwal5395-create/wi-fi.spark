
import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Wifi, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { WiFiSettings, CardTheme } from '../types';
import { toPng } from 'html-to-image';

interface QRCodeDisplayProps {
  settings: WiFiSettings;
  qrValue: string;
  theme: CardTheme;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ settings, qrValue, theme }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hidePasswordOnCard, setHidePasswordOnCard] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const downloadFullCard = async () => {
    if (!cardRef.current) return;
    
    try {
      setIsExporting(true);
      
      // html-to-image can fail when it tries to read rules from cross-origin stylesheets.
      // crossorigin="anonymous" in index.html and this filter function help mitigate security blocks.
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3, // High-fidelity output
        backgroundColor: 'transparent',
        filter: (node: HTMLElement) => {
          const tagName = node.tagName ? node.tagName.toLowerCase() : '';
          return tagName !== 'script' && tagName !== 'noscript';
        },
      });

      const link = document.createElement('a');
      link.download = `wifi-card-${settings.ssid || 'network'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert('Generation failed due to browser security restrictions on external fonts. Please use the "Print Card" feature instead for a high-quality physical copy.');
    } finally {
      setIsExporting(false);
    }
  };

  const hasContent = settings.ssid.trim().length > 0;

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      {/* Printable Card Container */}
      <div 
        ref={cardRef}
        className={`w-full aspect-[2/3] rounded-[3rem] p-8 shadow-2xl transition-all duration-500 relative overflow-hidden flex flex-col items-center ${theme.bgClass} ${theme.textClass}`}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center w-full h-full">
          {/* Header Icon */}
          <div className="mt-4 mb-10">
            <div className={`p-4 rounded-full ${theme.accentClass} inline-flex items-center justify-center`}>
              <Wifi className="w-10 h-10" />
            </div>
          </div>

          {/* Titles */}
          <div className="space-y-1 mb-10">
            <h3 className="text-4xl font-bold tracking-tight">Guest Wi-Fi</h3>
            <p className="text-sm opacity-90 uppercase tracking-[0.2em] font-semibold">Scan to Connect</p>
          </div>

          {/* QR Container */}
          <div className="bg-white p-5 rounded-[2rem] shadow-2xl mb-auto flex items-center justify-center">
            {hasContent ? (
              <QRCodeSVG
                id="wifi-qr-svg"
                value={qrValue}
                size={220}
                level="H"
                includeMargin={false}
              />
            ) : (
              <div className="w-[220px] h-[220px] bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-400 space-y-2">
                <Wifi className="w-10 h-10 opacity-20" />
                <span className="text-xs font-medium">Enter Wi-Fi details</span>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="w-full space-y-6 pt-4 mt-8">
            <div className="flex flex-col items-center space-y-1">
              <span className="text-xs opacity-70 font-bold uppercase tracking-widest">Network</span>
              <p className="text-2xl font-bold truncate max-w-full leading-tight">
                {settings.ssid || '---'}
              </p>
            </div>
            
            {settings.encryption !== 'nopass' && (
              <div className="flex flex-col items-center space-y-1 group">
                <div className="flex items-center space-x-1">
                  <span className="text-xs opacity-70 font-bold uppercase tracking-widest">Password</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setHidePasswordOnCard(!hidePasswordOnCard);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity no-print p-1 hover:bg-white/10 rounded"
                  >
                    {hidePasswordOnCard ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                </div>
                <p className={`text-sm font-mono bg-black/10 px-4 py-1.5 rounded-xl min-w-[140px] text-center transition-all ${hidePasswordOnCard ? 'blur-md select-none' : ''}`}>
                  {settings.password || '••••••••'}
                </p>
              </div>
            )}
          </div>

          {/* Privacy Marker */}
          <div className="mt-auto pt-6 flex items-center justify-center space-x-2 opacity-50">
             <ShieldCheck className="w-4 h-4" />
             <span className="text-[10px] font-bold uppercase tracking-widest">{settings.encryption} Secure</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 w-full no-print">
        <button
          onClick={downloadFullCard}
          disabled={!hasContent || isExporting}
          className="w-full inline-flex justify-center items-center px-6 py-4 border-2 border-indigo-600 shadow-lg text-base font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all disabled:opacity-50 disabled:bg-gray-400 disabled:border-gray-400 active:scale-95"
        >
          {isExporting ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Download className="w-5 h-5 mr-2" />
          )}
          {isExporting ? 'Capturing Card...' : 'Save Full Card Image'}
        </button>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
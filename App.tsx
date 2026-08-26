
import React, { useState, useMemo } from 'react';
import { Wifi, Printer, Settings, Share2, Info, Camera, Search } from 'lucide-react';
import { WiFiSettings, CardTheme } from './types';
import { CARD_THEMES } from './constants';
import WiFiForm from './components/WiFiForm';
import QRCodeDisplay from './components/QRCodeDisplay';
import RouterScanner from './components/RouterScanner';
import NearbyScanner from './components/NearbyScanner';
import { generateWiFiQRString } from './utils/helpers';

const App: React.FC = () => {
  const [settings, setSettings] = useState<WiFiSettings>({
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false
  });

  const [activeTheme, setActiveTheme] = useState<CardTheme>(CARD_THEMES[2]); // Default to Sunset theme
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showNearby, setShowNearby] = useState(false);

  const qrString = useMemo(() => generateWiFiQRString(settings), [settings]);

  const handlePrint = () => {
    window.print();
  };

  const handleScanSuccess = (newSettings: Partial<WiFiSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Wi-Fi Spark
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Card
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 lg:p-8 gap-8">
        {/* Input Form Column */}
        <div className="w-full lg:w-1/2 space-y-8 no-print">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Settings className="w-5 h-5 text-indigo-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Network Details</h2>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowNearby(!showNearby)}
                  className={`text-xs font-bold uppercase tracking-wider flex items-center transition-colors ${showNearby ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}
                >
                  <Search className="w-3 h-3 mr-1" />
                  Nearby
                </button>
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-indigo-600 flex items-center transition-colors"
                >
                  <Camera className="w-3 h-3 mr-1" />
                  Scanner
                </button>
              </div>
            </div>

            {showNearby && (
              <div className="mb-6 animate-in slide-in-from-top duration-300">
                <NearbyScanner 
                  currentSSID={settings.ssid}
                  onSelect={(ssid) => {
                    setSettings(s => ({ ...s, ssid }));
                    setShowNearby(false);
                  }} 
                />
              </div>
            )}

            <WiFiForm settings={settings} onSettingsChange={setSettings} />
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
            <div className="flex items-center mb-6">
              <Share2 className="w-5 h-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Card Appearance</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CARD_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(theme)}
                  className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    activeTheme.id === theme.id 
                    ? 'border-indigo-600 bg-indigo-50/50' 
                    : 'border-transparent hover:bg-gray-50 bg-gray-50'
                  }`}
                >
                  <div className={`w-full h-8 rounded-md ${theme.bgClass}`} />
                  <span className="text-xs font-medium text-gray-600">{theme.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-indigo-50 rounded-2xl p-6 flex gap-4 items-start">
            <Info className="w-5 h-5 text-indigo-600 mt-1 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm text-indigo-800 leading-relaxed">
                <strong>Connect without typing?</strong> Use the scanner to read the label from your router, or select a nearby network found by our AI.
              </p>
            </div>
          </section>
        </div>

        {/* Preview Column */}
        <div className="w-full lg:w-1/2 flex justify-center items-start pt-4 lg:pt-0 card-preview-container">
          <div className="sticky top-24 w-full flex justify-center">
            <QRCodeDisplay 
              settings={settings} 
              qrValue={qrString} 
              theme={activeTheme} 
            />
          </div>
        </div>
      </main>

      {isScannerOpen && (
        <RouterScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      <footer className="bg-white border-t border-gray-200 py-6 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Wi-Fi Spark. Safe and secure Wi-Fi sharing.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
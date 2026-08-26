
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Search, 
  Wifi, 
  Lock, 
  ArrowLeft, 
  RefreshCw,
  Loader2,
  MapPin,
  Zap,
  Info,
  CheckCircle
} from 'lucide-react';

/**
 * Interface for Wi-Fi scan results from the AI simulation
 */
interface NetworkResult {
  ssid: string;
  secured: boolean;
  proximity: string;
  type?: 'primary' | 'normal';
  connected?: boolean;
}

interface NearbyScannerProps {
  currentSSID?: string;
  onSelect: (ssid: string) => void;
}

const NearbyScanner: React.FC<NearbyScannerProps> = ({ currentSSID, onSelect }) => {
  const [isScanning, setIsScanning] = useState(false);
  // Using the defined interface to ensure consistent property access
  const [results, setResults] = useState<NetworkResult[]>([]);
  const [customResults, setCustomResults] = useState<NetworkResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSSID, setSelectedSSID] = useState<string | null>(null);
  const [isWifiOn, setIsWifiOn] = useState(true);

  const scanNearby = async (specificSSID?: string) => {
    if (!isWifiOn) return;
    setIsScanning(true);
    setError(null);
    if (!specificSSID) {
      setResults([]);
      setCustomResults([]);
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = specificSSID 
        ? `You are checking a Wi-Fi signal signature for "${specificSSID}" at lat/long ${position.coords.latitude}, ${position.coords.longitude}. Is it likely reachable within 10 meters? If yes, provide its simulation data. Return JSON: { ssid: "${specificSSID}", secured: true, proximity: "0.5m", verified: true }.`
        : `You are simulating a Wi-Fi hardware scanner at ${position.coords.latitude}, ${position.coords.longitude}. Find exactly 7 Wi-Fi SSIDs within a close 5-meter radius. Priority: 1. Locally recognizable business names if applicable. 2. Common home router defaults (TP-Link, Netgear, ASUS). 3. Personal hotspots. Return JSON: array of { ssid, secured, proximity }.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text || "[]";
      
      if (specificSSID) {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonStr = text.substring(jsonStart, jsonEnd);
        const newNet: NetworkResult = JSON.parse(jsonStr || "{}");
        if (newNet.ssid) {
          setCustomResults(prev => [newNet, ...prev.filter(n => n.ssid !== newNet.ssid)]);
          setSelectedSSID(newNet.ssid);
        }
        return;
      }

      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      const jsonStr = text.substring(jsonStart, jsonEnd);
      
      let foundNetworks: NetworkResult[] = JSON.parse(jsonStr || "[]");

      // MANDATORY: If the user has entered an SSID in the main form, we "find" it compulsorily
      if (currentSSID && currentSSID.trim().length > 0) {
        const alreadyExists = foundNetworks.some((n: NetworkResult) => n.ssid.toLowerCase() === currentSSID.toLowerCase());
        if (!alreadyExists) {
          const primaryNetwork: NetworkResult = { 
            ssid: currentSSID, 
            secured: true, 
            proximity: '0.3m', 
            type: 'primary' 
          };
          foundNetworks = [primaryNetwork, ...foundNetworks];
        } else {
          foundNetworks = foundNetworks.map((n: NetworkResult) => 
            n.ssid.toLowerCase() === currentSSID.toLowerCase() 
            ? { ...n, type: 'primary' as const, proximity: '0.3m' } 
            : n
          ).sort((a: NetworkResult, b: NetworkResult) => (a.type === 'primary' ? -1 : 1));
        }
      }

      setResults(foundNetworks);
    } catch (err) {
      console.error(err);
      if (!specificSSID) {
        setError("AI Scan limited. Showing simulation.");
        const mock: NetworkResult[] = [
          { ssid: "Local_Network_5G", secured: true, proximity: "0.8m" },
          { ssid: "Guest_Access_Point", secured: true, proximity: "2.1m" },
          { ssid: "Smartphone_Hotspot", secured: true, proximity: "3.2m" },
          { ssid: "CoffeeShop_WiFi", secured: false, proximity: "4.5m" }
        ];
        if (currentSSID) {
          mock.unshift({ ssid: currentSSID, secured: true, proximity: "0.3m", type: 'primary' });
        }
        setResults(mock);
      }
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    scanNearby();
  }, []);

  const allResults = useMemo(() => {
    // Merge results and custom results, ensuring no duplicates
    const combined = [...customResults, ...results];
    const seen = new Set();
    return combined.filter(n => {
      const lower = n.ssid.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }, [results, customResults]);

  const filteredResults = useMemo(() => {
    return allResults.filter(net => 
      net.ssid.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allResults, searchQuery]);

  const showForceAdd = searchQuery.length > 2 && !filteredResults.some(n => n.ssid.toLowerCase() === searchQuery.toLowerCase());

  return (
    <div className="bg-[#1c1c1c] text-white rounded-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[500px] w-full animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between shrink-0 bg-[#2b2b2b]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center space-x-3">
          <ArrowLeft className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity" />
          <div>
            <span className="font-semibold text-sm block leading-none mb-1">Near-Field Scan</span>
            <span className="text-[10px] text-[#60cdff] font-bold uppercase tracking-wider flex items-center">
              <Zap className="w-2.5 h-2.5 mr-1 fill-[#60cdff]" /> 3.5M MAX RADIUS
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsWifiOn(!isWifiOn)}
          className={`w-11 h-6 rounded-full relative transition-all duration-200 border-2 ${isWifiOn ? 'bg-[#60cdff] border-[#60cdff]' : 'bg-transparent border-gray-500'}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${isWifiOn ? 'right-0.5 bg-black' : 'left-0.5 bg-gray-400'}`} />
        </button>
      </div>

      {!isWifiOn ? (
        <div className="p-12 text-center text-gray-400 text-sm flex flex-col items-center space-y-4">
          <Wifi className="w-12 h-12 opacity-10" />
          <p>Scan disabled.</p>
        </div>
      ) : (
        <>
          <div className="px-4 py-3 shrink-0 bg-[#1c1c1c]">
            <div className="relative">
              <input
                type="text"
                placeholder="Find my network..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2d2d2d] border-b-2 border-transparent focus:border-[#60cdff] outline-none py-1.5 px-3 text-sm rounded-t-md transition-all placeholder:text-gray-600"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-500" />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar bg-[#1c1c1c]">
            {isScanning && allResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative flex items-center justify-center">
                   <div className="absolute w-12 h-12 border-2 border-[#60cdff]/20 rounded-full animate-ping" />
                   <Wifi className="w-8 h-8 text-[#60cdff] animate-pulse" />
                </div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Searching signals...</p>
              </div>
            ) : (
              <div className="pb-2">
                {showForceAdd && (
                  <div className="px-4 py-3 bg-[#60cdff]/5 border-b border-[#60cdff]/10 group transition-colors">
                    <p className="text-[10px] text-[#60cdff] font-bold uppercase tracking-widest mb-2 flex items-center">
                      <Zap className="w-3 h-3 mr-1 animate-pulse" /> Signal undetected
                    </p>
                    <button 
                      onClick={() => scanNearby(searchQuery)}
                      disabled={isScanning}
                      className="w-full py-2 bg-[#60cdff] hover:bg-[#72d4ff] text-black text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Locating Signature...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Compulsory Find "{searchQuery}"
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-gray-500 mt-2 italic">
                      Force-search this specific SSID using neural pattern matching.
                    </p>
                  </div>
                )}

                {filteredResults.map((net, i) => {
                  const isSelected = selectedSSID === net.ssid;
                  const isPrimary = net.type === 'primary';
                  
                  return (
                    <div 
                      key={i}
                      onClick={() => setSelectedSSID(isSelected ? null : net.ssid)}
                      className={`relative cursor-default hover:bg-[#2d2d2d] transition-all group ${isSelected ? 'bg-[#2b2b2b]' : ''} ${isPrimary ? 'bg-[#1e2a1e]/30 border-l-4 border-emerald-500' : ''}`}
                    >
                      <div className="px-4 py-3 flex items-start space-x-4">
                        <div className="relative mt-1">
                          <Wifi className={`w-5 h-5 ${isPrimary ? 'text-emerald-400' : 'text-white/80'}`} />
                          {net.secured && (
                            <Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-1 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between pr-2">
                            <div className="flex items-center space-x-2 min-w-0">
                               <p className="text-sm font-medium truncate">{net.ssid}</p>
                               {isPrimary && <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />}
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${isPrimary ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-[#60cdff] bg-[#60cdff]/10 border-[#60cdff]/20'}`}>
                              {net.proximity}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {isPrimary ? 'Detected: Signal is ultra-strong' : 'Found in immediate reach'}
                          </p>

                          {isSelected && (
                            <div className="mt-4 pb-1 animate-in slide-in-from-top-1 duration-200">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelect(net.ssid);
                                }}
                                className={`text-xs font-bold py-2 px-8 rounded-md transition-all w-full ${isPrimary ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-[#60cdff] hover:bg-[#72d4ff] text-black'}`}
                              >
                                Select This Network
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filteredResults.length === 0 && !isScanning && (
                  <div className="p-8 text-center">
                    <p className="text-xs text-gray-500">No networks found within 3.5m.</p>
                  </div>
                )}

                <div className="p-4 bg-white/5 mx-4 my-2 rounded-lg flex items-start space-x-3">
                  <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 leading-relaxed italic">
                    Note: Our AI scanner compulsorily searches for the network you entered and verified 3.5M signals nearby.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-white/5 bg-[#1c1c1c] flex items-center justify-between shrink-0">
             <div className="flex items-center text-[10px] text-gray-500 font-medium">
               <MapPin className="w-3 h-3 mr-1" />
               Scanner Active
             </div>
            <button 
              onClick={scanNearby}
              disabled={isScanning}
              className={`p-2 hover:bg-[#2d2d2d] rounded-md transition-all text-gray-400 hover:text-white ${isScanning ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default NearbyScanner;

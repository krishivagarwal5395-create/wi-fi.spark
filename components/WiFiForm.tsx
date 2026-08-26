
import React, { useState } from 'react';
import { Eye, EyeOff, Shield, Wifi, Lock, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WiFiSettings } from '../types';

interface WiFiFormProps {
  settings: WiFiSettings;
  onSettingsChange: (settings: WiFiSettings) => void;
}

const WiFiForm: React.FC<WiFiFormProps> = ({ settings, onSettingsChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [connectStatus, setConnectStatus] = useState<'idle' | 'connecting' | 'unsupported' | 'success'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    onSettingsChange({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleConnect = async () => {
    setConnectStatus('connecting');
    
    // Simulate connection attempt delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Web Wi-Fi API check (Experimental/Non-standard)
    // Most browsers do not support direct Wi-Fi connection for security reasons.
    if ('wifi' in navigator) {
      try {
        // This is a hypothetical call as standard browsers don't expose this
        // @ts-ignore
        await navigator.wifi.connect({
          ssid: settings.ssid,
          password: settings.password,
          encryption: settings.encryption
        });
        setConnectStatus('success');
      } catch (err) {
        setConnectStatus('unsupported');
      }
    } else {
      setConnectStatus('unsupported');
    }

    // Reset status after a few seconds if it was a message
    if (connectStatus !== 'connecting') {
      setTimeout(() => setConnectStatus('idle'), 5000);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="ssid" className="block text-sm font-medium text-gray-700 mb-1">
          Network Name (SSID)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Wifi className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            id="ssid"
            name="ssid"
            value={settings.ssid}
            onChange={handleChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm placeholder-gray-400"
            placeholder="e.g. My Home WiFi"
          />
        </div>
      </div>

      <div>
        <label htmlFor="encryption" className="block text-sm font-medium text-gray-700 mb-1">
          Security Type
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Shield className="h-4 w-4 text-gray-400" />
          </div>
          <select
            id="encryption"
            name="encryption"
            value={settings.encryption}
            onChange={handleChange}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm appearance-none"
          >
            <option value="WPA">WPA/WPA2/WPA3 (Most Common)</option>
            <option value="WEP">WEP (Older)</option>
            <option value="nopass">None (Open)</option>
          </select>
        </div>
      </div>

      {settings.encryption !== 'nopass' && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={settings.password}
              onChange={handleChange}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm placeholder-gray-400"
              placeholder="Your WiFi password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center">
        <input
          type="checkbox"
          id="hidden"
          name="hidden"
          checked={settings.hidden}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="hidden" className="ml-2 block text-sm text-gray-700">
          This is a hidden network
        </label>
      </div>

      <div className="pt-2">
        <button
          onClick={handleConnect}
          disabled={!settings.ssid || connectStatus === 'connecting'}
          className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.98] ${
            connectStatus === 'connecting' 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : connectStatus === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {connectStatus === 'connecting' ? (
            <>
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Checking support...</span>
            </>
          ) : connectStatus === 'success' ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Connected!</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Connect Now</span>
            </>
          )}
        </button>

        {connectStatus === 'unsupported' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <p className="font-bold mb-1">Direct Connection Unsupported</p>
              Your browser limits direct Wi-Fi control for security. 
              <span className="font-semibold"> Use the QR code or the Download Profile button</span> to join this network instantly.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WiFiForm;

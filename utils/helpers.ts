
import { WiFiSettings } from '../types';

/**
 * Escapes special characters for WiFi QR code strings
 */
const escapeValue = (value: string): string => {
  return value.replace(/([\\;,:"])/g, '\\$1');
};

/**
 * Generates the standard WIFI QR code string
 */
export const generateWiFiQRString = (settings: WiFiSettings): string => {
  const ssid = escapeValue(settings.ssid);
  const password = settings.encryption === 'nopass' ? '' : escapeValue(settings.password);
  const hidden = settings.hidden ? 'true' : '';
  
  return `WIFI:S:${ssid};T:${settings.encryption};P:${password};H:${hidden};;`;
};

/**
 * Generates an Apple .mobileconfig file content
 * This allows "scan-less" connection on iOS/macOS
 */
export const generateMobileConfig = (settings: WiFiSettings): string => {
  const uuid1 = crypto.randomUUID();
  const uuid2 = crypto.randomUUID();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>PayloadContent</key>
	<array>
		<dict>
			<key>AutoJoin</key>
			<true/>
			<key>EncryptionType</key>
			<string>${settings.encryption === 'nopass' ? 'None' : 'Any'}</string>
			<key>HIDDEN_NETWORK</key>
			<${settings.hidden ? 'true' : 'false'}/>
			<key>Password</key>
			<string>${settings.password}</string>
			<key>PayloadDescription</key>
			<string>Configures Wi-Fi settings</string>
			<key>PayloadDisplayName</key>
			<string>Wi-Fi (${settings.ssid})</string>
			<key>PayloadIdentifier</key>
			<string>com.wifispark.config.${uuid1}</string>
			<key>PayloadType</key>
			<string>com.apple.wifi.managed</string>
			<key>PayloadUUID</key>
			<string>${uuid1}</string>
			<key>PayloadVersion</key>
			<integer>1</integer>
			<key>SSID_STR</key>
			<string>${settings.ssid}</string>
		</dict>
	</array>
	<key>PayloadDisplayName</key>
	<string>Wi-Fi Spark: ${settings.ssid}</string>
	<key>PayloadIdentifier</key>
	<string>com.wifispark.profile.${uuid2}</string>
	<key>PayloadRemovalDisallowed</key>
	<false/>
	<key>PayloadType</key>
	<string>Configuration</string>
	<key>PayloadUUID</key>
	<string>${uuid2}</string>
	<key>PayloadVersion</key>
	<integer>1</integer>
</dict>
</plist>`;
};

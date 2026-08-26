
export type EncryptionType = 'WPA' | 'WEP' | 'nopass';

export interface WiFiSettings {
  ssid: string;
  password: string;
  encryption: EncryptionType;
  hidden: boolean;
}

export interface CardTheme {
  id: string;
  name: string;
  bgClass: string;
  textClass: string;
  accentClass: string;
}

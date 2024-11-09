import { Schema, model, models, Model } from 'mongoose';

// Coverage Point Schema
interface ICoveragePoint {
  location: {
    type: string;
    coordinates: number[];
  };
  signalStrength: number;
  provider: string;
  type: 'cellular' | 'wifi';
  timestamp: Date;
  userId?: string;
}

const coveragePointSchema = new Schema<ICoveragePoint>({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  signalStrength: { type: Number, required: true },
  provider: { type: String, required: true },
  type: { type: String, enum: ['cellular', 'wifi'], required: true },
  timestamp: { type: Date, default: Date.now },
  userId: { type: String },
});

// WiFi Hotspot Schema
interface IWifiHotspot {
  name: string;
  location: {
    type: string;
    coordinates: number[];
  };
  provider: string;
  speed: string;
  isPublic: boolean;
  lastVerified: Date;
}

const wifiHotspotSchema = new Schema<IWifiHotspot>({
  name: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  provider: { type: String, required: true },
  speed: { type: String },
  isPublic: { type: Boolean, default: true },
  lastVerified: { type: Date, default: Date.now },
});

// Measurement Schema
interface IMeasurement {
  userId: string;
  type: 'speed' | 'signal' | 'latency';
  value: number;
  unit: string;
  location: {
    type: string;
    coordinates: number[];
  };
  timestamp: Date;
  device: {
    type: string;
    model: string;
  };
}

const measurementSchema = new Schema<IMeasurement>({
  userId: { type: String, required: true },
  type: { type: String, enum: ['speed', 'signal', 'latency'], required: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  timestamp: { type: Date, default: Date.now },
  device: {
    type: { type: String, required: true },
    model: { type: String, required: true },
  },
});

// Export models with type safety
export const CoveragePoint = models.CoveragePoint || model<ICoveragePoint>('CoveragePoint', coveragePointSchema);
export const WifiHotspot = models.WifiHotspot || model<IWifiHotspot>('WifiHotspot', wifiHotspotSchema);
export const Measurement = models.Measurement || model<IMeasurement>('Measurement', measurementSchema);
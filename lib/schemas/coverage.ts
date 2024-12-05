import { z } from 'zod';

export const coverageMeasurementSchema = z.object({
    notes: z.string().optional(),
    networkType: z.enum(['cellular', 'wifi']),
    carrier: z.string().optional(),
    signalStrength: z.number().min(-120).max(0),
    quality: z.enum(['excellent', 'good', 'fair', 'poor']),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        accuracy: z.number()
    })
});

export const wifiMeasurementSchema = z.object({
    ssid: z.string().min(1, 'SSID is required'),
    security: z.enum(['WPA2', 'WPA3', 'Open']),
    frequency: z.number().min(2400).max(5900),
    signalStrength: z.number().min(-120).max(0),
    quality: z.enum(['excellent', 'good', 'fair', 'poor']),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        accuracy: z.number()
    }),
    notes: z.string().optional()
});

export type CoverageMeasurement = z.infer<typeof coverageMeasurementSchema>;
export type WiFiMeasurement = z.infer<typeof wifiMeasurementSchema>;

export const coverageReportSchema = z.object({
    measurements: z.array(coverageMeasurementSchema).min(1, 'At least one measurement is required'),
    deviceInfo: z.object({
        platform: z.enum(['ios', 'android', 'web']),
        model: z.string().optional(),
        osVersion: z.string().optional(),
        appVersion: z.string(),
        screenSize: z.object({
            width: z.number(),
            height: z.number()
        })
    }),
    timestamp: z.number(),
    notes: z.string().optional(),
    isVerified: z.boolean().default(false),
    reliability: z.number().min(0).max(1)
});

export const wifiReportSchema = z.object({
    measurements: z.array(wifiMeasurementSchema).min(1, 'At least one measurement is required'),
    deviceInfo: z.object({
        platform: z.enum(['ios', 'android', 'web']),
        model: z.string().optional(),
        osVersion: z.string().optional(),
        appVersion: z.string(),
        screenSize: z.object({
            width: z.number(),
            height: z.number()
        })
    }),
    timestamp: z.number(),
    notes: z.string().optional(),
    isVerified: z.boolean().default(false),
    reliability: z.number().min(0).max(1)
});

export type CoverageReport = z.infer<typeof coverageReportSchema>;
export type WiFiReport = z.infer<typeof wifiReportSchema>;

// Form schemas for user input
export const coverageFormSchema = z.object({
    notes: z.string().optional(),
    networkType: z.enum(['cellular', 'wifi']),
    carrier: z.string().optional(),
    manualSignalStrength: z.number().min(-120).max(0).optional(),
    quality: z.enum(['excellent', 'good', 'fair', 'poor']).optional()
});

export const wifiFormSchema = z.object({
    ssid: z.string().min(1, 'SSID is required'),
    security: z.enum(['WPA2', 'WPA3', 'Open']),
    notes: z.string().optional(),
    manualSignalStrength: z.number().min(-120).max(0).optional()
});

export type CoverageFormData = z.infer<typeof coverageFormSchema>;
export type WiFiFormData = z.infer<typeof wifiFormSchema>;

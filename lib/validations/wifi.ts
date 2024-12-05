import * as z from 'zod';

export const wifiSubmissionSchema = z.object({
    ssid: z.string()
        .min(1, 'SSID is required')
        .max(32, 'SSID must be less than 32 characters'),

    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(63, 'Password must be less than 63 characters')
        .optional(),

    security: z.enum(['none', 'wep', 'wpa', 'wpa2', 'wpa3'])
        .default('wpa2'),

    speed: z.number()
        .min(0, 'Speed must be positive')
        .optional(),

    quality: z.number()
        .min(0, 'Quality must be between 0 and 100')
        .max(100, 'Quality must be between 0 and 100')
        .optional(),

    location: z.object({
        latitude: z.number()
            .min(-90, 'Invalid latitude')
            .max(90, 'Invalid latitude'),
        longitude: z.number()
            .min(-180, 'Invalid longitude')
            .max(180, 'Invalid longitude'),
        accuracy: z.number()
            .min(0, 'Accuracy must be positive')
            .optional(),
    }),

    notes: z.string()
        .max(500, 'Notes must be less than 500 characters')
        .optional(),

    isPublic: z.boolean()
        .default(true),

    provider: z.string()
        .optional(),

    timestamp: z.date()
        .default(() => new Date()),
});

export type WifiSubmission = z.infer<typeof wifiSubmissionSchema>;

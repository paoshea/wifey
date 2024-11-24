import { z } from 'zod';

export const measurementSchema = z.object({
  signalStrength: z
    .string()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: "Signal strength must be a number",
    })
    .transform((val) => (val ? Number(val) : "")),
  networkType: z
    .string()
    .min(1, "Network type is required")
    .max(50, "Network type must be less than 50 characters"),
  location: z
    .string()
    .min(1, "Location is required")
    .regex(/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/, {
      message: "Location must be in format: latitude, longitude",
    }),
});

export type MeasurementFormData = z.infer<typeof measurementSchema>;

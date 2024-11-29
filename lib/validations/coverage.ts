import * as z from 'zod';

export const coverageSearchSchema = z.object({
  carrier: z.enum(['kolbi_cr', 'movistar_cr', 'claro_cr', 'liberty_cr'], {
    required_error: 'Please select a carrier',
  }),
  technology: z.enum(['2G', '3G', '4G', '5G'], {
    required_error: 'Please select a network technology',
  }).optional(),
  location: z.object({
    lat: z.number({
      required_error: 'Latitude is required',
    }).min(-90).max(90),
    lng: z.number({
      required_error: 'Longitude is required',
    }).min(-180).max(180),
  }),
  radius: z.number({
    required_error: 'Search radius is required',
  }).min(0.1).max(50).default(1), // radius in kilometers
  minSignalStrength: z.number().min(-150).max(0).optional(), // in dBm
  maxResults: z.number().min(1).max(1000).default(100),
  includeUnverified: z.boolean().default(true),
});

export type CoverageSearchParams = z.infer<typeof coverageSearchSchema>;

export const coverageReportSchema = z.object({
  carrier: z.enum(['kolbi_cr', 'movistar_cr', 'claro_cr', 'liberty_cr'], {
    required_error: 'Please select a carrier',
  }),
  technology: z.enum(['2G', '3G', '4G', '5G'], {
    required_error: 'Please select a network technology',
  }),
  location: z.object({
    lat: z.number({
      required_error: 'Latitude is required',
    }).min(-90).max(90),
    lng: z.number({
      required_error: 'Longitude is required',
    }).min(-180).max(180),
  }),
  signalStrength: z.number({
    required_error: 'Signal strength is required',
  }).min(-150).max(0), // in dBm
  reliability: z.number().min(0).max(100).optional(), // percentage
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CoverageReportParams = z.infer<typeof coverageReportSchema>;

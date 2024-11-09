import { CarrierAPIConfig } from './types';

export const carrierConfigs: Record<string, CarrierAPIConfig> = {
  kolbi_cr: {
    baseUrl: 'https://api.kolbi.cr/coverage/v1',
    apiKey: process.env.KOLBI_API_KEY || '',
    country: 'CR'
  },
  movistar_cr: {
    baseUrl: 'https://api.movistar.cr/coverage/v1',
    apiKey: process.env.MOVISTAR_API_KEY || '',
    country: 'CR'
  },
  claro_cr: {
    baseUrl: 'https://api.claro.cr/coverage/v1',
    apiKey: process.env.CLARO_API_KEY || '',
    country: 'CR'
  },
  liberty_cr: {
    baseUrl: 'https://api.liberty.cr/coverage/v1',
    apiKey: process.env.LIBERTY_API_KEY || '',
    country: 'CR'
  }
};
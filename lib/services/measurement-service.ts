import type { MeasurementFormData } from '../validations/measurement';

class MeasurementService {
  private readonly API_BASE = '/api/measurements';

  async submitMeasurement(data: MeasurementFormData): Promise<void> {
    const response = await fetch(this.API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to submit measurement' }));
      throw new Error(error.message || 'Failed to submit measurement');
    }
  }

  async getMeasurements(): Promise<MeasurementFormData[]> {
    const response = await fetch(this.API_BASE);
    
    if (!response.ok) {
      throw new Error('Failed to fetch measurements');
    }

    return response.json();
  }

  async getMeasurementById(id: string): Promise<MeasurementFormData> {
    const response = await fetch(`${this.API_BASE}/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch measurement');
    }

    return response.json();
  }
}

export const measurementService = new MeasurementService();

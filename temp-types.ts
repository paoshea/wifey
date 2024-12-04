import { Prisma } from '@prisma/client';

// This will help us see what fields are available
type OrderByFields = keyof Prisma.MeasurementOrderByWithRelationInput;

// Create a type that will show all available fields
const orderByExample: Prisma.MeasurementOrderByWithRelationInput = {
    // TypeScript will show errors for invalid fields
    // and autocomplete will show valid fields
};

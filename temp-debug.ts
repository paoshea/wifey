import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This will print the available fields in the Measurement model
console.log(Object.keys(prisma.measurement.fields));

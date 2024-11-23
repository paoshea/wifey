import { beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

beforeAll(async () => {
  // Set up any global test configuration
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})

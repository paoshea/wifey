// api/auth/register/route.ts

import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with emailVerified set to current date
    const user = await prisma.user.create({
      data: {
        name: username,
        email,
        hashedPassword,
        emailVerified: new Date(), // Set email as verified immediately
      },
    });

    return NextResponse.json({ 
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.name,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}

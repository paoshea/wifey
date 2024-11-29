// api/auth/register/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { z } from 'zod';
import { crypto } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomUUID();

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationToken,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken}`;
    
    await resend.emails.send({
      from: 'Wifey <noreply@wifey.app>',
      to: email,
      subject: 'Verify your email',
      html: `
        <h1>Welcome to Wifey!</h1>
        <p>Click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>If you didn't create this account, you can safely ignore this email.</p>
      `,
    });

    return NextResponse.json(
      {
        message: 'User created successfully. Please check your email to verify your account.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

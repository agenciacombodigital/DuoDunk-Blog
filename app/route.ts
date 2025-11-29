import { NextResponse } from 'next/server';

// Esta rota é apenas para garantir que o Next.js reconheça a pasta 'app' como uma rota válida
export async function GET() {
  return NextResponse.json({ message: 'OK' }, { status: 200 });
}
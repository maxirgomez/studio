import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security";

export async function GET(req: NextRequest) {
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  const canProceed = checkRateLimit(clientIP);
  
  return NextResponse.json({
    clientIP,
    canProceed,
    timestamp: new Date().toISOString(),
    message: canProceed ? 'Rate limit OK' : 'Rate limit exceeded'
  });
}

import { NextRequest, NextResponse } from "next/server";
import { extractAndValidateToken } from "@/lib/security";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = extractAndValidateToken(req);
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    hasToken: !!token,
    tokenLength: token?.length || 0,
    user: user ? {
      user: user.user,
      mail: user.mail,
      role: user.role
    } : null,
    cookies: req.cookies.getAll().map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0
    })),
    headers: {
      'user-agent': req.headers.get('user-agent'),
      'x-forwarded-for': req.headers.get('x-forwarded-for'),
      'x-real-ip': req.headers.get('x-real-ip'),
      'authorization': req.headers.get('authorization'),
      'cookie': req.headers.get('cookie') ? 'Presente' : 'Ausente'
    }
  });
}

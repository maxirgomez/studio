import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Establecer una cookie de prueba
  const response = NextResponse.json({
    message: "Cookie de prueba establecida",
    timestamp: new Date().toISOString(),
    cookies: req.cookies.getAll().map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0
    }))
  });

  // Establecer cookie de prueba
  response.cookies.set("test-cookie", "test-value-123", {
    httpOnly: false, // Permitir acceso desde JavaScript para testing
    secure: false, // Para HTTP
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hora
    path: "/",
  });

  return response;
}

export async function POST(req: NextRequest) {
  const { cookieName, cookieValue } = await req.json();
  
  const response = NextResponse.json({
    message: `Cookie ${cookieName} establecida`,
    timestamp: new Date().toISOString(),
    cookies: req.cookies.getAll().map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0
    }))
  });

  // Establecer cookie personalizada
  response.cookies.set(cookieName || "custom-cookie", cookieValue || "custom-value", {
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  });

  return response;
}

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function GET(req: NextRequest) {
  try {
    // Intentar obtener token de todas las formas posibles
    const tokenFromCookie = req.cookies.get("token")?.value;
    const authHeader = req.headers.get("authorization");
    const tokenFromHeader = authHeader?.replace("Bearer ", "");
    const xAuthToken = req.headers.get("x-auth-token");
    
    const token = tokenFromHeader || tokenFromCookie || xAuthToken;
    
    const debugInfo: any = {
      hasTokenInCookie: !!tokenFromCookie,
      hasTokenInAuthHeader: !!tokenFromHeader,
      hasTokenInXAuthHeader: !!xAuthToken,
      tokenFound: !!token,
      authHeaderValue: authHeader || null,
    };
    
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        debugInfo.tokenValid = true;
        debugInfo.payload = payload;
      } catch (error) {
        debugInfo.tokenValid = false;
        debugInfo.tokenError = error instanceof Error ? error.message : 'Error desconocido';
      }
    } else {
      debugInfo.message = "No se encontró token en ninguna ubicación";
    }
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}


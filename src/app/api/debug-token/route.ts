import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Información de debug del token
    const debugInfo = {
      headers: {
        authorization: req.headers.get('authorization'),
        cookie: req.headers.get('cookie'),
        'x-auth-token': req.headers.get('x-auth-token'),
      },
      cookies: {
        token: req.cookies.get('token')?.value,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}

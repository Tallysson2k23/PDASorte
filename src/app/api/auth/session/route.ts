import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isRole } from "@/lib/auth/roles";
import { createAdminSession, SESSION_COOKIE, SESSION_DURATION_MS } from "@/lib/auth/session";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getClientKey, hasValidOrigin, isRateLimited } from "@/lib/security/request";

const bodySchema = z.object({ idToken: z.string().min(100).max(10_000) });

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  if (isRateLimited(`login:${getClientKey(request)}`)) return NextResponse.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

  try {
    const { idToken } = bodySchema.parse(await request.json());
    const decoded = await adminAuth().verifyIdToken(idToken, true);
    const userRef = adminDb().collection("users").doc(decoded.uid);
    const user = await userRef.get();
    const data = user.data();
    if (!user.exists || data?.status !== "active" || !isRole(data.role)) {
      await adminDb().collection("securityEvents").add({ type: "unauthorized_admin_login", uid: decoded.uid, createdAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ error: "Acesso administrativo não autorizado." }, { status: 403 });
    }

    const sessionCookie = await createAdminSession(idToken);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000,
    });
    await adminDb().collection("auditLogs").add({ actorId: decoded.uid, action: "admin.session.created", entity: "session", createdAt: FieldValue.serverTimestamp() });
    return response;
  } catch (error) {
    const safeError = error as { code?: unknown; message?: unknown };
    const diagnostic = {
      code: typeof safeError.code === "string" ? safeError.code : "unknown",
      message: typeof safeError.message === "string" ? safeError.message : "unknown",
    };
    console.error("Falha ao criar sessão administrativa", diagnostic.code, diagnostic.message);
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }
}

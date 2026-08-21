import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { createDevSession, verifyDevSession } from "./dev-session";
import { isRole, type Role } from "./roles";

export const SESSION_COOKIE = "pda_admin_session";
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export type AdminActor = { uid: string; email: string | null; role: Role; displayName: string };

const developmentSecret = createHash("sha256")
  .update(process.env.SESSION_SECRET || `pda-demo-session:${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "local"}`)
  .digest();

function usesAuthEmulator(): boolean {
  return Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
}

export async function createAdminSession(idToken: string): Promise<string> {
  if (!usesAuthEmulator()) return adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS });
  const decoded = await adminAuth().verifyIdToken(idToken, true);
  return createDevSession({ uid: decoded.uid, email: decoded.email ?? null, exp: Date.now() + SESSION_DURATION_MS }, developmentSecret);
}

async function verifyAdminSession(sessionCookie: string) {
  if (!usesAuthEmulator()) return adminAuth().verifySessionCookie(sessionCookie, true);
  return verifyDevSession(sessionCookie, developmentSecret);
}

export async function getAdminActor(): Promise<AdminActor | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await verifyAdminSession(sessionCookie);
    if (!decoded) return null;
    const profile = await adminDb().collection("users").doc(decoded.uid).get();
    const data = profile.data();
    if (!profile.exists || data?.status !== "active" || !isRole(data.role)) return null;
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role: data.role,
      displayName: typeof data.displayName === "string" ? data.displayName : decoded.email ?? "Usuário",
    };
  } catch {
    return null;
  }
}

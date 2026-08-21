import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (process.env.DEMO_MODE !== "true") throw new Error("Bootstrap permitido somente com DEMO_MODE=true nesta etapa.");

const email = process.env.SUPERADMIN_EMAIL;
const password = process.env.SUPERADMIN_INITIAL_PASSWORD;
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!email || !password || password.length < 12 || !projectId) throw new Error("Configure SUPERADMIN_EMAIL, SUPERADMIN_INITIAL_PASSWORD (mínimo 12 caracteres) e o project ID em .env.local.");

let app = getApps()[0];
if (!app) {
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    app = initializeApp({ projectId });
  } else {
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!clientEmail || !privateKey) throw new Error("Credenciais Firebase Admin ausentes.");
    app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
}

const auth = getAuth(app);
const db = getFirestore(app);
let user;
try { user = await auth.getUserByEmail(email); }
catch (error) {
  if (error?.code !== "auth/user-not-found") throw error;
  user = await auth.createUser({ email, password, emailVerified: true, disabled: false });
}

user = await auth.updateUser(user.uid, { password, emailVerified: true, disabled: false });

await auth.setCustomUserClaims(user.uid, { role: "superadmin" });
await db.collection("users").doc(user.uid).set({ displayName: "Superadministrador", email, role: "superadmin", status: "active", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
await db.collection("auditLogs").add({ actorId: "bootstrap-script", action: "superadmin.bootstrap", entity: `users/${user.uid}`, createdAt: FieldValue.serverTimestamp(), reason: "Criação inicial controlada" });
console.log("Superadministrador configurado com sucesso. Remova a senha inicial do .env.local após o primeiro login.");

import { readFile } from "node:fs/promises";
import { assertFails, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, describe, it } from "vitest";

let environment: RulesTestEnvironment;

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: "pdssorte-rules-test",
    firestore: { rules: await readFile("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});

afterAll(async () => environment.cleanup());

describe("Firestore deny-by-default", () => {
  it("nega escrita não autenticada", async () => {
    const db = environment.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "campaigns/test"), { title: "Maliciosa" }));
  });

  it("nega leitura direta mesmo para usuário autenticado", async () => {
    const db = environment.authenticatedContext("admin", { role: "superadmin" }).firestore();
    await assertFails(getDoc(doc(db, "users/other")));
  });
});

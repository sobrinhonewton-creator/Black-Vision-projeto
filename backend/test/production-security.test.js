import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";
import bcrypt from "bcryptjs";

const port = 41000 + (process.pid % 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const frontendOrigin = "https://blackvision.com.br";
const adminEmail = "admin@example.com";
const adminPassword = "SecureTestPassword!";

let server;

async function waitUntilHealthy() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // O processo ainda está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Backend local não ficou saudável dentro do prazo.");
}

test.before(async () => {
  const adminBcryptHash = await bcrypt.hash(adminPassword, 4);
  server = spawn(process.execPath, ["src/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      FRONTEND_URL: frontendOrigin,
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD_BCRYPT_HASH: adminBcryptHash,
      JWT_SECRET: "integration-test-secret",
    },
    stdio: "ignore",
  });
  await waitUntilHealthy();
});

test.after(() => {
  server?.kill();
});

test("preflight aceita somente o dominio oficial", async () => {
  const allowed = await fetch(`${baseUrl}/api/auth/login`, {
    method: "OPTIONS",
    headers: {
      Origin: frontendOrigin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,authorization",
    },
  });

  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("access-control-allow-origin"), frontendOrigin);
  assert.match(allowed.headers.get("access-control-allow-methods"), /POST/);
  assert.match(allowed.headers.get("access-control-allow-headers"), /Authorization/i);

  const denied = await fetch(`${baseUrl}/api/auth/login`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://evil.example",
      "Access-Control-Request-Method": "POST",
    },
  });

  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("login exige a credencial configurada e nao aceita fallback", async () => {
  const legacyFallback = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: frontendOrigin },
    body: JSON.stringify({ email: adminEmail, password: "LegacyFallbackPassword" }),
  });
  assert.equal(legacyFallback.status, 401);

  const configured = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: frontendOrigin },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const body = await configured.json();

  assert.equal(configured.status, 200);
  assert.equal(body.user.role, "admin");
  assert.ok(body.token);
});

test("rota publica de ativacao foi removida", async () => {
  const response = await fetch(`${baseUrl}/api/activate`);
  assert.equal(response.status, 404);
});

test("Mercado Pago aceita somente PIX e Stripe somente cartao ou boleto", async () => {
  const mercadoPagoBoleto = await fetch(`${baseUrl}/api/payments/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: frontendOrigin },
    body: JSON.stringify({ tier: "basic", method: "boleto", customerEmail: adminEmail }),
  });
  assert.equal(mercadoPagoBoleto.status, 400);

  const stripePix = await fetch(`${baseUrl}/api/payments/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: frontendOrigin },
    body: JSON.stringify({ tier: "basic", method: "pix", customerEmail: adminEmail }),
  });
  assert.equal(stripePix.status, 400);
});

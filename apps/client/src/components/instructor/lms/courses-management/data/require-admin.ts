export async function requireAdmin() {
  // Demo-only fake admin session; no real auth
  return {
    user: {
      id: "demo-admin-id",
      role: "Admin",
      email: "admin@example.com",
      name: "Demo Admin",
    },
  } as const;
}
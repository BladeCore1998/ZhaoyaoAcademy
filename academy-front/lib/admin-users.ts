import { auth } from "@/lib/auth";

export const ADMIN_RESET_PASSWORD = "12345678";

export async function updateManagedUserPassword(userId: string, password: string, preserveSessionToken?: string) {
  const context = await auth.$context;
  const passwordHash = await context.password.hash(password);
  await context.internalAdapter.updatePassword(userId, passwordHash);

  const sessions = await context.internalAdapter.listSessions(userId);
  const tokensToDelete = sessions.map((session) => session.token).filter((token) => token !== preserveSessionToken);

  if (tokensToDelete.length > 0) {
    await context.internalAdapter.deleteSessions(tokensToDelete);
  }
}

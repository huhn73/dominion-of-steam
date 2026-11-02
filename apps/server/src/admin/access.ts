/**
 * Admins are listed in `ADMIN_EMAILS` (comma-separated, case-insensitive); read on every call
 * so tests can set the variable. Without it there are no admins.
 */
export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.trim().toLowerCase())
}

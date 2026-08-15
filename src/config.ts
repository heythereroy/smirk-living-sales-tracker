// Both @smirkliving.com users run this app during the pop-up, so Admin
// Tools is shown to everyone by default. To restrict it to specific
// people, list their exact emails here.
export const ADMIN_EMAILS: string[] = []

export function isAdmin(email: string | null | undefined): boolean {
  if (ADMIN_EMAILS.length === 0) return true
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

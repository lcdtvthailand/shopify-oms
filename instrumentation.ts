export async function register() {
  // Importing env triggers t3-env validation at server startup.
  // If any required variable is missing, this throws before the first request.
  await import('@/lib/env')
}

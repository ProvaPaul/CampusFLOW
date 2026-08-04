/**
 * MongoDB ObjectIds embed their creation time in the first 4 bytes. Several DTOs
 * (Subject, TeacherAssignment) don't expose a separate `createdAt` field, but we
 * already receive their `id` on every response — so we can derive a real creation
 * timestamp from data we already have, with no backend changes.
 * https://www.mongodb.com/docs/manual/reference/method/ObjectId/
 */
export function dateFromObjectId(id: string): Date {
  const timestampHex = id.substring(0, 8);
  const seconds = parseInt(timestampHex, 16);
  return new Date(seconds * 1000);
}

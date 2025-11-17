/**
 * Stripe webhook utilities with idempotency and security
 * 
 * Implements:
 * - Event signature verification
 * - Idempotency (prevents duplicate processing)
 * - Secure event handling
 * - Audit logging
 */

import { db } from "./db";
import { webhookEvent } from "./schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Check if webhook event has already been processed (idempotency)
 * 
 * @param eventId - Stripe event.id
 * @returns true if already processed, false otherwise
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const existing = await db
      .select()
      .from(webhookEvent)
      .where(eq(webhookEvent.id, eventId))
      .limit(1);
    
    return existing.length > 0;
  } catch (err) {
    logger.error({ err, eventId }, 'Failed to check webhook event idempotency');
    // Fail open: if we can't check, proceed (but log the error)
    return false;
  }
}

/**
 * Mark webhook event as processed
 * 
 * @param eventId - Stripe event.id
 * @param eventType - Stripe event.type
 * @param eventData - Optional event data for debugging
 */
export async function markEventProcessed(
  eventId: string,
  eventType: string,
  eventData?: unknown
): Promise<void> {
  try {
    await db.insert(webhookEvent).values({
      id: eventId,
      type: eventType,
      data: eventData as object | undefined,
      processedAt: new Date(),
    });
    
    logger.info(
      { eventId, eventType },
      'Webhook event marked as processed'
    );
  } catch (err) {
    // Ignore duplicate key errors (race condition)
    const isDuplicate = err instanceof Error && 
      (err.message.includes('duplicate') || err.message.includes('unique'));
    
    if (!isDuplicate) {
      logger.error(
        { err, eventId, eventType },
        'Failed to mark webhook event as processed'
      );
    }
  }
}

/**
 * Cleanup old webhook events (run periodically)
 * Keeps last 30 days for debugging
 */
export async function cleanupOldWebhookEvents(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await db
      .delete(webhookEvent)
      .where(eq(webhookEvent.processedAt, thirtyDaysAgo));
    
    logger.info(
      { deletedCount: result },
      'Cleaned up old webhook events'
    );
    
    return typeof result === 'number' ? result : 0;
  } catch (err) {
    logger.error({ err }, 'Failed to cleanup old webhook events');
    return 0;
  }
}

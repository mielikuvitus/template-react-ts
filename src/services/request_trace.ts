/**
 * REQUEST TRACE UTILITIES
 * =======================
 * 
 * Purpose:
 * Generate unique request IDs for tracing API calls across frontend and backend.
 * 
 * Why this matters:
 * - When debugging, you can match frontend logs with backend logs using the same requestId
 * - Backend can log "requestId: req_abc123, received 150KB image" 
 * - Frontend logs "requestId: req_abc123, upload started"
 * - Makes curl testing easier: pass -H "x-request-id: req_CURLTEST" to trace your request
 * 
 * Usage:
 *   const requestId = makeRequestId();
 *   console.log(`[${formatNow()}] Starting upload ${requestId}`);
 */

/**
 * Generate a unique request ID for tracing.
 * Format: "req_" + 8 random alphanumeric characters
 * Example: "req_k7x2m9p4"
 */
export function makeRequestId(): string {
    const chars = Math.random().toString(36).substring(2, 10);
    return `req_${chars}`;
}

/**
 * Format current timestamp for logging.
 * Returns ISO string without milliseconds for readability.
 * Example: "2025-02-05T14:30:00"
 */
export function formatNow(): string {
    return new Date().toISOString().split('.')[0];
}

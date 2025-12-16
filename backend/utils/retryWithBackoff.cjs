/**
 * Retry utility with exponential backoff
 * Handles 429 rate limit errors gracefully
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} - Result from successful function call
 */
async function retryWithBackoff(fn, options = {}) {
    const {
        maxRetries = 5,
        initialDelayMs = 1000,
        maxDelayMs = 32000,
        backoffMultiplier = 2,
        retryableErrors = [429, 500, 503],
        onRetry = null
    } = options;

    let lastError;
    let delay = initialDelayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if error is retryable
            const isRetryable = 
                error.status && retryableErrors.includes(error.status) ||
                error.message?.includes('429') ||
                error.message?.includes('quota') ||
                error.message?.includes('rate limit');

            // Don't retry if not retryable or max retries reached
            if (!isRetryable || attempt === maxRetries) {
                throw error;
            }

            // Extract retry delay from error if available (Google API provides this)
            let waitTime = delay;
            if (error.errorDetails) {
                const retryInfo = error.errorDetails.find(d => d['@type']?.includes('RetryInfo'));
                if (retryInfo?.retryDelay) {
                    const seconds = parseFloat(retryInfo.retryDelay.replace('s', ''));
                    waitTime = Math.max(seconds * 1000, delay);
                }
            }

            // Cap at max delay
            waitTime = Math.min(waitTime, maxDelayMs);

            // Call retry callback if provided
            if (onRetry) {
                onRetry(attempt + 1, waitTime, error);
            }

            console.log(`⏳ Retry ${attempt + 1}/${maxRetries} após ${waitTime}ms (erro: ${error.status || error.message})`);

            // Wait before retrying
            await sleep(waitTime);

            // Increase delay for next attempt (exponential backoff)
            delay = Math.min(delay * backoffMultiplier, maxDelayMs);
        }
    }

    throw lastError;
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { retryWithBackoff, sleep };

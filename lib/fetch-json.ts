/**
 * Safely parse JSON from fetch responses
 * Handles cases where the response might be HTML instead of JSON
 */

export interface FetchJsonOptions extends RequestInit {
  timeout?: number;
}

/**
 * Fetch and parse JSON safely, with proper error handling
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Parsed JSON data
 * @throws Error with appropriate message if request fails
 */
export async function fetchJson<T = any>(
  url: string,
  options?: FetchJsonOptions
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options || {};

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      // Try to get error message from JSON if available
      if (isJson) {
        try {
          const errorData = await response.json();
          throw new Error(
            errorData?.error || 
            errorData?.message || 
            `Request failed with status ${response.status}`
          );
        } catch (parseError) {
          // If JSON parsing fails, use generic error
          throw new Error(`Request failed with status ${response.status}`);
        }
      }

      // Non-JSON error response (likely HTML redirect or error page)
      throw new Error(
        `Request failed with status ${response.status}. Server returned ${contentType || 'unknown'} instead of JSON.`
      );
    }

    // Success response - parse JSON
    if (!isJson) {
      throw new Error(
        `Expected JSON response but got ${contentType || 'unknown'}. The server may have redirected to an HTML page.`
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Check if a response is JSON before parsing
 * @param response - Fetch response
 * @returns Whether the response is JSON
 */
export function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type");
  return contentType !== null && contentType.includes("application/json");
}

/**
 * Safely parse response JSON with error handling
 * @param response - Fetch response
 * @returns Parsed JSON or null if parsing fails
 */
export async function safeParseJson<T = any>(
  response: Response
): Promise<T | null> {
  try {
    if (!isJsonResponse(response)) {
      console.warn(
        `Response is not JSON (${response.headers.get("content-type")})`
      );
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    return null;
  }
}

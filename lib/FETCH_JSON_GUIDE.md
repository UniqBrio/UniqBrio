# Fetch JSON Helper - Usage Guide

## Problem Solved

The error **"Unexpected token '<', "<!DOCTYPE "... is not valid JSON"** occurs when:
- An API endpoint returns HTML (redirect/error page) instead of JSON
- The client tries to parse it with `.json()` before checking response status
- Typically happens when authentication fails and the server redirects to login

## Solution

Use the `fetchJson` helper from `@/lib/fetch-json` instead of raw `fetch()` + `.json()`.

## Basic Usage

### Before (Unsafe ❌)
```typescript
const response = await fetch("/api/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
const result = await response.json(); // ⚠️ Can throw if response is HTML
if (!response.ok) {
  throw new Error(result.error);
}
```

### After (Safe ✅)
```typescript
import { fetchJson } from "@/lib/fetch-json";

const result = await fetchJson("/api/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
// Automatically handles errors and content-type checking
```

## Features

### 1. **fetchJson** - All-in-one fetch with JSON parsing
```typescript
// Basic GET
const data = await fetchJson("/api/users");

// POST with timeout
const result = await fetchJson("/api/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
  timeout: 10000, // 10 seconds (default: 30s)
});

// With TypeScript types
interface User {
  userId: string;
  email: string;
}
const user = await fetchJson<User>("/api/user");
```

### 2. **isJsonResponse** - Check content-type before parsing
```typescript
import { isJsonResponse } from "@/lib/fetch-json";

const response = await fetch("/api/data");
if (isJsonResponse(response)) {
  const data = await response.json();
} else {
  console.warn("Expected JSON but got:", response.headers.get("content-type"));
}
```

### 3. **safeParseJson** - Parse with null fallback
```typescript
import { safeParseJson } from "@/lib/fetch-json";

const response = await fetch("/api/data");
const data = await safeParseJson(response); // Returns null if parsing fails
if (data) {
  // Use data
} else {
  // Handle non-JSON response
}
```

## Error Handling

The helper throws descriptive errors:

```typescript
try {
  const data = await fetchJson("/api/protected");
} catch (error) {
  // Possible error messages:
  // - "Request failed with status 401. Server returned text/html instead of JSON."
  // - "Request timeout after 30000ms"
  // - "Expected JSON response but got text/html. The server may have redirected to an HTML page."
  console.error(error.message);
}
```

## When to Use

✅ **Use `fetchJson` when:**
- Calling your own API routes
- You expect JSON responses
- You want automatic error handling
- You need timeout support

⚠️ **Use regular `fetch` when:**
- Fetching non-JSON content (images, HTML, text)
- You need fine-grained control over response handling
- Working with streaming responses

## Migration Checklist

To migrate existing code:

1. Import the helper:
   ```typescript
   import { fetchJson } from "@/lib/fetch-json";
   ```

2. Replace this pattern:
   ```typescript
   const response = await fetch(url, options);
   const data = await response.json();
   if (!response.ok) throw new Error(data.error);
   ```

3. With:
   ```typescript
   const data = await fetchJson(url, options);
   ```

4. Update error handling if needed - errors are now thrown with descriptive messages

## Examples in Codebase

- ✅ `app/register/page.tsx` - Registration form submission
- ✅ `app/register/page.tsx` - Business image upload

## Best Practices

1. **Always use credentials for authenticated endpoints:**
   ```typescript
   const data = await fetchJson("/api/protected", {
     credentials: "include", // Send cookies
   });
   ```

2. **Set appropriate timeouts for slow operations:**
   ```typescript
   const data = await fetchJson("/api/heavy-operation", {
     timeout: 60000, // 60 seconds for uploads
   });
   ```

3. **Use TypeScript types for better autocomplete:**
   ```typescript
   interface ApiResponse {
     success: boolean;
     data: any;
   }
   const result = await fetchJson<ApiResponse>("/api/endpoint");
   ```

4. **Handle errors gracefully:**
   ```typescript
   try {
     const data = await fetchJson("/api/endpoint");
     // Use data
   } catch (error) {
     toast({
       title: "Request Failed",
       description: error instanceof Error ? error.message : "Unknown error",
       variant: "destructive",
     });
   }
   ```

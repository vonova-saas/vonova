// Use a same-origin relative base. Service paths already begin with '/api/...',
// so keeping baseURL empty avoids double '/api' while still proxying via Next.js rewrites.
//  export const baseURL = '';
export const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
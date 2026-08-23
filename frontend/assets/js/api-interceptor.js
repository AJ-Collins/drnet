/**
 * Global API Interceptor
 * 
 * Automatically attaches `credentials: "include"` to all local API requests
 * and globally handles 401 Unauthorized responses to redirect to login.
 */
(function() {
    const originalFetch = window.fetch;

    window.fetch = async function() {
        let [resource, config] = arguments;

        // Determine if it's an API request
        let isApiRequest = false;
        if (typeof resource === 'string' && resource.startsWith('/api/')) {
            isApiRequest = true;
        } else if (resource instanceof Request && resource.url.includes('/api/')) {
            isApiRequest = true;
        }

        if (isApiRequest) {
            // Ensure config exists
            if (!config) {
                config = {};
            }

            // Always include credentials (cookies/session) for our own API
            if (!config.credentials) {
                config.credentials = 'include';
            }
        }

        try {
            const response = await originalFetch(resource, config);
            
            // Global 401 handling
            if (response.status === 401) {
                // Ignore if we are already logging in
                if (!window.location.pathname.includes('/login')) {
                    console.warn("Session expired or unauthorized. Redirecting to login...");
                    // Try to extract a redirect URL from response if provided by backend
                    try {
                        const data = await response.clone().json();
                        if (data.redirectUrl) {
                            window.location.href = data.redirectUrl;
                            return response;
                        }
                    } catch (e) {
                        // ignore JSON parse error
                    }
                    window.location.href = '/login?expired=true';
                }
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    };
})();

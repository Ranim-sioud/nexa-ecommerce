import { QueryClient } from "@tanstack/react-query";

// Singleton so api.ts interceptor can clear the auth cache without
// needing React context (avoids a circular dependency).
const queryClient = new QueryClient();

export default queryClient;

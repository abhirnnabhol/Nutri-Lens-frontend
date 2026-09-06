import apiClient from "./api";

/**
 * Service to query backend health check status
 */
export async function fetchHealthStatus() {
  return apiClient.get("/health");
}

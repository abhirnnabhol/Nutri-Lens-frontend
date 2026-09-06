import { useState, useEffect } from "react";
import { fetchHealthStatus } from "../services/healthService";

export function useHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealthStatus();
      setHealth(data);
    } catch (err) {
      setError(err.message || "Unable to reach backend API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return { health, loading, error, refetch: checkHealth };
}

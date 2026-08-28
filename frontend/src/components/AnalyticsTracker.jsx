import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackOpen, trackPageview } from "@/lib/analytics";

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackOpen();
  }, []);

  useEffect(() => {
    trackPageview(location.pathname);
  }, [location.pathname]);

  return null;
}

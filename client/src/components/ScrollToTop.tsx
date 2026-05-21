import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Scrolls the window to the top whenever the route (pathname) changes.
 * Place this inside the router so it has access to location context.
 */
export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

  return null;
}

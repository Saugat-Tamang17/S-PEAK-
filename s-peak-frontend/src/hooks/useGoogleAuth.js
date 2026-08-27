// hooks/useGoogleAuth.js
import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
let isInitialized = false; // Prevent re-initializing globally

export function useGoogleAuth(onCredential) {
  const googleButtonRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function init() {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;

      if (!isInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onCredential(response.credential),
        });
        isInitialized = true;
      }

      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: 360,
      });

      setReady(true);
    }

    if (window.google?.accounts?.id) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          init();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  return { googleButtonRef, ready };
}
import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Wires up Google Identity Services (the "Sign In With Google" ID-token
 * flow) to Google's official button. The button must remain visible and be
 * clicked by the user; browser security prevents forwarding a click from a
 * custom button into Google's iframe.
 *
 * @param {(idToken: string) => void} onCredential - called with the raw
 *   Google ID token once the user completes sign-in.
 */
export function useGoogleAuth(onCredential) {
  const googleButtonRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn(
        "VITE_GOOGLE_CLIENT_ID is not set — Google sign-in is disabled."
      );
      return;
    }

    let interval;

    function init() {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });

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
      // The gsi/client script tag lives in index.html; wait for it to load.
      interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          init();
        }
      }, 200);
    }

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { googleButtonRef, ready };
}

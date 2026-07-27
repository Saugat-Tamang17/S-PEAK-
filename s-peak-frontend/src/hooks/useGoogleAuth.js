import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Wires up Google Identity Services (the "Sign In With Google" ID-token
 * flow) to our own "Continue with Google" button.
 *
 * Google requires their own button to actually be present and clicked to
 * reliably trigger the consent popup (One Tap via prompt() alone can be
 * silently suppressed). So we render Google's real button into a hidden
 * container and forward clicks from our custom button to it.
 *
 * @param {(idToken: string) => void} onCredential - called with the raw
 *   Google ID token once the user completes sign-in.
 */
export function useGoogleAuth(onCredential) {
  const hiddenButtonRef = useRef(null);
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
      if (!window.google?.accounts?.id || !hiddenButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });

      window.google.accounts.id.renderButton(hiddenButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
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

  const triggerGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn("Google sign-in is not configured.");
      return;
    }
    // Programmatically click the real (hidden) Google button so the
    // standard account chooser/consent popup opens.
    const realButton = hiddenButtonRef.current?.querySelector(
      'div[role="button"]'
    );
    realButton?.click();
  };

  return { hiddenButtonRef, triggerGoogleSignIn, ready };
}
export default function SocialAuthDivider({ googleButtonRef, googleReady }) {
  return (
    <>
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#E4E9E5]" />
        <span className="text-[12px] text-[#8A9490]">or continue with</span>
        <div className="h-px flex-1 bg-[#E4E9E5]" />
      </div>

      <div ref={googleButtonRef} className="flex justify-center" />
      {!googleReady && (
        <p className="mt-2 text-center text-xs text-[#8A9490]">
          Loading Google sign-in…
        </p>
      )}
    </>
  );
}

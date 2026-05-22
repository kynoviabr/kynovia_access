"use client";

type ScrollToTopSubmitButtonProps = {
  children: string;
};

export function ScrollToTopSubmitButton({ children }: ScrollToTopSubmitButtonProps) {
  return (
    <button
      type="submit"
      onClick={() => {
        sessionStorage.setItem("kynovia-scroll-top-after-submit", "true");
        window.scrollTo({ behavior: "smooth", top: 0 });
      }}
    >
      {children}
    </button>
  );
}

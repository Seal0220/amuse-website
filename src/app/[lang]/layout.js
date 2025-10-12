'use client';

import { useLocaleRedirect } from "../hooks/useLocale";

export default function RedirectLayout({ children, params }) {
  useLocaleRedirect();

  return (
    <>
      {children}
    </>
  );
}

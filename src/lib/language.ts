export type SupportedLanguage = "de" | "en";

export function languageFromPath(pathname: string): SupportedLanguage {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "de";
}

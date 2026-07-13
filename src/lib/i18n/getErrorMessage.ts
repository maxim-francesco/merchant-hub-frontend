import { ro } from "./ro";

export function getErrorMessage(err: unknown): string {
  const code = (err as any)?.response?.data?.code;
  if (code && typeof code === "string" && code in ro.errors) {
    return ro.errors[code as keyof typeof ro.errors];
  }
  return ro.errors.GENERIC;
}

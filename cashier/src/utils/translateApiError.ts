import i18n from "../i18n";
import { ApiError } from "../services/api";

export function translateApiError(
  err: unknown,
  fallbackKey = "errors:REQUEST_FAILED"
): string {
  if (err instanceof ApiError) {
    if (err.code) {
      return i18n.t(`errors:${err.code}`, {
        defaultValue: err.message,
        ...(err.params || {}),
      });
    }
    return err.message || i18n.t(fallbackKey);
  }
  if (err instanceof Error) {
    return err.message;
  }
  return i18n.t(fallbackKey);
}

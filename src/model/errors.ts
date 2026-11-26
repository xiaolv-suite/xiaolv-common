/** Convert any JavaScript thrown value into stable user-visible text. */
export function toErrorMessage(error: unknown, fallback = "Unknown error"): string {
    try {
        if (error instanceof Error) return error.message || error.name || fallback;
        if (typeof error === "string") return error || fallback;
        if (error && typeof error === "object") {
            let message: unknown;
            try {
                message = (error as {message?: unknown}).message;
            } catch {
                // A throwing getter is still a valid thrown value.
            }
            if (typeof message === "string" && message) return message;
            try {
                const serialized = JSON.stringify(error);
                if (serialized) return serialized;
            } catch {
                // Fall through to String() for circular or hostile objects.
            }
        }
        const text = String(error);
        return text || fallback;
    } catch {
        // Proxies can throw during instanceof, property access, serialization,
        // or coercion. The error path must never hide the original operation.
        return fallback;
    }
}

/** Read optional metadata from a thrown value without trusting getters/proxies. */
export function getErrorProperty(error: unknown, key: string): unknown {
    try {
        if (!error || (typeof error !== "object" && typeof error !== "function")) return undefined;
        return (error as Record<string, unknown>)[key];
    } catch {
        return undefined;
    }
}

/** Map AiUnavailableError reasons to localized user guidance without pulling service dependencies. */
export function formatAiError(
    error: unknown,
    t: (key: string, ...args: string[]) => string,
    maxContentChars = 4000,
): string {
    const name = getErrorProperty(error, "name");
    if (name === "AiUnavailableError") {
        const reason = getErrorProperty(error, "reason");
        switch (reason) {
            case "disabled": return t("aiDisabled");
            case "not-configured": return t("aiNotConfigured");
            case "empty-response": return t("aiEmpty");
            case "parse": return t("aiParseFailed");
            case "timeout": return t("aiTimeout");
            case "content-not-allowed": return t("aiContentNotAllowed");
            case "content-too-long": return t("aiContentTooLong", String(maxContentChars));
            case "transport": return t("aiTransport");
            case "cancelled": return t("aiCancelled");
        }
    }
    return toErrorMessage(error, t("aiTransport"));
}

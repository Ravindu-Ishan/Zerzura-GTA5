import { useEffect } from "react";

/**
 * Bridge between this NUI page and the Lua client script. Standard FiveM NUI pattern:
 * `window.invokeNative` only exists inside the game's CEF browser, never in a normal browser,
 * so we use its absence to detect local `next dev` and fall back to mock responses instead of
 * making a real fetch() that would just hang.
 */

export function isEnvBrowser(): boolean {
  return !(window as unknown as { invokeNative?: unknown }).invokeNative;
}

function resourceName(): string {
  return (window as unknown as { GetParentResourceName?: () => string })
    .GetParentResourceName?.() ?? "z-player-charcreation";
}

/**
 * Calls a Lua-registered NUI callback and returns its response.
 * @param mockData returned instead of a real fetch() when running in a plain browser (`next dev`).
 */
export async function fetchNui<T = unknown>(
  eventName: string,
  data: object = {},
  mockData?: T
): Promise<T> {
  if (isEnvBrowser()) {
    if (mockData !== undefined) return mockData;
    // eslint-disable-next-line no-console
    console.log(`[nui mock] ${eventName}`, data);
    return {} as T;
  }

  const response = await fetch(`https://${resourceName()}/${eventName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(data),
  });

  return response.json() as Promise<T>;
}

/** React hook: subscribes to `SendNUIMessage` calls from Lua whose `action` matches. */
export function useNuiEvent<T = unknown>(
  action: string,
  handler: (payload: T) => void
) {
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.data?.action === action) {
        handler(event.data.payload as T);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);
}

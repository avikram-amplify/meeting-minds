declare const __WS_BASE_URL__: string;

export function getWebSocketUrl(): string {
  if (__WS_BASE_URL__.startsWith("ws://") || __WS_BASE_URL__.startsWith("wss://")) {
    return __WS_BASE_URL__;
  }
  if (__WS_BASE_URL__.startsWith("http://")) {
    return __WS_BASE_URL__.replace("http://", "ws://");
  }
  if (__WS_BASE_URL__.startsWith("https://")) {
    return __WS_BASE_URL__.replace("https://", "wss://");
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  if (__WS_BASE_URL__.startsWith("/")) {
    return `${protocol}//${window.location.host}${__WS_BASE_URL__}`;
  }
  return `${protocol}//${window.location.host}/${__WS_BASE_URL__}`;
}

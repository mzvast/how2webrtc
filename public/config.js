let isDebug = false;
isDebug = true;
export const socketUrl = `ws${isDebug ? "" : "s"}://${location.host}/ws`;

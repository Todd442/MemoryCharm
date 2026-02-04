/**
 * Persistent debug logger that survives page redirects.
 * Logs to both console and sessionStorage for debugging auth flows.
 */

const DEBUG_LOG_KEY = "mc.debugLog";
const MAX_LOGS = 50;

export function debugLog(label: string, ...args: any[]) {
  const message = `[${new Date().toLocaleTimeString()}] ${label}: ${args.map(a => JSON.stringify(a, null, 0)).join(" ")}`;
  console.log(message);

  try {
    const existing = sessionStorage.getItem(DEBUG_LOG_KEY);
    const logs = existing ? JSON.parse(existing) : [];
    logs.push(message);
    
    // Keep only last MAX_LOGS
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }
    
    sessionStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to write debug log", e);
  }
}

export function getDebugLogs(): string[] {
  try {
    const existing = sessionStorage.getItem(DEBUG_LOG_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    return [];
  }
}

export function clearDebugLogs() {
  sessionStorage.removeItem(DEBUG_LOG_KEY);
}

export function displayDebugLogs() {
  const logs = getDebugLogs();
  console.group("🔍 MemoryCharm Debug Logs");
  logs.forEach(log => console.log(log));
  console.groupEnd();
  return logs;
}

// Make debug functions globally accessible
(window as any).debugLogs = displayDebugLogs;

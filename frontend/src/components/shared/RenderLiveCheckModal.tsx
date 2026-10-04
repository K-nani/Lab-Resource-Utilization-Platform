
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Server,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Clock,
  Sparkles,
  Wifi,
} from "lucide-react";

interface RenderLiveCheckModalProps {
  open: boolean;
  onClose: () => void;
  renderUrl?: string;
  onLiveConfirmed?: () => void;
}

export function RenderLiveCheckModal({
  open,
  onClose,
  renderUrl = "https://lab-resource-utilization-platform.onrender.com/",
  onLiveConfirmed,
}: RenderLiveCheckModalProps) {
  const [status, setStatus] = React.useState<
    "checking" | "connected" | "error"
  >("checking");

  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [latency, setLatency] = React.useState<number | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const cleanUrl = React.useMemo(
    () => renderUrl.replace(/\/+$/, ""),
    [renderUrl]
  );

  // Keep the latest callback without restarting polling.
  const onLiveConfirmedRef = React.useRef(onLiveConfirmed);

  React.useEffect(() => {
    onLiveConfirmedRef.current = onLiveConfirmed;
  }, [onLiveConfirmed]);

  // Check ONLY the institutions API.
  // Any HTTP response means the server responded.
  const pingBackend = React.useCallback(
    async (): Promise<boolean> => {
      const startTime = Date.now();
      const controller = new AbortController();

      const timeoutId = window.setTimeout(() => {
        controller.abort();
      }, 15000);

      try {
        const response = await fetch(
          `${cleanUrl}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json, text/plain, */*",
            },
            signal: controller.signal,
            cache: "no-store",
          }
        );

        setLatency(Date.now() - startTime);

        console.log(
          "Server responded:",
          response.status
        );

        return true;
      } catch (error) {
        console.error(
          "Server connection failed:",
          error
        );

        return false;
      } finally {
        window.clearTimeout(timeoutId);
      }
    },
    [cleanUrl]
  );

  // Polling effect
  React.useEffect(() => {
    if (!open) return;

    let isMounted = true;
    let attempts = 0;
    let pollTimeout: number | undefined;

    const MAX_ATTEMPTS = 20;
    const RETRY_DELAY = 3500;

    const startTime = Date.now();

    setStatus("checking");
    setElapsedSeconds(0);
    setLatency(null);

    const timerInterval = window.setInterval(() => {
      if (isMounted) {
        setElapsedSeconds(
          Math.floor((Date.now() - startTime) / 1000)
        );
      }
    }, 500);

    const checkLoop = async () => {
      if (!isMounted) return;

      attempts += 1;

      const isOnline = await pingBackend();

      if (!isMounted) return;

      if (isOnline) {
        setStatus("connected");
        window.clearInterval(timerInterval);

        onLiveConfirmedRef.current?.();
        return;
      }

      if (attempts < MAX_ATTEMPTS) {
        pollTimeout = window.setTimeout(() => {
          void checkLoop();
        }, RETRY_DELAY);
      } else {
        setStatus("error");
        window.clearInterval(timerInterval);
      }
    };

    void checkLoop();

    return () => {
      isMounted = false;
      window.clearInterval(timerInterval);

      if (pollTimeout !== undefined) {
        window.clearTimeout(pollTimeout);
      }
    };
  }, [open, retryCount, pingBackend]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-background border border-border/70 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden text-foreground">
        {/* Top ambient glow */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 transition-colors duration-500 ${
            status === "connected"
              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
              : status === "error"
                ? "bg-gradient-to-r from-rose-500 to-red-500"
                : "bg-gradient-to-r from-amber-500 via-violet-500 to-purple-500"
          }`}
        />

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
              status === "connected"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : status === "error"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
            }`}
          >
            {status === "connected" ? (
              <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
            ) : status === "error" ? (
              <AlertCircle className="size-6 text-rose-600 dark:text-rose-400" />
            ) : (
              <Server className="size-6 text-violet-600 dark:text-violet-400 animate-pulse" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold tracking-tight">
              Backend Connection Check
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Checking Render backend server status
            </p>
          </div>
        </div>

        {/* Backend URL Display */}
        <div className="mb-4 rounded-xl border border-border/70 bg-muted/50 p-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <Wifi className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-mono truncate font-medium text-foreground text-[11px] sm:text-xs">
              {renderUrl}
            </span>
          </div>

          <a
            href={renderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
            title="Open backend URL in new tab"
          >
            <span>Open</span>
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Status Body */}
        <div className="mb-6">
          {/* Checking */}
          {status === "checking" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
                  <Loader2 className="size-4 animate-spin text-amber-600 dark:text-amber-400" />
                  <span>Checking Connection...</span>
                </div>

                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-800 dark:text-amber-300 font-mono text-xs"
                >
                  <Clock className="size-3 mr-1" />
                  {elapsedSeconds}s
                </Badge>
              </div>

              <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                Checking the server. Render
                free-tier instances may take 30–60 seconds
                to start. Please wait while the server
                responds...
              </p>

              <div className="w-full bg-amber-200/50 dark:bg-amber-950/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}

          {/* Connected */}
          {status === "connected" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2.5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Connection is Live!</span>
                </div>

                {latency !== null && (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-xs shadow-xs">
                    {latency}ms
                  </Badge>
                )}
              </div>

              <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
                The server returned an HTTP response. The backend is reachable.
                The OK button below is now enabled.
              </p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-semibold text-sm">
                  <AlertCircle className="size-5 text-rose-600 dark:text-rose-400" />
                  <span>Connection Timeout</span>
                </div>

                <Badge
                  variant="outline"
                  className="border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs"
                >
                  Offline / Unreachable
                </Badge>
              </div>

              <p className="text-xs text-rose-900/90 dark:text-rose-200/90 leading-relaxed">
                The server did not return
                a readable HTTP response after multiple
                attempts. Check your backend or network
                connection and try again.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="rounded-lg h-8 text-xs border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950/50"
                >
                  <RefreshCw className="size-3.5 mr-1.5" />
                  Retry Connection
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="rounded-lg h-8 text-xs text-muted-foreground ml-auto"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
          <Button
            type="button"
            disabled={status !== "connected"}
            onClick={onClose}
            className={`w-full sm:w-auto min-w-[120px] rounded-xl font-semibold shadow-sm transition-all duration-300 ${
              status === "connected"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 shadow-md cursor-pointer hover:scale-[1.02]"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            {status === "checking" ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                OK (Checking...)
              </>
            ) : status === "connected" ? (
              <>
                <Sparkles className="size-4 mr-1.5" />
                OK
              </>
            ) : (
              "OK"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
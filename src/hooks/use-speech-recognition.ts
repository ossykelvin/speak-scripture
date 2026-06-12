/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useRef, useCallback, useEffect } from "react";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";

interface UseSpeechRecognitionOptions {
  onTranscript: (text: string) => void;
  continuous?: boolean;
}

export function useSpeechRecognition({ onTranscript, continuous = true }: UseSpeechRecognitionOptions) {
  const isNative = Capacitor.isNativePlatform();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef("");
  const nativeTranscriptRef = useRef("");
  const nativeListenersRef = useRef<PluginListenerHandle[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldRestartRef = useRef(false);
  const nativeSessionActiveRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const clearTimer = () => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  };

  const flushTranscript = () => {
    clearTimer();
    const transcript = isNative ? nativeTranscriptRef.current : accumulatedRef.current;
    if (transcript.trim()) onTranscriptRef.current(transcript.trim());
    if (isNative) nativeTranscriptRef.current = "";
    else accumulatedRef.current = "";
  };

  useEffect(() => {
    if (!isNative) {
      const BrowserSpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!BrowserSpeechRecognition) setIsSupported(false);
      return;
    }

    let cancelled = false;
    void SpeechRecognition.available().then(({ available }) => {
      if (!cancelled) setIsSupported(available);
    });
    void Promise.all([
      SpeechRecognition.addListener("partialResults", (event) => {
        const currentSegment = event.matches?.[0] ?? "";
        if (event.isRestarting && currentSegment.trim()) {
          onTranscriptRef.current(currentSegment.trim());
          nativeTranscriptRef.current = "";
          return;
        }
        nativeTranscriptRef.current = currentSegment;
      }),
      SpeechRecognition.addListener("listeningState", (event) => {
        if (event.state === "started" || event.status === "started") setIsListening(true);
        if (event.state === "stopped" || event.status === "stopped") {
          flushTranscript();
          if (!nativeSessionActiveRef.current) {
            setIsListening(false);
          }
        }
      }),
      SpeechRecognition.addListener("error", (event) => {
        if (
          nativeSessionActiveRef.current
          && (event.code === "NO_MATCH" || event.code === "SPEECH_TIMEOUT")
        ) {
          return;
        }
        nativeSessionActiveRef.current = false;
        setError(`${event.message}. You can continue with manual text input.`);
        setIsListening(false);
      }),
    ]).then((listeners) => {
      if (cancelled) listeners.forEach((listener) => void listener.remove());
      else nativeListenersRef.current = listeners;
    });

    return () => {
      cancelled = true;
      nativeListenersRef.current.forEach((listener) => void listener.remove());
      nativeListenersRef.current = [];
    };
  }, [isNative]);

  const startBrowser = useCallback(() => {
    const BrowserSpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!BrowserSpeechRecognition || recognitionRef.current) return;

    const recognition = new BrowserSpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    shouldRestartRef.current = true;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) transcript += `${event.results[index][0].transcript} `;
      }
      if (!transcript.trim()) return;
      accumulatedRef.current += transcript;
      clearTimer();
      flushTimerRef.current = setTimeout(flushTranscript, 3000);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") return;
      setError(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone access was denied. Allow microphone permission in browser settings."
          : `Speech recognition stopped: ${event.error}. You can continue with manual text input.`,
      );
      shouldRestartRef.current = false;
      recognitionRef.current = null;
      clearTimer();
      setIsListening(false);
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // The browser can reject an immediate restart.
        }
      }
      recognitionRef.current = null;
      clearTimer();
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [continuous]);

  const start = useCallback(() => {
    setError(null);
    if (!isNative) {
      startBrowser();
      return;
    }

    void (async () => {
      try {
        const permission = await SpeechRecognition.requestPermissions();
        if (permission.speechRecognition !== "granted") {
          setError("Microphone permission is required. Enable it in Android settings or use manual text input.");
          return;
        }
        nativeTranscriptRef.current = "";
        nativeSessionActiveRef.current = true;
        await SpeechRecognition.setPTTState({ held: true });
        await SpeechRecognition.start({
          language: "en-US",
          maxResults: 3,
          partialResults: true,
          popup: false,
          allowForSilence: 3000,
          continuousPTT: true,
        });
        setIsListening(true);
      } catch (nativeError) {
        nativeSessionActiveRef.current = false;
        await SpeechRecognition.setPTTState({ held: false }).catch(() => undefined);
        setError(nativeError instanceof Error ? nativeError.message : "Unable to start native speech recognition.");
        setIsListening(false);
      }
    })();
  }, [isNative, startBrowser]);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    if (isNative) {
      nativeSessionActiveRef.current = false;
      void SpeechRecognition.setPTTState({ held: false })
        .then(() => SpeechRecognition.forceStop())
        .catch((nativeError) => console.error("Unable to stop native speech recognition:", nativeError))
        .finally(() => {
          flushTranscript();
          setIsListening(false);
        });
      return;
    }

    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    flushTranscript();
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // Recognition may already be stopped.
      }
    }
    setIsListening(false);
  }, [isNative]);

  useEffect(() => () => {
    shouldRestartRef.current = false;
    nativeSessionActiveRef.current = false;
    clearTimer();
    if (isNative) {
      void SpeechRecognition.setPTTState({ held: false })
        .then(() => SpeechRecognition.forceStop())
        .catch(() => undefined);
      return;
    }
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // Recognition may already be stopped.
      }
    }
  }, [isNative]);

  return { isListening, isSupported, error, start, stop, clearError: () => setError(null) };
}

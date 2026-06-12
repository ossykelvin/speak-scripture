import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

const { listeners, speechRecognition } = vi.hoisted(() => {
  const nativeListeners = new Map<string, (event: Record<string, unknown>) => void>();
  return {
    listeners: nativeListeners,
    speechRecognition: {
      available: vi.fn().mockResolvedValue({ available: true }),
      addListener: vi.fn(async (eventName: string, listener: (event: Record<string, unknown>) => void) => {
        nativeListeners.set(eventName, listener);
        return { remove: vi.fn().mockResolvedValue(undefined) };
      }),
      requestPermissions: vi.fn().mockResolvedValue({ speechRecognition: "granted" }),
      setPTTState: vi.fn().mockResolvedValue(undefined),
      start: vi.fn().mockResolvedValue(undefined),
      forceStop: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true },
}));

vi.mock("@capgo/capacitor-speech-recognition", () => ({
  SpeechRecognition: speechRecognition,
}));

describe("native speech recognition", () => {
  beforeEach(() => {
    listeners.clear();
    vi.clearAllMocks();
  });

  it("stays active across silence and stops only when requested", async () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onTranscript }));

    await waitFor(() => expect(speechRecognition.addListener).toHaveBeenCalledTimes(3));

    await act(async () => {
      result.current.start();
    });

    await waitFor(() => expect(speechRecognition.start).toHaveBeenCalledWith(
      expect.objectContaining({ continuousPTT: true, partialResults: true }),
    ));
    expect(speechRecognition.setPTTState).toHaveBeenCalledWith({ held: true });
    expect(result.current.isListening).toBe(true);

    act(() => {
      listeners.get("error")?.({
        code: "SPEECH_TIMEOUT",
        message: "No speech input",
        sessionId: 1,
      });
      listeners.get("partialResults")?.({
        matches: ["John 3:16"],
        isRestarting: true,
      });
    });

    expect(result.current.isListening).toBe(true);
    expect(result.current.error).toBeNull();
    expect(onTranscript).toHaveBeenCalledWith("John 3:16");

    await act(async () => {
      result.current.stop();
    });

    await waitFor(() => expect(speechRecognition.forceStop).toHaveBeenCalled());
    expect(speechRecognition.setPTTState).toHaveBeenLastCalledWith({ held: false });
    expect(result.current.isListening).toBe(false);
  });

  it("explains denied permission and does not start listening", async () => {
    speechRecognition.requestPermissions.mockResolvedValueOnce({ speechRecognition: "denied" });
    const { result } = renderHook(() => useSpeechRecognition({ onTranscript: vi.fn() }));

    await waitFor(() => expect(speechRecognition.addListener).toHaveBeenCalledTimes(3));
    await act(async () => {
      result.current.start();
    });

    await waitFor(() => expect(result.current.error).toContain("Android settings"));
    expect(speechRecognition.start).not.toHaveBeenCalled();
    expect(result.current.isListening).toBe(false);
  });
});

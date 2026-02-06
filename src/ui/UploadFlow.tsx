/**
 * UPLOAD FLOW COMPONENT
 * =====================
 *
 * Orchestrates the image upload → scene generation flow.
 *
 * FLOW STATES:
 * 1. idle - Waiting for user to click "Upload" (blob must exist)
 * 2. loading - Upload in progress, showing loading animation
 * 3. success - Backend returned Scene JSON
 * 4. error - Upload failed
 *
 * Props:
 * - blob: Blob | null - The compressed photo to upload
 * - onRetake: () => void - Callback to return to photo capture
 * - onUploadStart: () => void - Callback when upload begins
 * - autoStart: boolean - If true, starts upload immediately
 * - demoRandom: boolean - 50/50 show success or error after real success
 * - mockMode: boolean - Return fake data instead of calling backend (for frontend testing)
 * - mockFallback: boolean - Try backend first, fall back to mock data on error (for demo)
 */

import { useState, useCallback, useEffect } from "react";
import {
    uploadImageForScene,
    SceneResponse,
    UploadError,
} from "../services/ai_proxy_service";
import { makeRequestId, formatNow } from "../services/request_trace";
import { UploadLoading } from "./screens/UploadLoading";
import { UploadSuccess } from "./screens/UploadSuccess";
import { UploadError as UploadErrorScreen } from "./screens/UploadError";
import "./UploadFlow.css";

type FlowState = "idle" | "loading" | "success" | "error";

interface UploadFlowProps {
    blob: Blob | null;
    onRetake: () => void;
    onUploadStart?: () => void;
    autoStart?: boolean;
    demoRandom?: boolean;
    mockMode?: boolean;
    mockFallback?: boolean;
}

// Mock response for testing without backend
const MOCK_SCENE_RESPONSE: SceneResponse = {
    version: 1,
    image: { w: 1024, h: 768 },
    detections: [
        { id: 'mock_1', type: 'object', label: 'table', confidence: 0.95 },
        { id: 'mock_2', type: 'object', label: 'chair', confidence: 0.88 },
    ],
    spawns: {
        player: { x: 0.1, y: 0.85 },
        exit: { x: 0.9, y: 0.2 },
        enemies: [
            { x: 0.5, y: 0.5, type: 'walker' },
            { x: 0.7, y: 0.3, type: 'jumper' },
        ],
        pickups: [
            { x: 0.3, y: 0.6, type: 'coin' },
            { x: 0.6, y: 0.4, type: 'health' },
        ],
    },
    surfaces: [
        { type: 'platform', points: [{ x: 0, y: 0.9 }, { x: 1, y: 0.9 }] },
    ],
    rules: [],
};

export function UploadFlow({
    blob,
    onRetake,
    onUploadStart,
    autoStart = false,
    demoRandom = false,
    mockMode = false,
    mockFallback = false,
}: UploadFlowProps) {
    const [state, setState] = useState<FlowState>(
        autoStart ? "loading" : "idle",
    );
    const [requestId, setRequestId] = useState<string>("");
    const [sceneData, setSceneData] = useState<SceneResponse | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [lastRealResponse, setLastRealResponse] =
        useState<SceneResponse | null>(null);
    const [showDebugResponse, setShowDebugResponse] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    const performUpload = useCallback(async () => {
        if (!blob) return;

        const newRequestId = makeRequestId();
        setRequestId(newRequestId);
        setState("loading");
        setError(null);

        console.info(`[${formatNow()}] Upload started: ${newRequestId}${mockMode ? ' (MOCK MODE)' : ''}`);

        // Mock mode: return fake data after a short delay
        if (mockMode) {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
            console.info(
                `[${formatNow()}] Mock response: ${newRequestId}`,
                `detections=${MOCK_SCENE_RESPONSE.detections.length}`,
                `enemies=${MOCK_SCENE_RESPONSE.spawns.enemies.length}`,
                `pickups=${MOCK_SCENE_RESPONSE.spawns.pickups.length}`,
            );
            setLastRealResponse(MOCK_SCENE_RESPONSE);
            setSceneData(MOCK_SCENE_RESPONSE);
            setState("success");
            return;
        }

        try {
            const response = await uploadImageForScene({
                blob,
                requestId: newRequestId,
            });

            // Store the real response for debug
            setLastRealResponse(response);

            console.info(
                `[${formatNow()}] Upload success: ${newRequestId}`,
                `detections=${response.detections.length}`,
                `enemies=${response.spawns.enemies.length}`,
                `pickups=${response.spawns.pickups.length}`,
            );

            // Apply demo mode logic - randomly show fake error for UI testing
            if (demoRandom) {
                // 50/50 chance to show error
                if (Math.random() < 0.5) {
                    console.info(
                        `[${formatNow()}] Demo mode: showing fake error`,
                    );
                    setError(new Error("Demo mode: simulated failure"));
                    setState("error");
                    return;
                }
            }

            setSceneData(response);
            setState("success");
        } catch (err) {
            const uploadErr = err as UploadError;
            console.error(
                `[${formatNow()}] Upload failed: ${newRequestId}`,
                uploadErr.message,
            );

            // Mock fallback: use mock data instead of showing error
            if (mockFallback) {
                console.info(
                    `[${formatNow()}] Mock fallback: using mock data after error`,
                );
                setLastRealResponse(MOCK_SCENE_RESPONSE);
                setSceneData(MOCK_SCENE_RESPONSE);
                setState("success");
                return;
            }

            setError(uploadErr);
            setState("error");
        }
    }, [blob, demoRandom, mockMode, mockFallback]);

    // Auto-start upload if requested
    useEffect(() => {
        if (autoStart && blob && !hasStarted) {
            setHasStarted(true);
            performUpload();
        }
    }, [autoStart, blob, hasStarted, performUpload]);

    const handleUpload = useCallback(() => {
        if (onUploadStart) {
            onUploadStart();
        }
        performUpload();
    }, [onUploadStart, performUpload]);

    const handleRetry = useCallback(() => {
        performUpload();
    }, [performUpload]);

    const handleUploadAgain = useCallback(() => {
        setState("idle");
        setSceneData(null);
        setError(null);
        setHasStarted(false);
    }, []);

    // No blob yet
    if (!blob) {
        return null;
    }

    return (
        <div className="upload-flow">
            <div className="upload-flow__content">
                {state === "idle" && (
                    <div className="upload-flow__idle">
                        <button
                            className="upload-flow__upload-button"
                            onClick={handleUpload}
                        >
                            ☁️ Upload & Generate Level
                        </button>
                    </div>
                )}

                {state === "loading" && <UploadLoading requestId={requestId} />}

                {state === "success" && sceneData && (
                    <UploadSuccess
                        requestId={requestId}
                        sceneData={sceneData}
                        onUploadAgain={handleUploadAgain}
                        onRetake={onRetake}
                    />
                )}

                {state === "error" && error && (
                    <>
                        <UploadErrorScreen
                            requestId={requestId}
                            error={
                                error as Error & {
                                    status?: number;
                                    responseText?: string;
                                }
                            }
                            onRetry={handleRetry}
                            onRetake={onRetake}
                        />

                        {/* Show last real response if in demo mode */}
                        {lastRealResponse && demoRandom && (
                            <div className="debug-response">
                                <button
                                    className="debug-response__toggle"
                                    onClick={() =>
                                        setShowDebugResponse(!showDebugResponse)
                                    }
                                >
                                    {showDebugResponse ? "▲" : "▼"} Last
                                    Response (debug)
                                </button>
                                {showDebugResponse && (
                                    <div className="debug-response__content">
                                        {JSON.stringify(
                                            lastRealResponse,
                                            null,
                                            2,
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}


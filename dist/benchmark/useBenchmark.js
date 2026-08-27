import { useEffect, useState, useCallback, useRef } from "react";
import { ErrorMessages } from "../errors/ErrorMessages";
import { autoScroll, Cancellable } from "./AutoScrollHelper";
import { JSFPSMonitor } from "./JSFPSMonitor";
/**
 * Runs the benchmark on FlashList.
 * Response object has a formatted string that can be printed to the console or shown as an alert.
 * Result is posted to the callback method passed to the hook.
 */
export function useBenchmark(flashListRef, callback, params = {}) {
    const [isBenchmarkRunning, setIsBenchmarkRunning] = useState(false);
    const cancellableRef = useRef(null);
    const startBenchmark = useCallback(() => {
        var _a;
        if (isBenchmarkRunning) {
            return;
        }
        const cancellable = new Cancellable();
        cancellableRef.current = cancellable;
        const suggestions = [];
        if (flashListRef.current) {
            if (!(Number((_a = flashListRef.current.props.data) === null || _a === void 0 ? void 0 : _a.length) > 0)) {
                throw new Error(ErrorMessages.dataEmptyCannotRunBenchmark);
            }
        }
        setIsBenchmarkRunning(true);
        const runBenchmark = async () => {
            const jsFPSMonitor = new JSFPSMonitor();
            jsFPSMonitor.startTracking();
            for (let i = 0; i < (params.repeatCount || 1); i++) {
                await runScrollBenchmark(flashListRef, cancellable, params.speedMultiplier || 1);
            }
            const jsProfilerResponse = jsFPSMonitor.stopAndGetData();
            if (jsProfilerResponse.averageFPS < 35) {
                suggestions.push(`Your average JS FPS is low. This can indicate that your components are doing too much work. Try to optimize your components and reduce re-renders if any`);
            }
            computeSuggestions(flashListRef, suggestions);
            const result = generateResult(jsProfilerResponse, suggestions, cancellable);
            if (!cancellable.isCancelled()) {
                result.formattedString = getFormattedString(result);
            }
            callback(result);
            setIsBenchmarkRunning(false);
        };
        runBenchmark();
    }, [
        callback,
        flashListRef,
        isBenchmarkRunning,
        params.repeatCount,
        params.speedMultiplier,
    ]);
    useEffect(() => {
        if (params.startManually) {
            return;
        }
        const cancelTimeout = setTimeout(() => {
            startBenchmark();
        }, params.startDelayInMs || 3000);
        return () => {
            clearTimeout(cancelTimeout);
            if (cancellableRef.current) {
                cancellableRef.current.cancel();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return { startBenchmark, isBenchmarkRunning };
}
export function getFormattedString(res) {
    var _a, _b, _c;
    return (`Results:\n\n` +
        `JS FPS: Avg: ${(_a = res.js) === null || _a === void 0 ? void 0 : _a.averageFPS} | Min: ${(_b = res.js) === null || _b === void 0 ? void 0 : _b.minFPS} | Max: ${(_c = res.js) === null || _c === void 0 ? void 0 : _c.maxFPS}\n\n` +
        `${res.suggestions.length > 0
            ? `Suggestions:\n\n${res.suggestions
                .map((value, index) => `${index + 1}. ${value}`)
                .join("\n")}`
            : ``}`);
}
function generateResult(jsProfilerResponse, suggestions, cancellable) {
    return {
        js: jsProfilerResponse,
        suggestions,
        interrupted: cancellable.isCancelled(),
    };
}
/**
 * Scrolls to the end of the list and then back to the top
 */
async function runScrollBenchmark(flashListRef, cancellable, scrollSpeedMultiplier) {
    if (flashListRef.current) {
        const horizontal = flashListRef.current.props.horizontal;
        const rv = flashListRef.current;
        if (rv) {
            const rvSize = rv.getWindowSize();
            const rvContentSize = rv.getChildContainerDimensions();
            const fromX = 0;
            const fromY = 0;
            const toX = rvContentSize.width - rvSize.width;
            const toY = rvContentSize.height - rvSize.height;
            const scrollNow = (x, y) => {
                var _a;
                (_a = flashListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
                    offset: horizontal ? x : y,
                    animated: false,
                });
            };
            await autoScroll(scrollNow, fromX, fromY, toX, toY, scrollSpeedMultiplier, cancellable);
            await autoScroll(scrollNow, toX, toY, fromX, fromY, scrollSpeedMultiplier, cancellable);
        }
    }
}
function computeSuggestions(flashListRef, suggestions) {
    if (flashListRef.current) {
        if (flashListRef.current.props.data.length < 200) {
            suggestions.push(`Data count is low. Try to increase it to a large number (e.g 200) using the 'useDataMultiplier' hook.`);
        }
    }
}
//# sourceMappingURL=useBenchmark.js.map
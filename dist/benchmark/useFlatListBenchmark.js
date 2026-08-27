import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorMessages } from "../errors/ErrorMessages";
import { autoScroll, Cancellable } from "./AutoScrollHelper";
import { JSFPSMonitor } from "./JSFPSMonitor";
import { getFormattedString, } from "./useBenchmark";
/**
 * Runs the benchmark on FlatList and calls the callback method with the result.
 * Target offset is mandatory in params.
 * It's recommended to remove pagination while running the benchmark. Removing the onEndReached callback is the easiest way to do that.
 */
export function useFlatListBenchmark(flatListRef, callback, params) {
    const [isBenchmarkRunning, setIsBenchmarkRunning] = useState(false);
    const cancellableRef = useRef(null);
    const startBenchmark = useCallback(() => {
        var _a;
        if (isBenchmarkRunning) {
            return;
        }
        const cancellable = new Cancellable();
        cancellableRef.current = cancellable;
        if (flatListRef.current && flatListRef.current.props) {
            if (!(Number((_a = flatListRef.current.props.data) === null || _a === void 0 ? void 0 : _a.length) > 0)) {
                throw new Error(ErrorMessages.dataEmptyCannotRunBenchmark);
            }
        }
        setIsBenchmarkRunning(true);
        const runBenchmark = async () => {
            const jsFPSMonitor = new JSFPSMonitor();
            jsFPSMonitor.startTracking();
            for (let i = 0; i < (params.repeatCount || 1); i++) {
                await runScrollBenchmark(flatListRef, params.targetOffset, cancellable, params.speedMultiplier || 1);
            }
            const jsProfilerResponse = jsFPSMonitor.stopAndGetData();
            const result = {
                js: jsProfilerResponse,
                suggestions: [],
                interrupted: cancellable.isCancelled(),
            };
            if (!cancellable.isCancelled()) {
                result.formattedString = getFormattedString(result);
            }
            callback(result);
            setIsBenchmarkRunning(false);
        };
        runBenchmark();
    }, [
        callback,
        flatListRef,
        isBenchmarkRunning,
        params.repeatCount,
        params.speedMultiplier,
        params.targetOffset,
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
/**
 * Scrolls to the target offset and then back to 0
 */
async function runScrollBenchmark(flatListRef, targetOffset, cancellable, scrollSpeedMultiplier) {
    var _a;
    if (flatListRef.current) {
        const horizontal = Boolean((_a = flatListRef.current.props) === null || _a === void 0 ? void 0 : _a.horizontal);
        const fromX = 0;
        const fromY = 0;
        const toX = horizontal ? targetOffset : 0;
        const toY = horizontal ? 0 : targetOffset;
        const scrollNow = (x, y) => {
            var _a;
            (_a = flatListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
                offset: horizontal ? x : y,
                animated: false,
            });
        };
        await autoScroll(scrollNow, fromX, fromY, toX, toY, scrollSpeedMultiplier, cancellable);
        await autoScroll(scrollNow, toX, toY, fromX, fromY, scrollSpeedMultiplier, cancellable);
    }
}
//# sourceMappingURL=useFlatListBenchmark.js.map
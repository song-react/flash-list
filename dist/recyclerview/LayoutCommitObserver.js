import React, { useLayoutEffect, useMemo, useRef } from "react";
import { RecyclerViewContextProvider, useRecyclerViewContext, } from "./RecyclerViewContextProvider";
import { useLayoutState } from "./hooks/useLayoutState";
/**
 * LayoutCommitObserver can be used to observe when FlashList commits a layout.
 * It is useful when your component has one or more FlashLists somewhere down the tree.
 * LayoutCommitObserver will trigger `onCommitLayoutEffect` when all of the FlashLists in the tree have finished their first commit.
 */
export const LayoutCommitObserver = React.memo((props) => {
    const { children, onCommitLayoutEffect } = props;
    const parentRecyclerViewContext = useRecyclerViewContext();
    const [_, setRenderId] = useLayoutState(0);
    const pendingChildIds = useRef(new Set()).current;
    useLayoutEffect(() => {
        if (pendingChildIds.size > 0) {
            return;
        }
        onCommitLayoutEffect === null || onCommitLayoutEffect === void 0 ? void 0 : onCommitLayoutEffect();
    });
    // Create context for child components
    const recyclerViewContext = useMemo(() => {
        return {
            layout: () => {
                setRenderId((prev) => prev + 1);
            },
            getRef: () => {
                var _a;
                return (_a = parentRecyclerViewContext === null || parentRecyclerViewContext === void 0 ? void 0 : parentRecyclerViewContext.getRef()) !== null && _a !== void 0 ? _a : null;
            },
            getParentRef: () => {
                var _a;
                return (_a = parentRecyclerViewContext === null || parentRecyclerViewContext === void 0 ? void 0 : parentRecyclerViewContext.getParentRef()) !== null && _a !== void 0 ? _a : null;
            },
            getParentScrollViewRef: () => {
                var _a;
                return (_a = parentRecyclerViewContext === null || parentRecyclerViewContext === void 0 ? void 0 : parentRecyclerViewContext.getParentScrollViewRef()) !== null && _a !== void 0 ? _a : null;
            },
            getScrollViewRef: () => {
                var _a;
                return (_a = parentRecyclerViewContext === null || parentRecyclerViewContext === void 0 ? void 0 : parentRecyclerViewContext.getScrollViewRef()) !== null && _a !== void 0 ? _a : null;
            },
            markChildLayoutAsPending: (id) => {
                parentRecyclerViewContext === null || parentRecyclerViewContext === void 0 ? void 0 : parentRecyclerViewContext.markChildLayoutAsPending(id);
                pendingChildIds.add(id);
            },
            unmarkChildLayoutAsPending: (id) => {
                parentRecyclerViewContext === null || parentRecyclerViewContext === void 0 ? void 0 : parentRecyclerViewContext.unmarkChildLayoutAsPending(id);
                if (pendingChildIds.has(id)) {
                    pendingChildIds.delete(id);
                    recyclerViewContext.layout();
                }
            },
        };
    }, [parentRecyclerViewContext, pendingChildIds, setRenderId]);
    return (React.createElement(RecyclerViewContextProvider, { value: recyclerViewContext }, children));
});
LayoutCommitObserver.displayName = "LayoutCommitObserver";
//# sourceMappingURL=LayoutCommitObserver.js.map
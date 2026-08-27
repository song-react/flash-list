/**
 * StickyHeaders component manages the sticky header behavior in a FlashList.
 * It handles the animation and positioning of headers that should remain fixed
 * at the top of the list while scrolling.
 */
import React, { useRef, useState, useMemo, useImperativeHandle, useCallback, useEffect, } from "react";
import { PlatformConfig } from "../../native/config/PlatformHelper";
import { ViewHolder } from "../ViewHolder";
import { CompatAnimatedView } from "./CompatView";
export const StickyHeaders = ({ stickyHeaderIndices, stickyHeaderOffset, renderItem, stickyHeaderRef, recyclerViewManager, scrollY, data, extraData, onChangeStickyIndex, inverted, stickyHeaderZIndex = 2, }) => {
    const [stickyHeaderState, setStickyHeaderState] = useState({
        currentStickyIndex: -1,
        pushStartsAt: Number.MAX_SAFE_INTEGER,
    });
    const { currentStickyIndex, pushStartsAt } = stickyHeaderState;
    // sort indices and memoize compute
    const sortedIndices = useMemo(() => {
        return [...stickyHeaderIndices].sort((first, second) => first - second);
    }, [stickyHeaderIndices]);
    const lengthInvalid = sortedIndices.length === 0 ||
        recyclerViewManager.getDataLength() <=
            sortedIndices[sortedIndices.length - 1];
    const compute = useCallback(() => {
        var _a, _b, _c, _d, _e, _f;
        if (lengthInvalid) {
            return;
        }
        const adjustedScrollOffset = recyclerViewManager.getLastScrollOffset();
        // Binary search for current sticky index
        const currentIndexInArray = findCurrentStickyIndex(sortedIndices, adjustedScrollOffset + stickyHeaderOffset, (index) => recyclerViewManager.getLayout(index).y);
        const newStickyIndex = (_a = sortedIndices[currentIndexInArray]) !== null && _a !== void 0 ? _a : -1;
        let newNextStickyIndex = (_b = sortedIndices[currentIndexInArray + 1]) !== null && _b !== void 0 ? _b : -1;
        if (newNextStickyIndex > recyclerViewManager.getEngagedIndices().endIndex) {
            newNextStickyIndex = -1;
        }
        // Calculate when the next sticky header should start pushing the current one
        // The next header starts pushing when it reaches the bottom of the current sticky header
        const newNextStickyY = newNextStickyIndex === -1
            ? Number.MAX_SAFE_INTEGER
            : ((_d = (_c = recyclerViewManager.tryGetLayout(newNextStickyIndex)) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : 0) +
                recyclerViewManager.firstItemOffset;
        const newCurrentStickyHeight = (_f = (_e = recyclerViewManager.tryGetLayout(newStickyIndex)) === null || _e === void 0 ? void 0 : _e.height) !== null && _f !== void 0 ? _f : 0;
        // Push should start when the next header reaches the bottom of the current sticky header
        const newPushStartsAt = newNextStickyY - newCurrentStickyHeight;
        if (newStickyIndex !== currentStickyIndex ||
            newPushStartsAt !== pushStartsAt) {
            setStickyHeaderState({
                currentStickyIndex: newStickyIndex,
                pushStartsAt: newPushStartsAt - stickyHeaderOffset,
            });
        }
        if (newStickyIndex !== currentStickyIndex) {
            onChangeStickyIndex === null || onChangeStickyIndex === void 0 ? void 0 : onChangeStickyIndex(newStickyIndex);
        }
    }, [
        lengthInvalid,
        recyclerViewManager,
        sortedIndices,
        currentStickyIndex,
        pushStartsAt,
        onChangeStickyIndex,
        stickyHeaderOffset,
    ]);
    useEffect(() => {
        compute();
    }, [compute]);
    // Optimized scroll handler using binary search pattern
    useImperativeHandle(stickyHeaderRef, () => ({
        reportScrollEvent: () => {
            compute();
        },
    }), [compute]);
    const refHolder = useRef(new Map()).current;
    const { translateY, opacity } = useMemo(() => {
        var _a, _b;
        const currentStickyHeight = (_b = (_a = recyclerViewManager.tryGetLayout(currentStickyIndex)) === null || _a === void 0 ? void 0 : _a.height) !== null && _b !== void 0 ? _b : 0;
        return {
            translateY: scrollY.interpolate({
                inputRange: [pushStartsAt, pushStartsAt + currentStickyHeight],
                outputRange: [0, -currentStickyHeight],
                extrapolate: "clamp",
            }),
            opacity: stickyHeaderOffset > 0
                ? scrollY.interpolate({
                    inputRange: [pushStartsAt, pushStartsAt + currentStickyHeight],
                    outputRange: [1, 0],
                    extrapolate: "clamp",
                })
                : undefined,
        };
    }, [
        recyclerViewManager,
        currentStickyIndex,
        scrollY,
        pushStartsAt,
        stickyHeaderOffset,
    ]);
    // Memoize header content
    const headerContent = useMemo(() => {
        return (React.createElement(CompatAnimatedView, { style: {
                position: "absolute",
                top: stickyHeaderOffset,
                left: 0,
                right: 0,
                zIndex: stickyHeaderZIndex,
                transform: [{ translateY }],
                opacity,
            } }, currentStickyIndex !== -1 && currentStickyIndex < data.length ? (React.createElement(ViewHolder, { index: currentStickyIndex, item: data[currentStickyIndex], renderItem: renderItem, layout: { x: 0, y: 0, width: 0, height: 0 }, refHolder: refHolder, extraData: extraData, trailingItem: null, target: "StickyHeader", hidden: false, inverted: inverted })) : null));
    }, [
        translateY,
        opacity,
        currentStickyIndex,
        data,
        renderItem,
        refHolder,
        extraData,
        stickyHeaderOffset,
        stickyHeaderZIndex,
        inverted,
    ]);
    if (PlatformConfig.isRN083OrAbove && currentStickyIndex === -1) {
        return null;
    }
    return headerContent;
};
/**
 * Binary search utility to find the current sticky header index based on scroll position
 * @param sortedIndices - Array of indices sorted by Y position
 * @param adjustedValue - Current scroll position
 * @param getY - Function to get Y position for an index
 * @returns Index of the current sticky header
 */
function findCurrentStickyIndex(sortedIndices, adjustedValue, getY) {
    let left = 0;
    let right = sortedIndices.length - 1;
    let result = -1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const currentY = getY(sortedIndices[mid]);
        if (currentY <= adjustedValue) {
            result = mid;
            left = mid + 1;
        }
        else {
            right = mid - 1;
        }
    }
    return result;
}
//# sourceMappingURL=StickyHeaders.js.map
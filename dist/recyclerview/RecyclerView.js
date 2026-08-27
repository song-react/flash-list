/**
 * RecyclerView is a high-performance list component that efficiently renders and recycles list items.
 * It's designed to handle large lists with optimal memory usage and smooth scrolling.
 */
import React, { useCallback, useLayoutEffect, useMemo, useRef, forwardRef, useState, useId, } from "react";
import { Animated, I18nManager, } from "react-native";
import { ErrorMessages } from "../errors/ErrorMessages";
import { WarningMessages } from "../errors/WarningMessages";
import { areDimensionsNotEqual, measureFirstChildLayout, measureItemLayout, measureParentSize, } from "./utils/measureLayout";
import { RecyclerViewContextProvider, useRecyclerViewContext, } from "./RecyclerViewContextProvider";
import { useLayoutState } from "./hooks/useLayoutState";
import { useRecyclerViewManager } from "./hooks/useRecyclerViewManager";
import { useOnListLoad } from "./hooks/useOnLoad";
import { ViewHolderCollection, } from "./ViewHolderCollection";
import { CompatView } from "./components/CompatView";
import { useBoundDetection } from "./hooks/useBoundDetection";
import { adjustOffsetForRTL } from "./utils/adjustOffsetForRTL";
import { useSecondaryProps } from "./hooks/useSecondaryProps";
import { getInvertedTransformStyle } from "./utils/getInvertedTransformStyle";
import { StickyHeaders } from "./components/StickyHeaders";
import { ScrollAnchor } from "./components/ScrollAnchor";
import { useRecyclerViewController } from "./hooks/useRecyclerViewController";
import { RenderTimeTracker } from "./helpers/RenderTimeTracker";
/**
 * Main RecyclerView component that handles list rendering, scrolling, and item recycling.
 * @template T - The type of items in the list
 */
const RecyclerViewComponent = (props, ref) => {
    var _a, _b, _c, _d, _e;
    // Destructure props and initialize refs
    const { horizontal, renderItem, data, extraData, onLoad, CellRendererComponent, overrideProps, refreshing, onRefresh, progressViewOffset, ListEmptyComponent, ListHeaderComponent, ListHeaderComponentStyle, ListFooterComponent, ListFooterComponentStyle, ItemSeparatorComponent, renderScrollComponent, style, stickyHeaderIndices, maintainVisibleContentPosition, onCommitLayoutEffect, onChangeStickyIndex, stickyHeaderConfig, inverted, ...rest } = props;
    const [renderTimeTracker] = useState(() => new RenderTimeTracker());
    renderTimeTracker.startTracking();
    // Sticky header config
    const stickyHeaderOffset = (_a = stickyHeaderConfig === null || stickyHeaderConfig === void 0 ? void 0 : stickyHeaderConfig.offset) !== null && _a !== void 0 ? _a : 0;
    const stickyHeaderUseNativeDriver = (_b = stickyHeaderConfig === null || stickyHeaderConfig === void 0 ? void 0 : stickyHeaderConfig.useNativeDriver) !== null && _b !== void 0 ? _b : true;
    const stickyHeaderHideRelatedCell = (_c = stickyHeaderConfig === null || stickyHeaderConfig === void 0 ? void 0 : stickyHeaderConfig.hideRelatedCell) !== null && _c !== void 0 ? _c : false;
    const stickyHeaderZIndex = (_d = stickyHeaderConfig === null || stickyHeaderConfig === void 0 ? void 0 : stickyHeaderConfig.zIndex) !== null && _d !== void 0 ? _d : 2;
    // Compute the inverted transform style based on platform and orientation
    const invertedTransformStyle = inverted
        ? getInvertedTransformStyle(horizontal)
        : undefined;
    // Core refs for managing scroll view, internal view, and child container
    const scrollViewRef = useRef(null);
    const internalViewRef = useRef(null);
    const firstChildViewRef = useRef(null);
    const containerViewSizeRef = useRef(undefined);
    const pendingChildIds = useRef(new Set()).current;
    // Track scroll position
    const scrollY = useRef(new Animated.Value(0)).current;
    // Refs for sticky headers and scroll anchoring
    const stickyHeaderRef = useRef(null);
    const scrollAnchorRef = useRef(null);
    // State for managing layout and render updates
    const [_, setLayoutTreeId] = useLayoutState(0);
    const [__, setRenderId] = useState(0);
    const [currentStickyIndex, setCurrentStickyIndex] = useState(-1);
    // Map to store refs for each item in the list
    const refHolder = useMemo(() => new Map(), []);
    // Initialize core RecyclerView manager and content offset management
    const { recyclerViewManager, velocityTracker } = useRecyclerViewManager(props);
    const { applyOffsetCorrection, computeFirstVisibleIndexForOffsetCorrection, applyInitialScrollIndex, handlerMethods, } = useRecyclerViewController(recyclerViewManager, ref, scrollViewRef, scrollAnchorRef);
    // Initialize view holder collection ref
    const viewHolderCollectionRef = useRef(null);
    // Hook to handle list loading
    useOnListLoad(recyclerViewManager, onLoad);
    // Hook to detect when scrolling reaches list bounds
    const { checkBounds } = useBoundDetection(recyclerViewManager, scrollViewRef);
    const isHorizontalRTL = I18nManager.isRTL && horizontal;
    /**
     * Initialize the RecyclerView by measuring and setting up the window size
     * This effect runs when the component mounts or when layout changes
     */
    useLayoutEffect(() => {
        if (internalViewRef.current && firstChildViewRef.current) {
            // Measure the outer container size and inner container layout
            const outerViewSize = measureParentSize(internalViewRef.current);
            const firstChildViewLayout = measureFirstChildLayout(firstChildViewRef.current, internalViewRef.current);
            containerViewSizeRef.current = outerViewSize;
            // firstChildViewLayout is already relative to the outer container,
            // so its x/y directly gives the first item offset.
            const firstItemOffset = horizontal
                ? firstChildViewLayout.x
                : firstChildViewLayout.y;
            // Update the RecyclerView manager with window dimensions
            recyclerViewManager.updateLayoutParams({
                width: horizontal ? outerViewSize.width : firstChildViewLayout.width,
                height: horizontal
                    ? firstChildViewLayout.height
                    : outerViewSize.height,
            }, isHorizontalRTL && recyclerViewManager.hasLayout()
                ? firstItemOffset -
                    recyclerViewManager.getChildContainerDimensions().width
                : firstItemOffset);
        }
    });
    /**
     * Effect to handle layout updates for list items
     * This ensures proper positioning and recycling of items
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useLayoutEffect(() => {
        var _a, _b;
        if (pendingChildIds.size > 0) {
            return;
        }
        const layoutInfo = Array.from(refHolder, ([index, viewHolderRef]) => {
            const layout = measureItemLayout(viewHolderRef.current, recyclerViewManager.tryGetLayout(index));
            // comapre height with stored layout
            // const storedLayout = recyclerViewManager.getLayout(index);
            // if (
            //   storedLayout.height !== layout.height &&
            //   storedLayout.isHeightMeasured
            // ) {
            //   console.log(
            //     "height changed",
            //     index,
            //     layout.height,
            //     storedLayout.height
            //   );
            // }
            return { index, dimensions: layout };
        });
        const hasExceededMaxRendersWithoutCommit = renderTimeTracker.hasExceededMaxRendersWithoutCommit();
        if (hasExceededMaxRendersWithoutCommit) {
            console.warn(WarningMessages.exceededMaxRendersWithoutCommit);
        }
        if (recyclerViewManager.modifyChildrenLayout(layoutInfo, (_a = data === null || data === void 0 ? void 0 : data.length) !== null && _a !== void 0 ? _a : 0) &&
            !hasExceededMaxRendersWithoutCommit) {
            // Trigger re-render if layout modifications were made
            setRenderId((prev) => prev + 1);
        }
        else {
            (_b = viewHolderCollectionRef.current) === null || _b === void 0 ? void 0 : _b.commitLayout();
            applyOffsetCorrection();
        }
        if (horizontal &&
            recyclerViewManager.hasLayout() &&
            recyclerViewManager.getWindowSize().height > 0) {
            // We want the parent FlashList to continue rendering the next batch of items as soon as height is available.
            // Waiting for each horizontal list to finish might cause too many setState calls.
            // This will help avoid "Maximum update depth exceeded" error.
            parentRecyclerViewContext === null || parentRecyclerViewContext === void 0 ? void 0 : parentRecyclerViewContext.unmarkChildLayoutAsPending(recyclerViewId);
        }
    });
    /**
     * Scroll event handler that manages scroll position, velocity, and RTL support
     */
    const onScrollHandler = useCallback((event) => {
        var _a, _b, _c;
        if (recyclerViewManager.ignoreScrollEvents) {
            return;
        }
        let scrollOffset = horizontal
            ? event.nativeEvent.contentOffset.x
            : event.nativeEvent.contentOffset.y;
        // Handle RTL (Right-to-Left) layout adjustments
        if (isHorizontalRTL) {
            scrollOffset = adjustOffsetForRTL(scrollOffset, event.nativeEvent.contentSize.width, event.nativeEvent.layoutMeasurement.width);
        }
        velocityTracker.computeVelocity(scrollOffset, recyclerViewManager.getAbsoluteLastScrollOffset(), Boolean(horizontal), (velocity, isMomentumEnd) => {
            if (recyclerViewManager.ignoreScrollEvents) {
                return;
            }
            if (isMomentumEnd) {
                computeFirstVisibleIndexForOffsetCorrection();
                if (!recyclerViewManager.isOffsetProjectionEnabled) {
                    return;
                }
                recyclerViewManager.resetVelocityCompute();
            }
            // Update scroll position and trigger re-render if needed
            if (recyclerViewManager.updateScrollOffset(scrollOffset, velocity)) {
                setRenderId((prev) => prev + 1);
            }
        });
        // Update sticky headers and check bounds
        (_a = stickyHeaderRef.current) === null || _a === void 0 ? void 0 : _a.reportScrollEvent(event.nativeEvent);
        checkBounds();
        // Record interaction and compute item visibility
        // Skip recording interaction during programmatic initial scroll
        // to respect waitForInteraction in viewability config
        if (recyclerViewManager.isInitialScrollComplete) {
            recyclerViewManager.recordInteraction();
        }
        recyclerViewManager.computeItemViewability();
        // Call user-provided onScroll handler
        (_c = (_b = recyclerViewManager.props).onScroll) === null || _c === void 0 ? void 0 : _c.call(_b, event);
    }, [
        checkBounds,
        computeFirstVisibleIndexForOffsetCorrection,
        horizontal,
        isHorizontalRTL,
        recyclerViewManager,
        velocityTracker,
    ]);
    const parentRecyclerViewContext = useRecyclerViewContext();
    const recyclerViewId = useId();
    // Create context for child components
    const recyclerViewContext = useMemo(() => {
        return {
            layout: () => {
                setLayoutTreeId((prev) => prev + 1);
            },
            getRef: () => {
                if (recyclerViewManager.isDisposed) {
                    return null;
                }
                return handlerMethods;
            },
            getParentRef: () => {
                var _a;
                return (_a = parentRecyclerViewContext === null || parentRecyclerViewContext === void 0 ? void 0 : parentRecyclerViewContext.getRef()) !== null && _a !== void 0 ? _a : null;
            },
            getParentScrollViewRef: () => {
                var _a;
                return (_a = parentRecyclerViewContext === null || parentRecyclerViewContext === void 0 ? void 0 : parentRecyclerViewContext.getScrollViewRef()) !== null && _a !== void 0 ? _a : null;
            },
            getScrollViewRef: () => {
                return scrollViewRef.current;
            },
            markChildLayoutAsPending: (id) => {
                pendingChildIds.add(id);
            },
            unmarkChildLayoutAsPending: (id) => {
                if (pendingChildIds.has(id)) {
                    pendingChildIds.delete(id);
                    recyclerViewContext.layout();
                }
            },
        };
    }, [
        handlerMethods,
        parentRecyclerViewContext,
        pendingChildIds,
        recyclerViewManager.isDisposed,
        setLayoutTreeId,
    ]);
    /**
     * Validates that item dimensions match the expected layout
     */
    const validateItemSize = useCallback((index, size) => {
        var _a, _b, _c, _d;
        const layout = recyclerViewManager.getLayout(index);
        const width = Math.max(Math.min(layout.width, (_a = layout.maxWidth) !== null && _a !== void 0 ? _a : Infinity), (_b = layout.minWidth) !== null && _b !== void 0 ? _b : 0);
        const height = Math.max(Math.min(layout.height, (_c = layout.maxHeight) !== null && _c !== void 0 ? _c : Infinity), (_d = layout.minHeight) !== null && _d !== void 0 ? _d : 0);
        if (areDimensionsNotEqual(width, size.width) ||
            areDimensionsNotEqual(height, size.height)) {
            // console.log(
            //   "invalid size",
            //   index,
            //   width,
            //   size.width,
            //   height,
            //   size.height
            // );
            // TODO: Add a warning for missing useLayoutState
            recyclerViewContext.layout();
        }
    }, [recyclerViewContext, recyclerViewManager]);
    // Get secondary props and components
    const { refreshControl, renderHeader, renderFooter, renderEmpty, CompatScrollView, renderStickyHeaderBackdrop, } = useSecondaryProps(props);
    if (!recyclerViewManager.getIsFirstLayoutComplete() &&
        recyclerViewManager.getDataLength() > 0) {
        parentRecyclerViewContext === null || parentRecyclerViewContext === void 0 ? void 0 : parentRecyclerViewContext.markChildLayoutAsPending(recyclerViewId);
    }
    // Render sticky headers if configured
    const stickyHeaders = useMemo(() => {
        if (data &&
            data.length > 0 &&
            stickyHeaderIndices &&
            stickyHeaderIndices.length > 0) {
            if (horizontal) {
                throw new Error(ErrorMessages.stickyHeadersNotSupportedForHorizontal);
            }
            return (React.createElement(StickyHeaders, { stickyHeaderIndices: stickyHeaderIndices, stickyHeaderOffset: stickyHeaderOffset, data: data, renderItem: renderItem, scrollY: scrollY, stickyHeaderRef: stickyHeaderRef, stickyHeaderZIndex: stickyHeaderZIndex, recyclerViewManager: recyclerViewManager, extraData: extraData, inverted: inverted, onChangeStickyIndex: (newStickyHeaderIndex) => {
                    if (stickyHeaderHideRelatedCell) {
                        setCurrentStickyIndex(newStickyHeaderIndex);
                    }
                    onChangeStickyIndex === null || onChangeStickyIndex === void 0 ? void 0 : onChangeStickyIndex(newStickyHeaderIndex, currentStickyIndex);
                } }));
        }
        return null;
    }, [
        data,
        stickyHeaderIndices,
        stickyHeaderOffset,
        renderItem,
        scrollY,
        horizontal,
        recyclerViewManager,
        extraData,
        currentStickyIndex,
        onChangeStickyIndex,
        stickyHeaderHideRelatedCell,
        stickyHeaderZIndex,
        inverted,
    ]);
    // Set up scroll event handling with animation support for sticky headers
    const animatedEvent = useMemo(() => {
        if (stickyHeaders) {
            return Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                useNativeDriver: stickyHeaderUseNativeDriver,
                listener: onScrollHandler,
            });
        }
        return onScrollHandler;
    }, [onScrollHandler, scrollY, stickyHeaders, stickyHeaderUseNativeDriver]);
    const shouldMaintainVisibleContentPosition = recyclerViewManager.shouldMaintainVisibleContentPosition();
    const maintainVisibleContentPositionInternal = useMemo(() => {
        if (shouldMaintainVisibleContentPosition) {
            return {
                ...maintainVisibleContentPosition,
                minIndexForVisible: 0,
            };
        }
        return undefined;
    }, [maintainVisibleContentPosition, shouldMaintainVisibleContentPosition]);
    // Create view for measuring bounded size
    const viewToMeasureBoundedSize = useMemo(() => {
        return (React.createElement(CompatView, { style: {
                marginTop: horizontal ? undefined : stickyHeaderOffset,
                height: horizontal ? undefined : 0,
                width: horizontal ? 0 : undefined,
            }, ref: firstChildViewRef }));
    }, [horizontal, stickyHeaderOffset]);
    const scrollAnchor = useMemo(() => {
        if (shouldMaintainVisibleContentPosition) {
            return (React.createElement(ScrollAnchor, { horizontal: Boolean(horizontal), scrollAnchorRef: scrollAnchorRef }));
        }
        return null;
    }, [horizontal, shouldMaintainVisibleContentPosition]);
    // console.log("render", recyclerViewManager.getRenderStack());
    // Render the main RecyclerView structure
    return (React.createElement(RecyclerViewContextProvider, { value: recyclerViewContext },
        React.createElement(CompatView, { style: [
                {
                    flex: horizontal ? undefined : 1,
                    overflow: "hidden",
                },
                style,
                invertedTransformStyle,
            ], ref: internalViewRef, collapsable: false, onLayout: (event) => {
                var _a, _b, _c, _d;
                if (areDimensionsNotEqual(event.nativeEvent.layout.width, (_b = (_a = containerViewSizeRef.current) === null || _a === void 0 ? void 0 : _a.width) !== null && _b !== void 0 ? _b : 0) ||
                    areDimensionsNotEqual(event.nativeEvent.layout.height, (_d = (_c = containerViewSizeRef.current) === null || _c === void 0 ? void 0 : _c.height) !== null && _d !== void 0 ? _d : 0)) {
                    // console.log(
                    //   "onLayout",
                    //   recyclerViewManager.getWindowSize(),
                    //   event.nativeEvent.layout
                    // );
                    recyclerViewContext.layout();
                }
            } },
            React.createElement(CompatScrollView, { ...rest, horizontal: horizontal, ref: scrollViewRef, onScroll: animatedEvent, maintainVisibleContentPosition: maintainVisibleContentPositionInternal, removeClippedSubviews: false, refreshControl: refreshControl, ...overrideProps },
                scrollAnchor,
                isHorizontalRTL && viewToMeasureBoundedSize,
                renderHeader,
                !isHorizontalRTL && viewToMeasureBoundedSize,
                React.createElement(ViewHolderCollection, { viewHolderCollectionRef: viewHolderCollectionRef, data: data, horizontal: horizontal, renderStack: recyclerViewManager.getRenderStack(), getLayout: (index) => recyclerViewManager.getLayout(index), getAdjustmentMargin: () => 0, refHolder: refHolder, onSizeChanged: validateItemSize, renderItem: renderItem, extraData: extraData, onCommitLayoutEffect: () => {
                        applyInitialScrollIndex();
                        parentRecyclerViewContext === null || parentRecyclerViewContext === void 0 ? void 0 : parentRecyclerViewContext.unmarkChildLayoutAsPending(recyclerViewId);
                        onCommitLayoutEffect === null || onCommitLayoutEffect === void 0 ? void 0 : onCommitLayoutEffect();
                    }, onCommitEffect: () => {
                        renderTimeTracker.markRenderComplete();
                        recyclerViewManager.updateAverageRenderTime(renderTimeTracker.getAverageRenderTime());
                        applyInitialScrollIndex();
                        checkBounds();
                        recyclerViewManager.computeItemViewability();
                        recyclerViewManager.animationOptimizationsEnabled = false;
                    }, CellRendererComponent: CellRendererComponent, ItemSeparatorComponent: ItemSeparatorComponent, isInLastRow: (index) => recyclerViewManager.isInLastRow(index), getChildContainerLayout: () => recyclerViewManager.hasLayout()
                        ? recyclerViewManager.getChildContainerDimensions()
                        : undefined, currentStickyIndex: currentStickyIndex, hideStickyHeaderRelatedCell: stickyHeaderHideRelatedCell, inverted: inverted }),
                renderEmpty,
                renderFooter),
            stickyHeaderIndices && stickyHeaderIndices.length > 0
                ? renderStickyHeaderBackdrop
                : null,
            stickyHeaders)));
};
// Set displayName for the inner component
RecyclerViewComponent.displayName = "FlashList";
// Create and export the memoized, forwarded ref component
const RecyclerView = React.memo(forwardRef(RecyclerViewComponent));
export { RecyclerView };
//# sourceMappingURL=RecyclerView.js.map
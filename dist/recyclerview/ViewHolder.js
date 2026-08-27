/**
 * ViewHolder is a core component in FlashList that manages individual item rendering and layout.
 * It handles the rendering of list items, separators, and manages layout updates for each item.
 * The component is memoized to prevent unnecessary re-renders and includes layout comparison logic.
 */
import React, { useCallback, useLayoutEffect, useMemo, useRef, } from "react";
import { CompatView } from "./components/CompatView";
import { getInvertedTransformStyle } from "./utils/getInvertedTransformStyle";
/**
 * Internal ViewHolder component that handles the actual rendering of list items
 * @template TItem - The type of item being rendered in the list
 */
const ViewHolderInternal = (props) => {
    // create ref for View
    const viewRef = useRef(null);
    const { index, refHolder, layout, onSizeChanged, renderItem, extraData, item, target, CellRendererComponent, ItemSeparatorComponent, trailingItem, horizontal, hidden, inverted, } = props;
    useLayoutEffect(() => {
        refHolder.set(index, viewRef);
        return () => {
            if (refHolder.get(index) === viewRef) {
                refHolder.delete(index);
            }
        };
    }, [index, refHolder]);
    const onLayout = useCallback((event) => {
        onSizeChanged === null || onSizeChanged === void 0 ? void 0 : onSizeChanged(index, event.nativeEvent.layout);
    }, [index, onSizeChanged]);
    const separator = useMemo(() => {
        return ItemSeparatorComponent && trailingItem !== undefined ? (React.createElement(ItemSeparatorComponent, { leadingItem: item, trailingItem: trailingItem })) : null;
    }, [ItemSeparatorComponent, item, trailingItem]);
    // console.log("ViewHolder re-render", index);
    const children = useMemo(() => {
        var _a;
        return (_a = renderItem === null || renderItem === void 0 ? void 0 : renderItem({ item, index, extraData, target })) !== null && _a !== void 0 ? _a : null;
        // TODO: Test more thoroughly
        // We don't really  to re-render the children when the index changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item, extraData, target, renderItem]);
    const invertedTransformStyle = inverted
        ? getInvertedTransformStyle(horizontal)
        : undefined;
    const style = {
        flexDirection: horizontal ? "row" : "column",
        position: target === "StickyHeader" ? "relative" : "absolute",
        width: layout.enforcedWidth ? layout.width : undefined,
        height: layout.enforcedHeight ? layout.height : undefined,
        minHeight: layout.minHeight,
        minWidth: layout.minWidth,
        maxHeight: layout.maxHeight,
        maxWidth: layout.maxWidth,
        left: layout.x,
        top: layout.y,
        opacity: hidden ? 0 : 1,
        ...invertedTransformStyle,
    };
    // TODO: Fix this type issue
    const CompatContainer = (CellRendererComponent !== null && CellRendererComponent !== void 0 ? CellRendererComponent : CompatView);
    return (React.createElement(CompatContainer, { ref: viewRef, onLayout: onLayout, style: style, index: index },
        children,
        separator));
};
/**
 * Memoized ViewHolder component that prevents unnecessary re-renders by comparing props
 * @template TItem - The type of item being rendered in the list
 */
export const ViewHolder = React.memo(ViewHolderInternal, (prevProps, nextProps) => {
    // compare all props and spread layout
    return (prevProps.index === nextProps.index &&
        areLayoutsEqual(prevProps.layout, nextProps.layout) &&
        prevProps.refHolder === nextProps.refHolder &&
        prevProps.onSizeChanged === nextProps.onSizeChanged &&
        prevProps.extraData === nextProps.extraData &&
        prevProps.target === nextProps.target &&
        prevProps.item === nextProps.item &&
        prevProps.renderItem === nextProps.renderItem &&
        prevProps.CellRendererComponent === nextProps.CellRendererComponent &&
        prevProps.ItemSeparatorComponent === nextProps.ItemSeparatorComponent &&
        prevProps.trailingItem === nextProps.trailingItem &&
        prevProps.horizontal === nextProps.horizontal &&
        prevProps.hidden === nextProps.hidden &&
        prevProps.inverted === nextProps.inverted);
});
/**
 * Compares two RVLayout objects to determine if they are equal
 * Used in the memo comparison function to prevent unnecessary re-renders
 * @param prevLayout - Previous layout object
 * @param nextLayout - Next layout object
 * @returns boolean indicating if layouts are equal
 */
function areLayoutsEqual(prevLayout, nextLayout) {
    return (prevLayout.x === nextLayout.x &&
        prevLayout.y === nextLayout.y &&
        prevLayout.width === nextLayout.width &&
        prevLayout.height === nextLayout.height &&
        prevLayout.enforcedWidth === nextLayout.enforcedWidth &&
        prevLayout.enforcedHeight === nextLayout.enforcedHeight &&
        prevLayout.minWidth === nextLayout.minWidth &&
        prevLayout.minHeight === nextLayout.minHeight &&
        prevLayout.maxWidth === nextLayout.maxWidth &&
        prevLayout.maxHeight === nextLayout.maxHeight);
}
//# sourceMappingURL=ViewHolder.js.map
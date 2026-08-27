/**
 * ViewHolderCollection is a container component that manages multiple ViewHolder instances.
 * It handles the rendering of a collection of list items, manages layout updates,
 * and coordinates with the RecyclerView context for layout changes.
 */
import React, { useEffect, useImperativeHandle, useLayoutEffect } from "react";
import { ViewHolder } from "./ViewHolder";
import { CompatView } from "./components/CompatView";
import { useRecyclerViewContext } from "./RecyclerViewContextProvider";
/**
 * ViewHolderCollection component that manages the rendering of multiple ViewHolder instances
 * and handles layout updates for the entire collection
 * @template TItem - The type of items in the data array
 */
export const ViewHolderCollection = (props) => {
    const { data, renderStack, getLayout, refHolder, onSizeChanged, renderItem, extraData, viewHolderCollectionRef, getChildContainerLayout, onCommitLayoutEffect, CellRendererComponent, ItemSeparatorComponent, onCommitEffect, horizontal, getAdjustmentMargin, currentStickyIndex, hideStickyHeaderRelatedCell, isInLastRow, inverted, } = props;
    const [renderId, setRenderId] = React.useState(0);
    const containerLayout = getChildContainerLayout();
    const fixedContainerSize = horizontal
        ? containerLayout === null || containerLayout === void 0 ? void 0 : containerLayout.height
        : containerLayout === null || containerLayout === void 0 ? void 0 : containerLayout.width;
    const recyclerViewContext = useRecyclerViewContext();
    useLayoutEffect(() => {
        if (renderId > 0) {
            // console.log(
            //   "parent layout trigger due to child container size change",
            //   fixedContainerSize
            // );
            recyclerViewContext === null || recyclerViewContext === void 0 ? void 0 : recyclerViewContext.layout();
        }
        // we need to run this callback on when fixedContainerSize changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fixedContainerSize]);
    useLayoutEffect(() => {
        if (renderId > 0) {
            onCommitLayoutEffect === null || onCommitLayoutEffect === void 0 ? void 0 : onCommitLayoutEffect();
        }
        // we need to run this callback on when renderId changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renderId]);
    useEffect(() => {
        if (renderId > 0) {
            onCommitEffect === null || onCommitEffect === void 0 ? void 0 : onCommitEffect();
        }
        // we need to run this callback on when renderId changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renderId]);
    // Expose forceUpdate through ref
    useImperativeHandle(viewHolderCollectionRef, () => ({
        commitLayout: () => {
            // This will trigger a re-render of the component
            setRenderId((prev) => prev + 1);
        },
    }), [setRenderId]);
    const hasData = data && data.length > 0;
    const containerStyle = {
        width: horizontal ? containerLayout === null || containerLayout === void 0 ? void 0 : containerLayout.width : undefined,
        height: containerLayout === null || containerLayout === void 0 ? void 0 : containerLayout.height,
        marginTop: horizontal ? undefined : getAdjustmentMargin(),
        marginLeft: horizontal ? getAdjustmentMargin() : undefined,
        // TODO: Temp workaround, useLayoutEffect doesn't block paint in some cases
        // We need to investigate why this is happening
        opacity: renderId > 0 ? 1 : 0,
    };
    // sort by index and log
    // const sortedRenderStack = Array.from(renderStack.entries()).sort(
    //   ([, a], [, b]) => a.index - b.index
    // );
    // console.log(
    //   "sortedRenderStack",
    //   sortedRenderStack.map(([reactKey, { index }]) => {
    //     return `${index} => ${reactKey}`;
    //   })
    // );
    return (React.createElement(CompatView, { style: hasData && containerStyle }, containerLayout &&
        hasData &&
        Array.from(renderStack.entries(), ([reactKey, { index }]) => {
            const item = data[index];
            // Suppress separators for items in the last row to prevent
            // height mismatch. The last data item has no separator (no
            // trailingItem), so all items sharing its row must match.
            const trailingItem = ItemSeparatorComponent && !isInLastRow(index)
                ? data[index + 1]
                : undefined;
            return (React.createElement(ViewHolder, { key: reactKey, index: index, item: item, trailingItem: trailingItem, layout: {
                    ...getLayout(index),
                }, refHolder: refHolder, onSizeChanged: onSizeChanged, target: "Cell", renderItem: renderItem, extraData: extraData, CellRendererComponent: CellRendererComponent, ItemSeparatorComponent: ItemSeparatorComponent, horizontal: horizontal, hidden: hideStickyHeaderRelatedCell && currentStickyIndex === index, inverted: inverted }));
        })));
};
//# sourceMappingURL=ViewHolderCollection.js.map
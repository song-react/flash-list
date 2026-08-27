interface Layout {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface Size {
    width: number;
    height: number;
}
/**
 * Checks if two dimension values are not equal, with a small tolerance.
 */
export declare function areDimensionsNotEqual(value1: number, value2: number): boolean;
/**
 * Checks if two dimension values are equal, with a small tolerance.
 */
export declare function areDimensionsEqual(value1: number, value2: number): boolean;
export declare function roundOffPixel(value: number): number;
/**
 * Measures the size of the RecyclerView's outer container.
 */
export declare function measureParentSize(view: Element): Size;
/**
 * Measures the layout of child container of RecyclerView
 */
export declare function measureFirstChildLayout(childContainerView: Element, parentView: Element): Layout;
/**
 * Measures the layout of items of RecyclerView
 */
export declare function measureItemLayout(item: Element, oldLayout: Layout | undefined): Layout;
export {};
//# sourceMappingURL=measureLayout.web.d.ts.map
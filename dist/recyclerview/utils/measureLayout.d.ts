import { View } from "react-native";
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
 * Used to handle floating-point precision issues in layout measurements.
 *
 * @param value1 - First dimension value to compare
 * @param value2 - Second dimension value to compare
 * @returns true if the values are significantly different, false otherwise
 */
export declare function areDimensionsNotEqual(value1: number, value2: number): boolean;
/**
 * Checks if two dimension values are equal, with a small tolerance.
 * Used to handle floating-point precision issues in layout measurements.
 *
 * @param value1 - First dimension value to compare
 * @param value2 - Second dimension value to compare
 * @returns true if the values are approximately equal, false otherwise
 */
export declare function areDimensionsEqual(value1: number, value2: number): boolean;
export declare function roundOffPixel(value: number): number;
/**
 * Measures the size of the RecyclerView's outer container.
 * Uses a self-relative measureLayout call to get width/height synchronously.
 *
 * @param view - The React Native View component to measure
 * @returns An object containing width and height
 */
export declare function measureParentSize(view: View): Size;
/**
 * Specific method for easier mocking
 * Measures the layout of child container of RecyclerView
 * @param childContainerView
 * @param parentView
 * @returns
 */
export declare function measureFirstChildLayout(childContainerView: View, parentView: View): Layout;
/**
 * Specific method for easier mocking
 * Measures the layout of items of RecyclerView
 * @param item
 * @param oldLayout
 * @returns
 */
export declare function measureItemLayout(item: View, oldLayout: Layout | undefined): Layout;
export {};
//# sourceMappingURL=measureLayout.d.ts.map
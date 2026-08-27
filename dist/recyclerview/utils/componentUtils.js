import React from "react";
/**
 * Returns true if the value is a React class component.
 * Class components set `prototype.isReactComponent` per React convention,
 * which distinguishes them from plain functions and render props.
 */
export const isComponentClass = (value) => {
    var _a;
    return typeof value === "function" &&
        Boolean((_a = value.prototype) === null || _a === void 0 ? void 0 : _a.isReactComponent);
};
/**
 * Helper function to handle both React components and React elements.
 * This utility ensures proper rendering of components whether they are passed as
 * component types or pre-rendered elements. Supports function components, class
 * components, React.memo, React.forwardRef, and pre-rendered elements.
 *
 * @param component - Can be a React component type, exotic component, React element, null, or undefined
 * @returns A valid React element if the input is valid, null otherwise
 *
 * @example
 * // With a component type
 * getValidComponent(MyComponent)
 *
 * @example
 * // With a pre-rendered element
 * getValidComponent(<MyComponent />)
 */
export const getValidComponent = (component) => {
    if (React.isValidElement(component)) {
        return component;
    }
    else if (component != null) {
        // Cast needed: React.createElement's type overloads don't include ExoticComponent,
        // but it handles memo/forwardRef/lazy correctly at runtime.
        return React.createElement(component);
    }
    return null;
};
//# sourceMappingURL=componentUtils.js.map
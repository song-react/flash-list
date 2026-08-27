import { createContext, useContext } from "react";
const RecyclerViewContextInstance = createContext(undefined);
export const RecyclerViewContextProvider = RecyclerViewContextInstance.Provider;
export function useRecyclerViewContext() {
    return useContext(RecyclerViewContextInstance);
}
export function useFlashListContext() {
    return useContext(RecyclerViewContextInstance);
}
//# sourceMappingURL=RecyclerViewContextProvider.js.map
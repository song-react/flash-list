// Keep this unmodified for TS type checking
import { isNewArch } from "./isNewArch";
import { ErrorMessages } from "./errors/ErrorMessages";
export { FlashList } from "./FlashList";
export { RenderTargetOptions, } from "./FlashListProps";
export { default as AnimatedFlashList } from "./AnimatedFlashList";
export { useBenchmark, } from "./benchmark/useBenchmark";
export { useDataMultiplier } from "./benchmark/useDataMultiplier";
export { useFlatListBenchmark, } from "./benchmark/useFlatListBenchmark";
export { useLayoutState } from "./recyclerview/hooks/useLayoutState";
export { useRecyclingState } from "./recyclerview/hooks/useRecyclingState";
export { useMappingHelper } from "./recyclerview/hooks/useMappingHelper";
export { JSFPSMonitor } from "./benchmark/JSFPSMonitor";
export { autoScroll, Cancellable } from "./benchmark/AutoScrollHelper";
export { useFlashListContext } from "./recyclerview/RecyclerViewContextProvider";
export { LayoutCommitObserver, } from "./recyclerview/LayoutCommitObserver";
if (!isNewArch()) {
    throw new Error(ErrorMessages.flashListV2OnlySupportsNewArchitecture);
}
//# sourceMappingURL=index.js.map
var _a;
import { Platform } from "react-native";
const rnVersion = (_a = Platform.constants) === null || _a === void 0 ? void 0 : _a.reactNativeVersion;
export const isRN083OrAbove = () => rnVersion && (rnVersion.major > 0 || rnVersion.minor >= 83);
//# sourceMappingURL=versionCheck.js.map
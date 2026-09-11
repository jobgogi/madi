import { useUiLanguage } from "./useUiLanguage";
import type { NativeLanguage } from "@/lib/native-language";

// 화면 문구 표시 언어 (읽기 전용). 값을 바꿔야 하는 컴포넌트(설정 화면)는
// useUiLanguage를 직접 써야 한다 - 같은 컴포넌트에서 이 훅과 useUiLanguage를
// 둘 다 부르면 서로 다른 state 인스턴스가 생겨 토글해도 반영되지 않는다.
export function useLocale(): NativeLanguage {
  return useUiLanguage().uiLanguage;
}

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { AnalysisParseError } from "./analyze";

export interface ProviderErrorResponse {
  status: number;
  message: string;
}

// /api/analyze와 /api/test-connection이 공유하는 에러 -> 응답 매핑.
// 두 곳에서 같은 instanceof 체인을 따로 유지하지 않도록 여기 하나로 모은다.
export function describeProviderError(error: unknown): ProviderErrorResponse {
  // 클라이언트에는 친절한 메시지만 보내지만, 서버 콘솔(npm run dev 터미널)에는
  // 실제 provider 에러를 항상 그대로 남긴다 - 무슨 에러인지 정확히 확인하려면
  // 여기를 보면 됨.
  console.error("[/api/analyze or /api/test-connection] provider error:", error);

  if (error instanceof AnalysisParseError) {
    return { status: 502, message: error.message };
  }
  if (
    error instanceof Anthropic.AuthenticationError ||
    error instanceof OpenAI.AuthenticationError
  ) {
    return {
      status: 401,
      message: "API 키가 유효하지 않습니다. 키가 만료되었거나 잘못 입력되었을 수 있습니다.",
    };
  }
  if (
    error instanceof Anthropic.RateLimitError ||
    error instanceof OpenAI.RateLimitError
  ) {
    return {
      status: 429,
      message: "API 사용량 한도에 도달했습니다. 잠시 후 다시 시도하거나 사용량을 확인해주세요.",
    };
  }
  if (
    error instanceof Anthropic.BadRequestError &&
    error.message.includes("anthropic-workspace-id is required")
  ) {
    return {
      status: 400,
      message:
        "이 Claude API 키는 여러 workspace에 걸친 개인 키입니다. Workspace ID를 입력해주세요. (Console > Settings > Workspaces에서 확인 가능)",
    };
  }
  if (error instanceof Anthropic.APIError || error instanceof OpenAI.APIError) {
    if (typeof error.status === "number" && error.status >= 500) {
      return {
        status: 502,
        message: "AI 서버가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.",
      };
    }
    return {
      status: typeof error.status === "number" ? error.status : 502,
      message: `API 오류: ${error.message}`,
    };
  }
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      status: 502,
      message: "네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인해주세요.",
    };
  }
  return { status: 500, message: "예상치 못한 오류가 발생했습니다." };
}

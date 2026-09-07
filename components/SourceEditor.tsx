"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

// 단락 구조(빈 줄로 구분된 여러 <p>)를 유지한 채 원문을 입력받는 리치
// 텍스트 에디터. 문단이 바뀔 때마다 문단별 텍스트 배열을 상위로 전달한다.
export function SourceEditor({
  onChangeParagraphs,
  placeholder,
}: {
  onChangeParagraphs: (paragraphs: string[]) => void;
  placeholder: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder })],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] rounded-lg border border-zinc-300 bg-white p-3 text-sm leading-relaxed text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 [&_p]:my-2 first:[&_p]:mt-0",
        "aria-label": placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      // 블록(문단) 사이는 "\n\n"으로, 블록 안 줄바꿈(Shift+Enter)은 "\n"으로
      // 구분되는 Tiptap 공식 직렬화 방식 - 노드를 직접 순회하는 것보다
      // 연속 Enter로 생기는 빈 문단 케이스에 더 안정적이다.
      const paragraphs = editor
        .getText({ blockSeparator: "\n\n" })
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      onChangeParagraphs(paragraphs);
    },
  });

  return <EditorContent editor={editor} />;
}

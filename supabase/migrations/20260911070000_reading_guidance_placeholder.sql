-- vocabulary_diff[].reading 안내(후리가나/가타카나)가 direction에 고정 텍스트로
-- 박혀 있어서, 사용자가 방향을 수동으로 뒤집어 원문 언어가 자기 모국어와
-- 같아지는 경우(예: 모국어 한국어인 사용자가 ko_to_ja 선택)에도 무조건 가타카나
-- 표기를 요구했다 - 이미 자국어인 단어에 발음 안내가 필요 없다는 점을 놓친 것.
-- direction과 nativeLanguage "조합"에 따라 계산하는 {{readingGuidance}}
-- 플레이스홀더로 바꿔서 lib/providers/analyze.ts의 resolvePromptTemplate()이
-- 요청 시점에 올바른 안내로 치환하게 한다. 2026-09-11 사용자 요청.
update public.prompt_templates
set content = replace(
  content,
  '각 단어에는 reading(한자 요미가나, 히라가나 표기)을 병기하세요. 필요 없으면 null로 두세요.',
  '{{readingGuidance}}'
)
where direction = 'ja_to_ko' and version = 1;

update public.prompt_templates
set content = replace(
  content,
  '각 단어에는 reading(한국어 단어의 일본어식 발음을 외래어 표기법 기준 가타카나로 표기)을 병기하세요. 가타카나 표기는 일관된 규칙을 따르세요. 필요 없으면 null로 두세요.',
  '{{readingGuidance}}'
)
where direction = 'ko_to_ja' and version = 1;

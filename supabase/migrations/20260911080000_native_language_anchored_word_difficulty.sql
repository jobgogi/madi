-- word(어휘)와 difficulty.level(난이도 척도)이 direction에 고정 텍스트로 박혀
-- 있어서, reading과 서로 다른 축(direction vs 모국어)으로 언어를 판단하고
-- 있었다 - "개념이 꼬여 있다"는 지적. 셋 다 모국어 기준("학습 대상 언어" =
-- 모국어의 반대쪽)으로 통일한다. direction이 무엇이든, 모국어와 같은 언어는
-- 이미 아는 언어라 단어/난이도 판정 대상이 될 이유가 없다는 원칙.
-- 2026-09-11 사용자 요청. lib/providers/analyze.ts의
-- buildVocabularyLanguageGuidance/buildDifficultyGuidance 참고.
update public.prompt_templates
set content = replace(
  replace(
    content,
    'word는 반드시 원문(일본어) 표현이어야 합니다 — 당신이 만든 한국어 번역 결과물 쪽 단어를 넣으면 안 됩니다(예: ko_to_ja처럼 원문이 한국어면 word도 한국어 단어여야 하고, 일본어 번역 단어를 넣으면 안 됩니다).',
    '{{vocabularyLanguage}}'
  ),
  'difficulty.level은 원문(일본어) 전체의 JLPT 기준 대략적인 난이도(N5~N1)를 판단하고, comment에 그 이유를 간단히 설명하세요.',
  '{{difficultyGuidance}}'
)
where direction = 'ja_to_ko' and version = 1;

update public.prompt_templates
set content = replace(
  replace(
    content,
    'word는 반드시 원문(한국어) 표현이어야 합니다 — 당신이 만든 일본어 번역 결과물 쪽 단어를 넣으면 안 됩니다(예: ko_to_ja처럼 원문이 한국어면 word도 한국어 단어여야 하고, 일본어 번역 단어를 넣으면 안 됩니다).',
    '{{vocabularyLanguage}}'
  ),
  'difficulty.level은 당신이 만든 기준 번역이 아니라 원문(한국어) 전체의 TOPIK 기준 대략적인 난이도(1급=쉬움~6급=어려움)를 판단하고, comment에 그 이유를 간단히 설명하세요.',
  '{{difficultyGuidance}}'
)
where direction = 'ko_to_ja' and version = 1;

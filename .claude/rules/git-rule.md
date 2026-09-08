# Git作業ルール

## Commit前
- [ ] 全てのテスト通貨
- [ ] 作業範囲外ファイルなし
- [ ] デーバグコード削除
- [ ] Commitメッセージコンベンション守る

## Commitメッセージコンベンション
|コンベンション|内容|
|----|----|
|test(scope)|テスト追加・修正|
|feat(scope)|機能実装|
|fix(scope)|バグ修正|
|refactor(scope)|リファクタリング|
|chore(scope)|設定・パッケージ|

例)
test(file-detector): PDF/ePubタイプ検知テスト追加
feat(file-detector): MIMEタイプ基盤ファイル検知実装
chore(melos): モノレポ初期設定

## PR前
- [ ] 全てのテストパース
- [ ] featureブランチpush完了
- [ ] PR生成完了
- [ ] Claude Code中止 (mergeはGitHubで)

## 絶対禁止
- git merge 直接実行
- git push origin main / develop

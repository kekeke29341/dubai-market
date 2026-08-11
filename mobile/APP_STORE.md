# Dubai Market — iOS App Store 申請ガイド

このディレクトリ (`mobile/`) は、本番 Web アプリ
(`https://dubai-market-wine.vercel.app`) をネイティブシェルで包んだ **Expo iOS アプリ**です。

ローカルに Xcode が無くても、**EAS Build（クラウド）** で IPA を作成し、
**EAS Submit** で App Store Connect へ提出できます。

掲載文・審査メモの完成稿は **[STORE_LISTING.md](./STORE_LISTING.md)** を参照。

---

## 前提（あなた側で必要なもの）

1. **Apple Developer Program**（有料・年額 $99）への加入  
   https://developer.apple.com/programs/
2. **Expo アカウント**（無料可）  
   https://expo.dev/signup
3. 本番サイトが安定して公開されていること（現在: `dubai-market-wine.vercel.app`）
4. App Store 用メール（サポート用）。コード上は `support@dubaimarket.app` を仮置きしています。実在する受信可能なアドレスに差し替えてください。
5. **審査用デモアカウント**（ログイン必須機能があるため事実上必須）

---

## 進捗チェックリスト

### コード側（実装済み）

- [x] Expo WebView シェル（オフライン / Pull to Refresh / ディープリンク）
- [x] アイコン・スプラッシュ・Bundle ID `com.dubaimarket.app`
- [x] カメラ / 写真ライブラリ利用目的文
- [x] Privacy Manifest / 非免除暗号フラグ
- [x] `/privacy` `/terms` `/support`（**本番デプロイ済み**）
- [x] 設定画面からの **アカウント削除**（Guideline 5.1.1）
- [x] ネイティブ共有シート（Web ↔ RN ブリッジ）
- [x] アプリ内では Service Worker を登録しない
- [x] AASA エンドポイント本番公開（Team ID はプレースホルダ）
- [x] 審査用デモアカウント作成（`appstore.reviewer@dubai-market.test`）

### あなたが埋める項目（Apple / Expo アカウント必須）

- [ ] Apple Developer Program 加入（年 $99）
- [ ] Expo アカウント作成 → `cd mobile && npx eas-cli login` → `npx eas-cli init`
- [ ] Certificates で Bundle ID `com.dubaimarket.app` 登録
- [ ] App Store Connect でアプリ作成 → `eas.json` の `ascAppId` / `appleTeamId`
- [ ] AASA の `REPLACE_TEAM_ID` を実 Team ID に更新して再デプロイ
- [ ] サポート用メールを実アドレスに差し替え（現在 `support@dubaimarket.app` は仮）
- [ ] スクリーンショット作成（TestFlight / preview ビルド推奨）
- [ ] `npm run build:ios` → `npm run submit:ios` → 審査提出

---

## 1. 初回セットアップ

```bash
# Node 20+ 推奨（このマシンでは nvm use 22）
cd dubai-market/mobile
npm install

# Expo / EAS ログイン
npx eas-cli login

# EAS プロジェクトを紐付け（projectId が app.json に書き込まれる）
npx eas-cli init
```

`eas init` 後、`app.json` の `extra.eas.projectId` が自動更新されます。

---

## 2. App Store Connect でアプリを作成

1. https://appstoreconnect.apple.com にログイン
2. **マイ App → + → 新規 App**
3. 入力例:
   - プラットフォーム: iOS
   - 名前: `Dubai Market`
   - プライマリ言語: English (U.S.) または Japanese
   - Bundle ID: `com.dubaimarket.app`（先に Certificates, Identifiers & Profiles で登録）
   - SKU: `dubai-market-ios`
4. 作成後の **Apple ID（数字）** を控える → `eas.json` の `ascAppId` に入れる
5. Membership の **Team ID** を控える → `eas.json` の `appleTeamId` に入れる  
   同じ Team ID を AASA の `REPLACE_TEAM_ID` にも入れる

---

## 3. 本番ビルド（クラウド）

```bash
cd dubai-market/mobile

# 内部配布（実機確認・スクショ用）を先に推奨
npm run build:ios:preview

# 本番向け iOS ビルド（初回は証明書を EAS に自動生成させてよい）
npm run build:ios
```

完了すると Expo ダッシュボードにビルドページの URL が出ます。

---

## 4. 審査用メタデータ

詳細は **[STORE_LISTING.md](./STORE_LISTING.md)**。

要点:

| 項目 | 値 |
|------|-----|
| プライバシー | `https://dubai-market-wine.vercel.app/privacy` |
| サポート | `https://dubai-market-wine.vercel.app/support` |
| 年齢 | 12+（UGC） |
| IAP | なし |

### スクリーンショット

iPhone 6.7" / 6.5" など必須サイズで、実機（TestFlight / preview ビルド）またはシミュレータ画面を用意します。

```bash
npx expo start
```

---

## 5. 提出（Submit）

```bash
cd dubai-market/mobile

# eas.json の ascAppId / appleTeamId を埋めたあと
npm run submit:ios
```

App Store Connect でビルドが処理されたら:

1. バージョンを選択
2. 輸出コンプライアンス: 暗号は HTTPS のみ → 免除（`ITSAppUsesNonExemptEncryption = false` 済み）
3. 審査メモにテスト用アカウントを記載（**必須に近い**）
4. **審査に提出**

---

## 6. Apple 審査で落ちやすい点

| リスク | 対策 |
|--------|------|
| 4.2 最低限の機能（薄い WebView） | オフライン・スプラッシュ・Pull to Refresh・ディープリンク・ネイティブ共有・権限説明 |
| 5.1.1 アカウント削除なし | Settings → Danger zone → Delete account |
| プライバシーポリシー欠如 | `/privacy` `/terms` `/support` |
| ログイン必須でデモ不可 | 審査用アカウントをメモに書く |
| 壊れたリンク / SSO 保護 | 本番は `dubai-market-wine.vercel.app` |
| カメラ権限文面なし | `NSCameraUsageDescription` 等を設定済み |
| サポート URL なし | `/support` |

独自ドメインを取ったら、`mobile/src/config.ts` と `app.json` の URL / associatedDomains を更新してください。

---

## よく使うコマンド

```bash
cd mobile
npm start                          # Expo 開発サーバ
npm run build:ios:preview          # 内部配布
npm run build:ios                  # 本番
npm run submit:ios                 # App Store へアップロード
```

---

## ファイル構成

```
mobile/
  App.tsx              # WebView シェル + 共有ブリッジ + オフライン
  app.json             # Bundle ID / 権限 / スプラッシュ
  eas.json             # EAS Build / Submit 設定
  src/config.ts        # 本番 URL
  assets/              # アイコン・スプラッシュ
  APP_STORE.md         # このガイド
  STORE_LISTING.md     # ASC に貼る文言
```

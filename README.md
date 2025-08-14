# CleanFeed Recording Guard

CleanFeedで録音ボタンの押し忘れを防止するChrome拡張機能です。録音ページを開いた時に要素ID"decks"が存在しない場合、録音を促す視覚的な警告を表示します。

## 機能

- 📍 **自動監視**: CleanFeedページを開くと自動的に録音状態を監視開始
- ⚠️ **視覚的警告**: 録音していない場合、目立つ警告ダイアログを表示  
- 🔄 **リアルタイム検出**: 録音開始・停止を自動検出して警告を制御
- ⏰ **自動非表示**: 10秒後に警告を自動で非表示（録音開始時は即座に非表示）
- 🎛️ **ポップアップUI**: 拡張機能アイコンから現在の状態確認とテスト機能
- 🎨 **直感的デザイン**: わかりやすいアニメーションと配色

## プロジェクト構成

```
my-chrome-extension
├── src
│   ├── background.ts        # バックグラウンドスクリプト（状態管理・バッジ表示）
│   ├── content.ts          # コンテンツスクリプト（CleanFeed監視・警告表示）
│   ├── popup
│   │   ├── popup.html      # ポップアップUI（状態表示・テスト機能）
│   │   ├── popup.ts        # ポップアップロジック（Chrome API連携）
│   │   └── popup.css       # ポップアップスタイル（モダンデザイン）
│   └── types
│       └── index.ts        # TypeScript型定義（Chrome API・メッセージ型）
├── manifest.json           # 拡張機能マニフェスト（権限・対象サイト設定）
├── package.json            # npm設定（依存関係・ビルドスクリプト）
├── tsconfig.json           # TypeScript設定（Chrome API型対応）
└── README.md               # プロジェクト説明書
```

## セットアップ・使用方法

### 1. 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd RecGuard

# 依存関係をインストール
npm install

# TypeScriptをビルド
npm run build
```

### 2. Chrome拡張機能として読み込み

1. Chromeを開き、`chrome://extensions/` にアクセス
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `my-chrome-extension` フォルダーを選択

### 3. 使用方法

1. **CleanFeedにアクセス**: https://cleanfeed.net にアクセス
2. **自動監視開始**: ページ読み込み後、自動的に録音監視が開始
3. **警告の確認**: 録音していない場合、赤い警告ダイアログが表示
4. **録音開始**: CleanFeedで録音ボタンを押すと警告が自動で消える

### 4. ポップアップ機能

拡張機能アイコンをクリックすると以下の機能が利用できます：

- **監視状態表示**: 現在の監視状況を確認
- **録音状態表示**: 録音の有無を確認  
- **テスト警告**: 警告ダイアログのテスト表示
- **CleanFeedを開く**: ワンクリックでCleanFeedにアクセス

## 技術仕様

### 監視ロジック

- **対象要素**: DOM内の`#decks > div:nth-child(3) > div > div.headline > div.text > div.name`要素の内容チェック
- **監視間隔**: 2秒ごとの定期チェック
- **警告表示条件**: 要素の内容が"..."の場合（録音停止中）
- **警告非表示条件**: 要素の内容が"..."以外の場合（録音中）、または10秒経過時

### Chrome API使用

- **activeTab権限**: アクティブタブへのアクセス
- **content_scripts**: CleanFeedドメインでの自動実行
- **runtime.sendMessage**: コンポーネント間通信
- **action.setBadgeText**: アイコンバッジでの状態表示

## 開発用コマンド

```bash
# 開発モード（ファイル監視ビルド）
npm run dev

# 本番ビルド
npm run build

# 配布用パッケージ作成
npm run package

# コード品質チェック
npm run lint

# ビルド出力クリア
npm run clean
```

## トラブルシューティング

### 警告が表示されない場合

1. 拡張機能が有効になっているか確認
2. CleanFeedのページが完全に読み込まれているか確認
3. ブラウザのコンソールでエラーメッセージを確認

### ポップアップが開かない場合

1. 拡張機能アイコンが表示されているか確認
2. 拡張機能を無効化→有効化で再読み込み
3. Chromeの再起動

### 型エラーが出る場合

```bash
# Chrome API型定義を再インストール
npm install @types/chrome --save-dev
```

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。機能改善や追加要望がありましたらお気軽にご連絡ください。

## Contributing

Feel free to submit issues or pull requests for any improvements or bug fixes. 

## License

This project is licensed under the MIT License.
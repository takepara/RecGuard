# CleanFeed Recording Guard

CleanFeedで録音ボタンの押し忘れを防止するChrome拡張機能です。CleanFeed Studioページで録音が開始されていない場合、録音を促す視覚的な警告を表示します。

## 機能

- 📍 **自動監視**: CleanFeed Studioページ（URLにクエリパラメータあり）で自動的に録音状態を監視開始
- ⚠️ **視覚的警告**: 録音していない場合、form.arrival要素の下に目立つ警告バナーを表示  
- 🔄 **リアルタイム検出**: 録音開始を自動検出して警告を制御・監視を停止
- ⏰ **自動非表示**: 10秒後に警告を自動で非表示（録音開始時は即座に非表示）
- 🎨 **直感的デザイン**: 伸縮アニメーションと目立つ配色で注意を促進

## プロジェクト構成

```
cleanfeed-extension/
├── src/
│   ├── content.ts          # コンテンツスクリプト（CleanFeed監視・警告表示）
│   └── types/
│       └── index.ts        # TypeScript型定義（AlertState）
├── cleanfeed-extension/
│   ├── manifest.json       # 拡張機能マニフェスト（権限・対象サイト設定）
│   └── images/             # アイコンファイル
├── build.sh                # ビルドスクリプト
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

# TypeScriptをビルド
./build.sh
```

### 2. Chrome拡張機能として読み込み

1. Chromeを開き、`chrome://extensions/` にアクセス
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `dist` フォルダーを選択

### 3. 使用方法

1. **CleanFeed Studioにアクセス**: https://cleanfeed.net/studio?[parameters] にアクセス
2. **自動監視開始**: ページ読み込み後、URLにクエリパラメータがある場合のみ自動的に録音監視が開始
3. **警告の確認**: 録音していない場合、form.arrival要素の下に赤い警告バナーが表示
4. **録音開始**: CleanFeedで録音ボタンを押すと警告が自動で消え、監視も停止

## 技術仕様

### 監視ロジック

- **対象要素**: DOM内の`#decks > div:nth-child(3) > div > div.headline > div.text > div.name`要素の内容チェック
- **監視間隔**: 3秒ごとの定期チェック
- **警告表示条件**: 要素の内容が"..."の場合（録音停止中）、または要素が見つからない場合
- **警告非表示条件**: 要素の内容が"..."以外の場合（録音中）、または10秒経過時
- **監視停止**: 録音が一度でも検出された後は、全ての監視とタイマーが停止

### Chrome API使用

- **activeTab権限**: アクティブタブへのアクセス
- **content_scripts**: CleanFeedドメインでの自動実行
- **軽量実装**: ServiceWorkerやポップアップなしのシンプル構成

## 開発用コマンド

```bash
# ビルド
./build.sh

# ビルド出力確認
ls -la dist/
```

## トラブルシューティング

### 警告が表示されない場合

1. 拡張機能が有効になっているか確認
2. CleanFeed StudioのURLにクエリパラメータ（?以降）が含まれているか確認
3. ブラウザのコンソールでエラーメッセージを確認

### 拡張機能が動作しない場合

1. 拡張機能を無効化→有効化で再読み込み
2. Chromeの再起動
3. `dist/`フォルダが正しく生成されているか確認

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。機能改善や追加要望がありましたらお気軽にご連絡ください。

## Contributing

Feel free to submit issues or pull requests for any improvements or bug fixes. 

## License

This project is licensed under the MIT License.
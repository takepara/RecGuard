#!/bin/bash

# CleanFeed Recording Guard ビルドスクリプト

echo "🔧 CleanFeed Recording Guard をビルド中..."

# ディレクトリをクリーンアップ
echo "📁 ディレクトリをクリーンアップ中..."
rm -rf dist
mkdir -p dist

# TypeScriptをコンパイル
echo "⚙️  TypeScriptをコンパイル中..."
npx tsc

if [ $? -ne 0 ]; then
    echo "❌ TypeScriptコンパイルに失敗しました"
    exit 1
fi

# 必要なファイルをdistディレクトリにコピー
echo "📄 ファイルをコピー中..."

# manifest.jsonをコピー
cp my-chrome-extension/manifest.json dist/

# HTMLとCSSファイルをコピー
cp src/popup/popup.html dist/
cp src/popup/popup.css dist/

# アイコン用ディレクトリを作成（アイコンファイルが存在する場合）
mkdir -p dist/images

# アイコンファイルが存在しない場合は、プレースホルダーを作成
if [ ! -f "my-chrome-extension/images/icon16.png" ]; then
    echo "🖼️  アイコンファイルが見つからないため、プレースホルダーを作成します..."
    # 簡単なSVGアイコンを作成（本番では適切なPNGアイコンを使用してください）
    mkdir -p my-chrome-extension/images
fi

# images フォルダが存在する場合はコピー
if [ -d "my-chrome-extension/images" ]; then
    cp -r my-chrome-extension/images dist/
fi

echo "✅ ビルド完了！"
echo "📂 拡張機能ファイルは dist/ ディレクトリにあります"
echo ""
echo "🚀 Chrome拡張機能として読み込むには："
echo "   1. chrome://extensions/ を開く"
echo "   2. デベロッパーモードを有効にする"
echo "   3. 'パッケージ化されていない拡張機能を読み込む' をクリック"
echo "   4. dist/ フォルダーを選択"

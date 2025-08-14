// CleanFeed Recording Guard - Background Script
// サービスワーカーとして動作する背景スクリプト

// タブの更新を監視
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // CleanFeedのstudioページが読み込まれた時
  if (changeInfo.status === 'complete' && tab.url?.includes('cleanfeed.net/studio')) {
    // バッジを設定してアクティブ状態を示す
    chrome.action.setBadgeText({
      text: '●',
      tabId: tabId
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#ff4444',
      tabId: tabId
    });
  }
});

// コンテンツスクリプトからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'RECORDING_STATUS_CHANGED':
      // 録音状態が変更された時の処理
      handleRecordingStatusChange(message.isRecording, sender.tab?.id);
      break;
  }
  
  sendResponse({ success: true });
});

// 録音状態変更時の処理
function handleRecordingStatusChange(isRecording: boolean, tabId?: number) {
  if (!tabId) return;
  
  if (isRecording) {
    // 録音中 - 緑色のバッジ
    chrome.action.setBadgeText({
      text: '🔴',
      tabId: tabId
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#00ff00',
      tabId: tabId
    });
  } else {
    // 録音停止 - 赤色のバッジ
    chrome.action.setBadgeText({
      text: '●',
      tabId: tabId
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#ff4444',
      tabId: tabId
    });
  }
}
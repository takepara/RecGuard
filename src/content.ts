// CleanFeed Recording Guard - Content Script
// 録音ボタンの押し忘れを防止する機能

interface AlertState {
  isShowing: boolean;
  timeoutId?: number;
}

// Chrome拡張のコンテキストが有効かチェックするヘルパー関数
function isExtensionContextValid(): boolean {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch (error) {
    return false;
  }
}

class RecordingGuard {
  private alertState: AlertState = { isShowing: false };
  private fallbackTimer?: number;
  private readonly ALERT_DURATION_MS = 10000; // 10秒間表示
  private readonly FALLBACK_CHECK_MS = 3000; // 3秒ごとのフォールバックチェック
  private recordingDetected: boolean = false; // 録音が一度でも検出されたかのフラグ
  private escapeHandler?: (e: KeyboardEvent) => void; // ESCキーハンドラーの参照
  private messageListener?: (message: any, sender: any, sendResponse: any) => void; // メッセージリスナーの参照

  constructor() {
    this.init();
    this.setupMessageListener();
  }

  private init(): void {
    // ページが完全に読み込まれるまで待機
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
    } else {
      this.startMonitoring();
    }
  }

  private setupMessageListener(): void {
    // ポップアップからのメッセージを受信
    this.messageListener = (message, sender, sendResponse) => {
      switch (message.type) {
        case 'GET_RECORDING_STATUS':
          // Name要素の内容をチェック（録音中かどうか）
          const nameElement = document.querySelector('#decks > div:nth-child(3) > div > div.headline > div.text > div.name') as HTMLElement;
          let isRecording = false;
          
          if (nameElement) {
            const nameContent = nameElement.textContent?.trim() || '';
            // "..." でない場合は録音中と判定
            isRecording = nameContent !== '...';
          }
          
          sendResponse({ 
            isRecording, 
            hasNameElement: nameElement !== null,
            recordingDetected: this.recordingDetected 
          });
          break;
        
        case 'SHOW_TEST_ALERT':
          // 録音が検出されていない場合のみテスト警告を表示
          if (!this.recordingDetected) {
            this.showRecordingAlert();
          }
          sendResponse({ success: true });
          break;
        
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    };
    
    chrome.runtime.onMessage.addListener(this.messageListener);
  }

  private startMonitoring(): void {
    // URLにパラメータが含まれているかチェック（より柔軟に）
    const currentUrl = window.location.href;
    const hasStudio = currentUrl.includes('/studio');
    
    if (!hasStudio) {
      return;
    }
    
    // 初回チェック
    this.checkRecordingStatus();
    
    // タイマーベースの監視を開始
    this.startFallbackTimer();
  }

  private startFallbackTimer(): void {
    this.fallbackTimer = window.setInterval(() => {
      if (!this.recordingDetected) {
        this.checkRecordingStatus();
      }
    }, this.FALLBACK_CHECK_MS);
  }

  private shouldSkipMonitoring(): boolean {
    // ログイン画面や重複表示の除外条件
    const loginElement = document.querySelector('div.login');
    const overlayElement = document.querySelector('div#overlay.engaged');
    
    return !!(loginElement || overlayElement);
  }

  private stopMonitoring(): void {
    // タイマーを停止
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = undefined;
    }
    
    // メッセージリスナーを削除
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = undefined;
    }
    
    // ESCキーリスナーを削除
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = undefined;
    }
  }

  private checkRecordingStatus(): void {
    // 録音が一度でも検出された場合は、以降のチェックを停止
    if (this.recordingDetected) {
      return;
    }
    
    // 除外条件の再チェック
    if (this.shouldSkipMonitoring()) {
      if (this.alertState.isShowing) {
        this.hideRecordingAlert();
      }
      return;
    }
    
    // 録音中の判定: #decks > div:nth-child(3) > div > div.headline > div.text > div.name 要素の内容をチェック
    const nameElement = document.querySelector('#decks > div:nth-child(3) > div > div.headline > div.text > div.name') as HTMLElement;
    
    if (!nameElement) {
      // name要素が見つからない場合は警告を表示
      if (!this.alertState.isShowing) {
        this.showRecordingAlert();
      }
      return;
    }
    
    const nameContent = nameElement.textContent?.trim() || '';
    const isRecording = nameContent !== '...';
    
    // 録音が検出された場合、フラグを設定してチェックを停止
    if (isRecording) {
      this.recordingDetected = true;
      this.hideRecordingAlert(); // 警告を非表示
      this.stopMonitoring(); // 監視を停止
      
      // バックグラウンドスクリプトに状態変更を通知（エラーハンドリング付き）
      try {
        if (isExtensionContextValid()) {
          chrome.runtime.sendMessage({
            type: 'RECORDING_STATUS_CHANGED',
            isRecording: true
          }).catch(() => {
            // Extension context invalidated の場合は無視
          });
        }
      } catch (error) {
        // Extension context invalidated の場合は無視
      }
      return;
    }
    
    // 録音中でない場合（内容が"..."の場合）に警告を表示
    if (!isRecording && !this.alertState.isShowing) {
      this.showRecordingAlert();
      
      // バックグラウンドスクリプトに状態変更を通知（エラーハンドリング付き）
      try {
        if (isExtensionContextValid()) {
          chrome.runtime.sendMessage({
            type: 'RECORDING_STATUS_CHANGED',
            isRecording: false
          }).catch(() => {
            // Extension context invalidated の場合は無視
          });
        }
      } catch (error) {
        // Extension context invalidated の場合は無視
      }
    }
  }

  private showRecordingAlert(): void {
    if (this.alertState.isShowing) return;

    this.alertState.isShowing = true;

    // 警告要素を作成（適切な場所に配置）
    const alertElement = this.createAlertOverlay();
    // createAlertOverlay内で適切な場所に配置されるため、ここでは何もしない

    // バックグラウンドスクリプトに警告表示を通知（エラーハンドリング付き）
    try {
      if (isExtensionContextValid()) {
        chrome.runtime.sendMessage({
          type: 'ALERT_SHOWN',
          timestamp: Date.now()
        }).catch(() => {
          // Extension context invalidated の場合は無視
        });
      }
    } catch (error) {
      // Extension context invalidated の場合は無視
    }

    // 一定時間後に自動で非表示にする
    this.alertState.timeoutId = window.setTimeout(() => {
      this.hideRecordingAlert();
    }, this.ALERT_DURATION_MS);
  }

  private createAlertOverlay(): HTMLElement {
    // CleanFeedロゴの下に警告を挿入
    const cleanfeedImg = document.querySelector('img[alt="Cleanfeed"]') as HTMLElement;
    
    if (!cleanfeedImg) {
      return this.createTopBannerAlert();
    }

    // CleanFeedロゴの親要素を取得
    const logoContainer = cleanfeedImg.parentElement;
    if (!logoContainer) {
      return this.createTopBannerAlert();
    }

    // 警告要素を作成
    const alertDiv = document.createElement('div');
    alertDiv.id = 'cleanfeed-recording-alert';
    alertDiv.style.cssText = `
      background: linear-gradient(135deg, #ff4444, #ff6666);
      color: white;
      padding: 20px;
      margin: 10px auto;
      max-width: 90%;
      width: 90%;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
      border: 3px solid #cc3333;
      animation: recordingAlert 2s infinite;
      position: relative;
      z-index: 1000;
      box-sizing: border-box;
    `;

    alertDiv.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;">
        <span style="font-size: 32px;">🎙️</span>
        <div>
          <div style="font-size: 22px; margin-bottom: 5px;">⚠️ 録音確認が必要です ⚠️</div>
          <div style="font-size: 16px; font-weight: normal; opacity: 0.9;">
            CleanFeedで録音が開始されていない可能性があります
          </div>
        </div>
      </div>
      <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 6px; margin-bottom: 0;">
        <strong style="font-size: 18px;">録音ボタンを押すことを忘れていませんか？</strong>
      </div>
    `;

    // CSSアニメーションを追加
    const style = document.createElement('style');
    style.textContent = `
      @keyframes recordingAlert {
        0% { 
          transform: scale(1); 
          box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
          max-width: 90%;
        }
        50% { 
          transform: scale(1.02); 
          box-shadow: 0 6px 20px rgba(255, 68, 68, 0.5);
          max-width: 90%;
        }
        100% { 
          transform: scale(1); 
          box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
          max-width: 90%;
        }
      }
      
      #cleanfeed-recording-alert {
        transform-origin: center;
      }
      
      @media (max-width: 768px) {
        #cleanfeed-recording-alert {
          font-size: 16px !important;
          padding: 15px !important;
          max-width: 95% !important;
          width: 95% !important;
        }
      }
      
      @media (max-width: 480px) {
        #cleanfeed-recording-alert {
          font-size: 14px !important;
          padding: 12px !important;
          max-width: 98% !important;
          width: 98% !important;
        }
      }
    `;
    document.head.appendChild(style);

    // ロゴの直後に挿入
    logoContainer.insertAdjacentElement('afterend', alertDiv);

    // ESCキーで閉じる
    this.escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.hideRecordingAlert();
        if (this.escapeHandler) {
          document.removeEventListener('keydown', this.escapeHandler);
          this.escapeHandler = undefined;
        }
      }
    };
    document.addEventListener('keydown', this.escapeHandler);

    return alertDiv;
  }

  // フォールバック用のトップバナー警告
  private createTopBannerAlert(): HTMLElement {
    const alertBanner = document.createElement('div');
    alertBanner.id = 'cleanfeed-recording-alert';
    alertBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 5%;
      right: 5%;
      width: 90%;
      max-width: 90%;
      background: linear-gradient(135deg, #ff4444, #ff6666);
      color: white;
      padding: 15px 20px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      animation: slideDown 0.3s ease-out;
      box-sizing: border-box;
    `;

    alertBanner.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
        <span style="font-size: 24px;">🎙️</span>
        <span>⚠️ 録音確認: CleanFeedで録音が開始されていない可能性があります</span>
      </div>
    `;

    document.body.appendChild(alertBanner);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from { 
          transform: translateY(-100%); 
          max-width: 90%;
        }
        to { 
          transform: translateY(0); 
          max-width: 90%;
        }
      }
    `;
    document.head.appendChild(style);

    return alertBanner;
  }

  private hideRecordingAlert(): void {
    if (!this.alertState.isShowing) return;

    const alertElement = document.getElementById('cleanfeed-recording-alert');
    if (alertElement) {
      alertElement.remove();
    }

    if (this.alertState.timeoutId) {
      clearTimeout(this.alertState.timeoutId);
      this.alertState.timeoutId = undefined;
    }

    // ESCキーリスナーを削除
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = undefined;
    }

    this.alertState.isShowing = false;

    // バックグラウンドスクリプトに警告非表示を通知（エラーハンドリング付き）
    try {
      if (isExtensionContextValid()) {
        chrome.runtime.sendMessage({
          type: 'ALERT_DISMISSED',
          timestamp: Date.now()
        }).catch(() => {
          // Extension context invalidated の場合は無視
        });
      }
    } catch (error) {
      // Extension context invalidated の場合は無視
    }
  }

  public destroy(): void {
    try {
      this.stopMonitoring();
      this.hideRecordingAlert();
      
      // beforeunloadイベントリスナーも削除
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    } catch (error) {
      // Extension context invalidated の場合は無視
    }
  }
}

// Recording Guardを初期化
const recordingGuard = new RecordingGuard();

// ページ離脱時のクリーンアップ（エラーハンドリング付き）
const beforeUnloadHandler = () => {
  try {
    recordingGuard.destroy();
  } catch (error) {
    // Extension context invalidated の場合は無視
  }
};

window.addEventListener('beforeunload', beforeUnloadHandler);
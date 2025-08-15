// CleanFeed Recording Guard - Content Script
// 録音ボタンの押し忘れを防止する機能

interface AlertState {
  isShowing: boolean;
  timeoutId?: number;
}

class RecordingGuard {
  private alertState: AlertState = { isShowing: false };
  private fallbackTimer?: number;
  private readonly ALERT_DURATION_MS = 10000; // 10秒間表示
  private readonly FALLBACK_CHECK_MS = 3000; // 3秒ごとのフォールバックチェック
  private recordingDetected: boolean = false; // 録音が一度でも検出されたかのフラグ

  constructor() {
    this.init();
  }

  private init(): void {
    // ページが完全に読み込まれるまで待機
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
    } else {
      this.startMonitoring();
    }
  }

  private startMonitoring(): void {
    // 録音が検出済みの場合は監視不要
    if (this.recordingDetected) {
      return;
    }

    // URLにパラメータが含まれているかチェック（より柔軟に）
    const currentUrl = window.location.href;
    const hasStudio = currentUrl.includes('/studio');
    const hasQuery = currentUrl.includes('?');
    
    if (!hasStudio || !hasQuery) {
      return;
    }
    
    // 初回チェック
    this.checkRecordingStatus();
    
    // タイマーベースの監視を開始
    this.startFallbackTimer();
  }

  private startFallbackTimer(): void {
    // 既存のタイマーがあれば削除
    if (this.fallbackTimer) {
      window.clearInterval(this.fallbackTimer);
      this.fallbackTimer = undefined;
    }

    this.fallbackTimer = window.setInterval(() => {
      if (this.recordingDetected) {
        this.stopMonitoring();
        return;
      }
      this.checkRecordingStatus();
    }, this.FALLBACK_CHECK_MS);
  }

  private shouldSkipMonitoring(): boolean {
    // ログイン画面や重複表示の除外条件
    const loginElement = document.querySelector('div.login');
    const overlayElement = document.querySelector('div#overlay.engaged');
    
    return !!(loginElement || overlayElement);
  }

  private stopMonitoring(): void {
    // タイマーの確実な削除
    if (this.fallbackTimer) {
      window.clearInterval(this.fallbackTimer);
      this.fallbackTimer = undefined;
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
      return;
    }
    
    // 録音中でない場合（内容が"..."の場合）に警告を表示
    if (!isRecording && !this.alertState.isShowing) {
      this.showRecordingAlert();
    }
  }

  private showRecordingAlert(): void {
    if (this.alertState.isShowing) return;

    this.alertState.isShowing = true;

    // 警告要素を作成（適切な場所に配置）
    const alertElement = this.createAlertOverlay();
    // createAlertOverlay内で適切な場所に配置されるため、ここでは何もしない

    // 一定時間後に自動で非表示にする
    this.alertState.timeoutId = window.setTimeout(() => {
      this.hideRecordingAlert();
    }, this.ALERT_DURATION_MS);
  }

  private createAlertOverlay(): HTMLElement {
    // 常にボトムバナー警告を使用
    return this.createBottomBannerAlert();
  }

  // ページ下部の警告バナー
  private createBottomBannerAlert(): HTMLElement {
    // form.arrivalの下に配置を試みる
    const arrivalForm = document.querySelector('form.arrival') as HTMLElement;
    
    const alertBanner = document.createElement('div');
    alertBanner.id = 'cleanfeed-recording-alert';
    
    if (arrivalForm) {
      // form.arrivalの下に配置
      alertBanner.style.cssText = `
        background: linear-gradient(135deg, #ff4444, #ff6666);
        color: white;
        padding: 25px 20px;
        margin: 15px 0;
        width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        font-size: 18px;
        font-weight: 600;
        text-align: center;
        box-shadow: 0 6px 25px rgba(255, 68, 68, 0.4);
        border-radius: 12px;
        animation: pulseScale 2s infinite ease-in-out;
        box-sizing: border-box;
        border: 3px solid rgba(255,255,255,0.4);
        position: relative;
        z-index: 1000;
      `;
      
      // form.arrivalの直後に挿入
      arrivalForm.insertAdjacentElement('afterend', alertBanner);
    } else {
      // フォールバック: 固定位置（ページ下部）
      alertBanner.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 5%;
        right: 5%;
        width: 90%;
        max-width: 90%;
        background: linear-gradient(135deg, #ff4444, #ff6666);
        color: white;
        padding: 25px 20px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        font-size: 18px;
        font-weight: 600;
        text-align: center;
        box-shadow: 0 6px 25px rgba(0,0,0,0.4);
        border-radius: 12px;
        animation: pulseScale 2s infinite ease-in-out;
        box-sizing: border-box;
        border: 3px solid rgba(255,255,255,0.4);
      `;
      
      document.body.appendChild(alertBanner);
    }

    alertBanner.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
        <span style="font-size: 32px;">🎙️</span>
        <div style="text-align: left;">
          <div style="font-size: 24px; margin-bottom: 8px; font-weight: 700;">⚠️ 録音確認が必要です ⚠️</div>
          <div style="font-size: 16px; font-weight: normal; opacity: 0.95;">
            CleanFeedで録音が開始されていない可能性があります
          </div>
        </div>
      </div>
      <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; margin-top: 15px;">
        <strong style="font-size: 20px;">📹 録音ボタンを押すことを忘れていませんか？</strong>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulseScale {
        0% { 
          transform: scale(1);
          box-shadow: 0 6px 25px rgba(255, 68, 68, 0.4);
        }
        50% { 
          transform: scale(1.03);
          box-shadow: 0 8px 30px rgba(255, 68, 68, 0.6);
        }
        100% { 
          transform: scale(1);
          box-shadow: 0 6px 25px rgba(255, 68, 68, 0.4);
        }
      }
      
      #cleanfeed-recording-alert {
        transform-origin: center;
      }
      
      @media (max-width: 768px) {
        #cleanfeed-recording-alert {
          font-size: 16px !important;
          padding: 20px 15px !important;
          max-width: 95% !important;
          width: 95% !important;
          bottom: 15px !important;
        }
        
        #cleanfeed-recording-alert div[style*="font-size: 24px"] {
          font-size: 20px !important;
        }
        
        #cleanfeed-recording-alert div[style*="font-size: 20px"] {
          font-size: 18px !important;
        }
      }
      
      @media (max-width: 480px) {
        #cleanfeed-recording-alert {
          font-size: 14px !important;
          padding: 18px 12px !important;
          max-width: 98% !important;
          width: 98% !important;
          bottom: 10px !important;
        }
        
        #cleanfeed-recording-alert div[style*="font-size: 24px"] {
          font-size: 18px !important;
        }
        
        #cleanfeed-recording-alert div[style*="font-size: 20px"] {
          font-size: 16px !important;
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

    // タイムアウトの確実な削除
    if (this.alertState.timeoutId) {
      window.clearTimeout(this.alertState.timeoutId);
      this.alertState.timeoutId = undefined;
    }

    this.alertState.isShowing = false;
  }

  public destroy(): void {
    try {
      this.stopMonitoring();
      this.hideRecordingAlert();
    } catch (error) {
      // Extension context invalidated の場合は無視
    }
  }
}

// グローバル変数のリークを防ぐため、適切な初期化
let recordingGuard: RecordingGuard | null = null;

// 重複初期化を防ぐ
if (!recordingGuard) {
  recordingGuard = new RecordingGuard();
}

// ページ離脱時のクリーンアップ
const beforeUnloadHandler = () => {
  try {
    if (recordingGuard) {
      recordingGuard.destroy();
      recordingGuard = null;
    }
  } catch (error) {
    // Extension context invalidated の場合は無視
  }
};

window.addEventListener('beforeunload', beforeUnloadHandler);
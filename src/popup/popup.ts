// CleanFeed Recording Guard - Popup Script

import { RecordingGuardMessage } from '../types/index';

interface PopupElements {
  monitoringStatus: HTMLElement;
  recordingStatus: HTMLElement;
  testAlert: HTMLButtonElement;
}

class PopupController {
  private elements: PopupElements;

  constructor() {
    this.elements = this.getElements();
    this.init();
  }

  private getElements(): PopupElements {
    return {
      monitoringStatus: document.getElementById('monitoring-status')!,
      recordingStatus: document.getElementById('recording-status')!,
      testAlert: document.getElementById('testAlert') as HTMLButtonElement
    };
  }

  private init(): void {
    this.setupEventListeners();
    this.updateStatus();
  }

  private setupEventListeners(): void {
    // テスト警告ボタン
    this.elements.testAlert.addEventListener('click', () => {
      this.sendTestAlert();
    });
  }

  private async updateStatus(): Promise<void> {
    try {
      // アクティブなタブを取得
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url?.includes('cleanfeed.net/studio') && tab.url?.includes('?')) {
        this.setMonitoringStatus('監視中', 'active');
        this.checkRecordingStatus(tab.id!);
      } else if (tab.url?.includes('cleanfeed.net/studio')) {
        this.setMonitoringStatus('パラメータ不足', 'waiting');
        this.setRecordingStatus('監視対象外', 'inactive');
      } else {
        this.setMonitoringStatus('CleanFeed Studioページなし', 'inactive');
        this.setRecordingStatus('N/A', 'inactive');
      }
    } catch (error) {
      this.setMonitoringStatus('エラー', 'inactive');
    }
  }

  private setMonitoringStatus(text: string, status: 'active' | 'inactive' | 'waiting'): void {
    this.elements.monitoringStatus.textContent = text;
    this.elements.monitoringStatus.className = `status ${status}`;
  }

  private setRecordingStatus(text: string, status: 'active' | 'inactive' | 'waiting'): void {
    this.elements.recordingStatus.textContent = text;
    this.elements.recordingStatus.className = `status ${status}`;
  }

  private async checkRecordingStatus(tabId: number): Promise<void> {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { 
        type: 'GET_RECORDING_STATUS' 
      });
      
      if (response?.isRecording) {
        this.setRecordingStatus('録音中', 'active');
      } else if (response?.hasNameElement) {
        this.setRecordingStatus('録音なし', 'inactive');
      } else {
        this.setRecordingStatus('要素未検出', 'waiting');
      }
    } catch (error) {
      this.setRecordingStatus('不明', 'waiting');
    }
  }

  private async sendTestAlert(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url?.includes('cleanfeed.net/studio')) {
        await chrome.tabs.sendMessage(tab.id!, { 
          type: 'SHOW_TEST_ALERT' 
        });
      } else {
        alert('CleanFeed Studioのページでテストしてください');
      }
    } catch (error) {
      alert('エラーが発生しました');
    }
  }
}

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// バックグラウンドスクリプトからのメッセージを受信
chrome.runtime.onMessage.addListener((message: RecordingGuardMessage, sender, sendResponse) => {
  // ステータスの更新など、必要に応じて処理
  sendResponse({ success: true });
});

export {};
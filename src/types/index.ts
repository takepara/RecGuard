// CleanFeed Recording Guard - 型定義

export type PopupMessage = {
    type: string;
    payload?: any;
};

export interface BackgroundEvent {
    eventType: string;
    timestamp: number;
}

export type ContentScriptResponse = {
    success: boolean;
    data?: any;
    error?: string;
};

// Chrome拡張機能関連の型定義
export interface RecordingGuardMessage {
    type: 'RECORDING_STATUS_CHANGED' | 'ALERT_SHOWN' | 'ALERT_DISMISSED' | 'GET_RECORDING_STATUS' | 'SHOW_TEST_ALERT';
    isRecording?: boolean;
    timestamp?: number;
    hasNameElement?: boolean;
}

export interface AlertState {
    isShowing: boolean;
    timeoutId?: number;
}

// CleanFeed関連の型定義
export interface CleanFeedElements {
    decks: HTMLElement | null;
    recordButton: HTMLElement | null;
}
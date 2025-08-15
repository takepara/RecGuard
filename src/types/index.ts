// CleanFeed Recording Guard - 型定義

export interface AlertState {
  isShowing: boolean;
  timeoutId?: number;
}

// CleanFeed関連の型定義
export interface CleanFeedElements {
    decks: HTMLElement | null;
    recordButton: HTMLElement | null;
}
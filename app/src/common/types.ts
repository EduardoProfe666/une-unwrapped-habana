export interface TelegramMessage {
  id: number;
  link: string;
  date_utc: string;
  date_utc_d?: string;
  date_cuba: string;
  date_cuba_d?: string;
  reactions: Record<string, number>;
  views: number;
  replies: number;
  text: string;
  count?: number;
}

export enum MessageType {
  GENERAL_INFORMATION = 1,
  DAF = 2,
  FAILURE_BY_ZONE = 3,
  DAILY_RESUME = 4,
  BLOCK_INFORMATION = 5
}

export interface BlockAnalysis {
  number: number;
  mentions: number;
  declared_recoveries: number;
  declared_affectations: number;
  declared_emergencies: number;
}

export interface SenFailureEvent {
  start_date: string;
  start_date_d?: string;
  start_message: TelegramMessage;
  end_date: string;
  end_date_d?: string;
  end_message: TelegramMessage;
  estimated_duration_seconds: number;
}

export interface SenAnalysis {
  mentions: number;
  total_failure_events: number;
  failure_events: SenFailureEvent[];
}

export interface UneAnalysis {
  sync_date: string;
  year: number;
  first_message: TelegramMessage;
  last_message: TelegramMessage;
  shortest_message: TelegramMessage;
  longest_message: TelegramMessage;
  
  total_views: number;
  total_messages: number;
  total_erased_messages: number;
  total_replies: number;
  total_reactions: number;
  total_positive_reactions: number;
  total_negative_reactions: number;
  
  avg_views: number;
  avg_replies: number;
  avg_reactions: number;
  avg_positive_reactions: number;
  avg_negative_reactions: number;
  avg_text_length: number;
  
  monthly_views: Record<string, number>;
  monthly_replies: Record<string, number>;
  monthly_reactions: Record<string, number>;
  monthly_messages: Record<string, number>;
  daily_messages: Record<number, number>;

  distribution_message: Record<string, number>;
  distribution_reaction: Record<string, number>;
  
  top3_most_viewed_messages: TelegramMessage[];
  top3_most_replied_messages: TelegramMessage[];
  top3_most_positive_reaction_messages: TelegramMessage[];
  top3_most_negative_reaction_messages: TelegramMessage[];
  
  top25_most_repeated_words: Record<string, number>;
  
  blocks_analysis: BlockAnalysis[];
  sen_analysis: SenAnalysis;
}

export type YearTheme = {
  bg: string;
  primary: string;
  secondary: string;
  accent: string;
}
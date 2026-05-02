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

export interface BlockTopZone {
  name: string;
  count: number;
}

export interface BlockAnalysis {
  number: number;
  mentions: number;
  declared_recoveries: number;
  declared_affectations: number;
  declared_emergencies: number;
  estimated_affected_seconds: number;
  weekday_off_seconds: Record<number, number>;
  weekday_off_avg_seconds: Record<number, number>;

  // AI-derived detailed stats (optional)
  monthly_affectations?: Record<string, number>;
  hourly_affectations?: Record<string, number>;
  severity_breakdown?: Record<string, number>;
  co_occurrences?: Record<string, number>;
  top_municipalities?: BlockTopZone[];
  top_circuits?: BlockTopZone[];
  worst_day_date?: string;
  worst_day_events?: number;
  avg_deficit_mw?: number | null;
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

// ---- AI ENRICHMENT types ---- //

export type Severity = "low" | "medium" | "high" | "critical";
export type SenStatus = "normal" | "active_failure" | "recovering" | "unknown";

export interface AffectedZone {
  name: string;
  kind: "province" | "municipality" | "circuit";
  mentions: number;
  affectations: number;
  recoveries: number;
}

export interface PowerPoint {
  date: string;
  demand: number | null;
  availability: number | null;
  deficit: number | null;
  is_forecast: boolean;
}

export interface ThermalPlantStats {
  canonical: string;
  city: string;
  mentions: number;
  failures: number;
  recoveries: number;
  monthly_activity: number[];
  last_status: SenStatus;
}

export interface WorstDay {
  date: string;
  critical_events: number;
  high_events: number;
  affected_blocks_count: number;
  deficit_mw: number | null;
  sample_message_id: number;
  sample_summary: string;
}

export interface CalmestDay {
  date: string;
  total_events: number;
  sample_message_id: number;
}

export interface YearRecords {
  longest_clean_streak_days: number;
  longest_clean_streak_start: string;
  longest_clean_streak_end: string;
  days_since_sen_failure: number | null;
  days_since_critical_event: number | null;
  days_since_block_affectation: number | null;
  last_sen_failure_date: string;
  last_critical_event_date: string;
  last_block_affectation_date: string;
}

export interface TopQuote {
  message_id: number;
  text_preview: string;
  date: string;
  views: number;
  reactions_total: number;
  metric: 'views' | 'replies' | 'reactions' | string;
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

  // AI enrichment (optional — empty/null when no AI rows exist for the year)
  ai_categories_distribution?: Record<string, number>;
  affected_zones?: AffectedZone[];
  daily_severity?: Record<string, Severity>;
  power_timeline?: PowerPoint[];
  thermal_units?: ThermalPlantStats[];
  hour_of_day_severity?: Record<string, number>;
  worst_day?: WorstDay | null;
  live_grid_status?: SenStatus;

  // Wrapped sections
  calmest_day?: CalmestDay | null;
  year_records?: YearRecords | null;
  health_score?: number;
  health_breakdown?: Record<string, number>;
  avg_ai_confidence?: number;
  weekly_hourly_severity?: Record<string, number>;
  ai_categories_monthly?: Record<string, number[]>;
  sentiment_monthly?: Record<string, number>;
  top_quotes?: TopQuote[];
  blackout_probability_now?: number;
}

export type YearTheme = {
  bg: string;
  primary: string;
  secondary: string;
  accent: string;
}
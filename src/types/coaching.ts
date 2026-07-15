export type GoalMetric = "cs_at_10" | "deaths_before_15" | "vision_score";

export interface CoachingGoal {
  id: string;
  title: string;
  metric: GoalMetric;
  current: number;
  target: number;
  unit: string;
  completed: boolean;
}

export interface CoachingSummary {
  player: {
    riotId: string;
    region: string;
    primaryRole: string;
  };
  focus: string;
  coachMessage: string;
  goals: CoachingGoal[];
  generatedAt: string;
}

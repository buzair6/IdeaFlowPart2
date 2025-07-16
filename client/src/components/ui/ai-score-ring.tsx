interface AiScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function AiScoreRing({ score, size = "md" }: AiScoreRingProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-xs",
    lg: "w-12 h-12 text-sm",
  };

  return (
    <div
      className={`ai-score-ring ${sizeClasses[size]} flex items-center justify-center`}
      style={{ "--score": score } as React.CSSProperties}
    >
      <span className="font-bold text-primary">{score}</span>
    </div>
  );
}

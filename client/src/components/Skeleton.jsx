export const SkeletonBox = ({
  width = "100%",
  height = "20px",
  radius = "6px",
}) => (
  <div
    className="skeleton-box"
    style={{ width, height, borderRadius: radius }}
  />
);

export const SkeletonTable = ({ rows = 4, cols = 5 }) => (
  <div className="data-table skeleton-table">
    <div className="skeleton-table-header">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBox key={i} height="12px" width="70%" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="skeleton-table-row">
        {Array.from({ length: cols }).map((_, c) => (
          <SkeletonBox key={c} height="14px" width={c === 0 ? "85%" : "60%"} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="stat-card">
    <SkeletonBox height="12px" width="60%" />
    <div style={{ marginTop: "0.7rem" }}>
      <SkeletonBox height="28px" width="40%" />
    </div>
  </div>
);

export const SkeletonStatsGrid = ({ count = 4 }) => (
  <div className="stats-grid">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

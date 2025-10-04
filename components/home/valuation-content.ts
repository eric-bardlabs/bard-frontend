// Types for content generation
export interface ValuationConsideration {
  title: string;
  description: string;
  opportunities?: string[];
  characteristics?: string[];
}

// Generate user-friendly valuation consideration based on genre score
export const getGenreValuationConsideration = (score: number): ValuationConsideration | null => {
  if (score >= 4.5) {
    return {
      title: "Evergreen, Cross-Generational Appeal",
      description:
        "These genres have demonstrated consistent market demand across multiple decades and appeal to diverse age groups.",
      opportunities: [
        "Sync licensing",
        "Cover versions",
        "Sampling",
        "Radio play",
      ],
    };
  } else if (score >= 3.5) {
    return {
      title: "Popular but Cyclical",
      description:
        "These genres experience periodic popularity cycles with established fan bases and clear revenue streams.",
      opportunities: [
        "Sync licensing",
        "Live performances",
        "Streaming",
        "Merchandising",
      ],
    };
  } else if (score >= 2.5) {
    return {
      title: "Niche but Loyal",
      description:
        "These genres have dedicated, consistent audiences with predictable but limited market reach.",
      opportunities: [
        "Streaming",
        "Live shows",
        "Merchandise",
        "Fan engagement",
      ],
    };
  } else if (score >= 1.5) {
    return {
      title: "Trend-Driven",
      description:
        "These genres experience rapid popularity spikes followed by potential decline, with high social media engagement.",
      opportunities: [
        "Viral content",
        "Social media",
        "Short-term licensing",
        "Brand partnerships",
      ],
    };
  } else if (score >= 0.5) {
    return {
      title: "Declining Market Demand",
      description:
        "These genres show reduced current market activity and limited mainstream commercial presence.",
      opportunities: [
        "Historical value",
        "Specialized licensing",
        "Collector interest",
        "Archive use",
      ],
    };
  } else {
    return null;
  }
};

// Generate user-friendly age score consideration based on average age score
export const getAgeScoreConsideration = (score: number): ValuationConsideration | null => {
  if (score === 0) return null; // No tracks to analyze

  if (score >= 4.5) {
    return {
      title: "Mature Catalog",
      description:
        "Your catalog contains tracks with 10+ years of market presence, indicating established commercial history.",
      characteristics: [
        "Long-term market testing",
        "Proven commercial viability",
        "Established audience base",
        "Historical performance data",
      ],
    };
  } else if (score >= 3.5) {
    return {
      title: "Established Catalog",
      description:
        "Your catalog features tracks with 5-9 years of market presence, showing consistent commercial activity.",
      characteristics: [
        "Mid-term market presence",
        "Established fan base",
        "Proven revenue streams",
        "Market stability",
      ],
    };
  } else if (score >= 2.5) {
    return {
      title: "Developing Catalog",
      description:
        "Your catalog includes tracks with 2-4 years of market presence, indicating growing commercial activity.",
      characteristics: [
        "Recent market entry",
        "Growing audience",
        "Developing revenue",
        "Market expansion",
      ],
    };
  } else if (score >= 1.5) {
    return {
      title: "Emerging Catalog",
      description:
        "Your catalog contains tracks with less than 2 years of market presence, showing early commercial development.",
      characteristics: [
        "New market presence",
        "Building audience",
        "Initial revenue",
        "Market testing",
      ],
    };
  } else {
    return {
      title: "New Catalog",
      description:
        "Your catalog has limited market history, with most tracks being recent releases or having unknown release dates.",
      characteristics: [
        "Limited market data",
        "Early stage",
        "Unproven commercial",
        "Market entry",
      ],
    };
  }
};

// Generate user-friendly consistency score consideration based on consistency score
export const getConsistencyScoreConsideration = (score: number): ValuationConsideration | null => {
  if (score === 0) return null; // No tracks to analyze

  switch (score) {
    case 5:
      return {
        title: "Steady Release Pattern",
        description:
          "Your catalog shows consistent releases every 6-12 months over 5+ years, indicating reliable content production.",
        characteristics: [
          "Regular release schedule",
          "Long-term consistency",
          "Predictable output",
          "Established workflow",
        ],
      };
    case 4:
      return {
        title: "Regular Release Pattern",
        description:
          "Your catalog demonstrates releases every 12-18 months, showing consistent but less frequent content production.",
        characteristics: [
          "Periodic releases",
          "Established rhythm",
          "Consistent timing",
          "Reliable output",
        ],
      };
    case 3:
      return {
        title: "Irregular but Consistent",
        description:
          "Your catalog maintains releases at least every 2 years, showing some consistency despite irregular timing.",
        characteristics: [
          "Occasional releases",
          "Maintained presence",
          "Some consistency",
          "Continued activity",
        ],
      };
    case 2:
      return {
        title: "Intermittent Releases",
        description:
          "Your catalog has gaps of 3+ years between releases, indicating sporadic content production patterns.",
        characteristics: [
          "Long gaps",
          "Sporadic output",
          "Inconsistent timing",
          "Periodic activity",
        ],
      };
    case 1:
      return {
        title: "Limited Release History",
        description:
          "Your catalog shows minimal release activity, with single releases or very sporadic content production.",
        characteristics: [
          "Minimal output",
          "Limited history",
          "Sporadic activity",
          "Single releases",
        ],
      };
    default:
      return null;
  }
};

// Format currency helper
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}; 
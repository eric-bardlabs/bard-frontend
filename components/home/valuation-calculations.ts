import React from "react";

// Types
export interface Earnings {
  tlm: number;
  lifetime: number;
}

export interface MultiplierRange {
  lower: number;
  upper: number;
}

export interface ValuationRange {
  lower: number;
  upper: number;
}

// Genre scoring constants
export const genreScoreMap: Record<string, number> = {
  "Pop Classics": 5,
  Jazz: 5,
  EDM: 4,
  "Hip Hop": 4,
  Rock: 4,
  Folk: 3,
  Metal: 3,
  "New Pop / Tik Tok": 2,
  Other: 1,
};

// Calculate average genre score
export const calculateAverageGenreScore = (selectedGenres: string[]): number => {
  if (selectedGenres.length === 0) return 0;

  const totalScore = selectedGenres.reduce((sum, genre) => {
    return sum + (genreScoreMap[genre] || 0);
  }, 0);

  return totalScore / selectedGenres.length;
};

// Calculate average age score for tracks in Release status
export const calculateAverageAgeScore = (tracks: any[]): number => {
  if (!tracks || tracks.length === 0) return 0;

  const today = new Date();
  const totalScore = tracks.reduce((sum, track) => {
    if (!track.releaseDate) return sum + 1; // Unknown release date = score 1

    const releaseDate = new Date(track.releaseDate);
    const yearsDiff =
      (today.getTime() - releaseDate.getTime()) /
      (1000 * 60 * 60 * 24 * 365.25);

    let ageScore: number;
    if (yearsDiff >= 10)
      ageScore = 5; // 10+ years
    else if (yearsDiff >= 5)
      ageScore = 4; // 5-9 years
    else if (yearsDiff >= 2)
      ageScore = 3; // 2-4 years
    else if (yearsDiff >= 0)
      ageScore = 2; // < 2 years
    else ageScore = 1; // Invalid date

    return sum + ageScore;
  }, 0);

  return totalScore / tracks.length;
};

// Calculate average ownership for tracks in Release status
export const calculateAverageOwnership = (releasedTracks: any[], selectedOwners: string[]): number => {
  if (!releasedTracks || releasedTracks.length === 0 || selectedOwners.length === 0) {
    return 0; // Default fallback if no data available
  }
  let totalOwnershipPercentage = 0;

  releasedTracks.forEach(track => {
    if (track.publisherSplits) {
      try {
        const splits = JSON.parse(track.publisherSplits);
        if (Array.isArray(splits)) {
          // Calculate total ownership percentage for selected owners in this track
          const trackOwnership = splits
            .filter(split => selectedOwners.includes(split.id))
            .reduce((sum, split) => sum + parseFloat(split.percentage), 0);
          totalOwnershipPercentage += trackOwnership;
        }
      } catch (error) {
        console.warn('Failed to parse publisher_splits for track:', track.id, error);
      }
    }
  });

  // Calculate average ownership percentage across all tracks
  const averageOwnership = totalOwnershipPercentage / releasedTracks.length;

  return averageOwnership;
};

// Calculate ownership score based on publisher splits
export const calculateOwnershipScore = (releasedTracks: any[], selectedOwners: string[]): number => {
  if (!releasedTracks || releasedTracks.length === 0 || selectedOwners.length === 0) {
    return 1; // Default fallback if no data available
  }

  const averageOwnership = calculateAverageOwnership(releasedTracks, selectedOwners);
  
  // Map ownership percentage to score (0-100% -> 1-5 score)
  if (averageOwnership >= 90) return 5;      // 90-100% ownership
  if (averageOwnership >= 70) return 4;      // 70-89% ownership  
  if (averageOwnership >= 50) return 3;      // 50-69% ownership
  if (averageOwnership >= 30) return 2;      // 30-49% ownership
  return 1;                                   // 0-29% ownership
};

// Calculate total span years for multiplier combination
export const calculateTotalSpanYears = (tracks: any[]): number => {
  if (!tracks || tracks.length === 0) return 0;

  const sortedTracks = tracks
    .filter((track) => track.releaseDate)
    .sort(
      (a, b) =>
        new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
    );

  if (sortedTracks.length < 2) return 0;

  const today = new Date();
  const firstRelease = new Date(sortedTracks[0].releaseDate);
  const totalSpan =
    (today.getTime() - firstRelease.getTime()) /
    (1000 * 60 * 60 * 24 * 365.25);

  return totalSpan;
};

// Calculate consistency score
export const calculateConsistencyScore = (tracks: any[], totalSpanYears: number): number => {
  if (!tracks || tracks.length === 0) return 0;

  // Sort tracks by release date
  const sortedTracks = tracks
    .filter((track) => track.releaseDate)
    .sort(
      (a, b) =>
        new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
    );

  if (sortedTracks.length < 2) return 1; // One time release

  // Calculate gaps between consecutive releases
  const gaps: number[] = [];
  for (let i = 1; i < sortedTracks.length; i++) {
    const prevDate = new Date(sortedTracks[i - 1].releaseDate);
    const currDate = new Date(sortedTracks[i].releaseDate);
    const gapMonths =
      (currDate.getTime() - prevDate.getTime()) /
      (1000 * 60 * 60 * 24 * 30.44);
    gaps.push(gapMonths);
  }

  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const maxGap = Math.max(...gaps);

  // Determine consistency score
  if (totalSpanYears >= 5 && avgGap >= 6 && avgGap <= 12 && maxGap <= 18) {
    return 5; // Steady release every 6-12 months for 5+ years
  } else if (avgGap >= 12 && avgGap <= 18 && maxGap <= 24) {
    return 4; // Regular release every 12-18 months
  } else if (maxGap <= 24) {
    return 3; // Irregular but at least once every 2 years
  } else if (maxGap >= 36) {
    return 2; // Large gap exists (>= 3 years)
  } else {
    return 1; // One time or very sporadic release
  }
};

// Calculate total TLM earnings
export const calculateTotalTlm = (earnings: {
  pro: Earnings;
  mlc: Earnings;
  stream: Earnings;
  other: Earnings;
}): number => {
  return (
    earnings.pro.tlm + earnings.mlc.tlm + earnings.stream.tlm + earnings.other.tlm
  );
};

// Calculate characteristic multiplier range
export const calculateCharacteristicMultiplierRange = (
  ownershipScore: number,
  averageAgeScore: number,
  consistencyScore: number,
  averageGenreScore: number
): MultiplierRange => {
  const weightedScore =
    ownershipScore * 0.5 +
    averageAgeScore * 0.15 +
    consistencyScore * 0.15 +
    averageGenreScore * 0.2;

  // Map weighted score to multiplier range based on scoring table
  if (weightedScore >= 4.5 && weightedScore <= 5.0) return { lower: 15, upper: 20 };
  if (weightedScore >= 4.0 && weightedScore < 4.49) return { lower: 12, upper: 15 };
  if (weightedScore >= 3.5 && weightedScore < 3.99) return { lower: 8, upper: 12 };
  if (weightedScore >= 3.0 && weightedScore < 3.49) return { lower: 5, upper: 8 };
  if (weightedScore >= 2.0 && weightedScore < 2.99) return { lower: 2, upper: 5 };
  if (weightedScore >= 1.0 && weightedScore < 1.99) return { lower: 1, upper: 2 };
  return { lower: 1, upper: 2 }; // Default fallback
};

// Calculate revenue multiplier range
export const calculateRevenueMultiplierRange = (
  totalTlm: number,
  earnings: {
    pro: Earnings;
    mlc: Earnings;
    stream: Earnings;
    other: Earnings;
  },
  totalStreams: string,
  topFiveStreams: string,
  adminFee: number
): MultiplierRange => {
  // Parse all inputs to numbers
  const pro = earnings.pro;
  const mlc = earnings.mlc;
  const stream = earnings.stream;
  const other = earnings.other;
  const topFive = parseFloat(topFiveStreams) || 0;
  const streams = parseFloat(totalStreams) || 0;
  
  // Calculate total lifetime earnings
  const totalLifetime =
    pro.lifetime + mlc.lifetime + stream.lifetime + other.lifetime;

  const dollarAge = totalTlm / totalLifetime;
  const concentration = topFive / (streams || 1);

  // Calculate total multiplier based on dollarAge and concentration
  const getTotalMultiplier = (age: number, conc: number) => {
    // Determine dollarAge category
    let ageCategory: string;
    if (age < 1) ageCategory = "new";
    else if (age >= 1 && age < 3) ageCategory = "developing";
    else if (age >= 3 && age < 5) ageCategory = "mid-mature";
    else ageCategory = "mature";

    // Determine concentration category
    let concCategory: string;
    if (conc < 0.2) concCategory = "low";
    else if (conc >= 0.2 && conc <= 0.5) concCategory = "medium";
    else concCategory = "high";

    // Multiplier lookup table for all combinations
    const multiplierLookup: Record<
      string,
      Record<string, { lower: number; upper: number }>
    > = {
      new: {
        low: { lower: 2, upper: 4 },
        medium: { lower: 1.5, upper: 3.5 },
        high: { lower: 1, upper: 3 },
      },
      developing: {
        low: { lower: 3, upper: 6 },
        medium: { lower: 2.5, upper: 5.5 },
        high: { lower: 2, upper: 5 },
      },
      "mid-mature": {
        low: { lower: 6, upper: 12 },
        medium: { lower: 5, upper: 10 },
        high: { lower: 4, upper: 8 },
      },
      mature: {
        low: { lower: 8, upper: 20 },
        medium: { lower: 7, upper: 16 },
        high: { lower: 6, upper: 12 },
      },
    };

    return multiplierLookup[ageCategory][concCategory];
  };

  const totalMultiplier = getTotalMultiplier(dollarAge, concentration);
  
  return {
    lower: totalMultiplier.lower,
    upper: totalMultiplier.upper,
  };
};

// Combine multipliers based on total span years
export const calculateCombinedMultiplier = (
  totalSpanYears: number,
  characteristicMultiplierRange: MultiplierRange,
  revenueMultiplierRange: MultiplierRange
): MultiplierRange => {
  let characteristicWeight: number;
  let revenueWeight: number;

  if (totalSpanYears >= 10) {
    characteristicWeight = 0.3; // 30%
    revenueWeight = 0.7; // 70%
  } else if (totalSpanYears >= 3) {
    characteristicWeight = 0.4; // 40%
    revenueWeight = 0.6; // 60%
  } else {
    characteristicWeight = 0.5; // 50%
    revenueWeight = 0.5; // 50%
  }

  const lower = Math.round(
    characteristicMultiplierRange.lower * characteristicWeight +
      revenueMultiplierRange.lower * revenueWeight
  );

  const upper = Math.round(
    characteristicMultiplierRange.upper * characteristicWeight +
      revenueMultiplierRange.upper * revenueWeight
  );

  return { lower, upper };
};

// Calculate final multiplier range (manual or computed)
export const calculateFinalMultiplier = (
  manualMultiplier: number | null,
  combinedMultiplier: MultiplierRange
): MultiplierRange => {
  const multiplierRange = combinedMultiplier.upper - combinedMultiplier.lower;
  
  if (manualMultiplier) {
    return {
      lower: manualMultiplier - multiplierRange / 2,
      upper: manualMultiplier + multiplierRange / 2,
    };
  }
  
  return combinedMultiplier;
};

// Calculate valuation range
export const calculateValuationRange = (
  finalMultiplier: MultiplierRange,
  totalTlm: number,
  adminFee: number
): ValuationRange => {
  return {
    lower: finalMultiplier.lower * totalTlm * (1 - adminFee / 100),
    upper: finalMultiplier.upper * totalTlm * (1 - adminFee / 100),
  };
};

// Get multiplier guidance text
export const getMultiplierGuidance = (finalMultiplier: MultiplierRange): string => {
  const mid = (finalMultiplier.upper + finalMultiplier.lower) / 2;
  if (mid <= 3) {
    return "Typical for emerging artists with limited track record or niche appeal.";
  } else if (mid <= 8) {
    return "Common for established artists with consistent earnings and growing audience.";
  } else if (mid <= 15) {
    return "For successful artists with strong market position and proven earning potential.";
  } else {
    return "Reserved for premium catalogs with exceptional performance and growth trajectory.";
  }
}; 
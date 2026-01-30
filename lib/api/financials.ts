import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";

export interface FinancialDataItem {
  id: string;
  organization_id: string;
  isrc: string | null;
  source: string | null;
  dsp: string | null;
  type: string | null;
  amount: number | null;
  payout_year: number;
  payout_month: number;
  target_year?: number | null;
  target_month?: number | null;
  artist_share?: number | null;
  distro_share?: number | null;
  media_type?: string | null;
  quantity?: number | null;
  region?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FinancialDataResponse {
  data: FinancialDataItem[];
  total_count: number;
  total_amount: number;
}

interface FetchFinancialDataParams {
  token: string;
  trackId: string;
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
  source?: string;
  dsp?: string;
  type?: string;
  offset?: number;
  limit?: number;
  onSuccess?: (data: FinancialDataResponse) => void;
  onError?: (error: any) => void;
}

export const fetchTrackFinancialData = async ({
  token,
  trackId,
  startYear,
  startMonth,
  endYear,
  endMonth,
  source,
  dsp,
  type,
  offset = 0,
  limit = 50,
  onSuccess,
  onError,
}: FetchFinancialDataParams): Promise<FinancialDataResponse> => {
  try {
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });

    if (startYear !== undefined) params.append("start_year", startYear.toString());
    if (startMonth !== undefined) params.append("start_month", startMonth.toString());
    if (endYear !== undefined) params.append("end_year", endYear.toString());
    if (endMonth !== undefined) params.append("end_month", endMonth.toString());
    if (source) params.append("source", source);
    if (dsp) params.append("dsp", dsp);
    if (type) params.append("type", type);

    const response = await axios.get<FinancialDataResponse>(
      `${API_BASE_URL}/tracks/${trackId}/financial?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (onSuccess) {
      onSuccess(response.data);
    }

    return response.data;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

interface FetchAllFinancialDataParams {
  token: string;
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
  source?: string;
  dsp?: string;
  type?: string;
  aggregatedBy?: "target" | "payout";
  offset?: number;
  limit?: number;
  onSuccess?: (data: FinancialDataResponse) => void;
  onError?: (error: any) => void;
}

export const fetchFinancialData = async ({
  token,
  startYear,
  startMonth,
  endYear,
  endMonth,
  source,
  dsp,
  type,
  aggregatedBy = "target",
  offset = 0,
  limit = 50,
  onSuccess,
  onError,
}: FetchAllFinancialDataParams): Promise<FinancialDataResponse> => {
  try {
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });

    if (startYear !== undefined) params.append("start_year", startYear.toString());
    if (startMonth !== undefined) params.append("start_month", startMonth.toString());
    if (endYear !== undefined) params.append("end_year", endYear.toString());
    if (endMonth !== undefined) params.append("end_month", endMonth.toString());
    if (source) params.append("source", source);
    if (dsp) params.append("dsp", dsp);
    if (type) params.append("type", type);
    if (aggregatedBy) params.append("aggregated_by", aggregatedBy);

    const response = await axios.get<FinancialDataResponse>(
      `${API_BASE_URL}/financials?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (onSuccess) {
      onSuccess(response.data);
    }

    return response.data;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

export interface TopSongResponse {
  isrc: string;
  revenue: number;
  song_name?: string;
  artist_name?: string;
  album_name?: string;
  spotify_url?: string;
}

export interface TopMonthResponse {
  payout_year: number;
  payout_month: number;
  revenue: number;
  top_songs: TopSongResponse[];
}

export interface DspRevenueResponse {
  dsp: string;
  revenue: number;
  percentage: number;
  total_streams: number;
  earnings_per_stream: number;
}

export interface UpcPerformanceResponse {
  upc: string;
  total_streams: number;
  total_revenue: number;
  album_name: string | null;
}

export interface TerritoryPerformanceResponse {
  region: string;
  total_streams: number;
  total_revenue: number;
  percentage_of_streams: number;
  percentage_of_revenue: number;
}

export interface SourceRevenueResponse {
  source: string;
  revenue: number;
}

export interface SongSourceResponse {
  isrc: string;
  sources: SourceRevenueResponse[];
  total_revenue: number;
}

export interface MonthlyRevenueResponse {
  year: number;
  month: number;
  revenue: number;
}

export interface InsightsResponse {
  top_songs: TopSongResponse[];
  top_months: TopMonthResponse[];
  dsp_distribution: DspRevenueResponse[];
  monthly_chart: MonthlyRevenueResponse[];
  upc_performance: UpcPerformanceResponse[];
  territory_performance: TerritoryPerformanceResponse[];
}

export interface AlbumMonthlyData {
  year: number;
  month: number;
  period: string; // "Jan 2024" format
  expenses: number;
  income: number;
  streaming_revenue: number;
  total_streams: number; // Monthly stream count
}

export interface MonthlySpendingBreakdown {
  year: number;
  month: number;
  period: string; // "Jan 2024" format
  marketing_ads_spending: number;
  other_spending: number;
  total_spending: number;
}

export interface MonthlyAdvances {
  year: number;
  month: number;
  period: string; // "Jan 2024" format
  advances_amount: number;
}

export interface AlbumFinancialSummary {
  total_spending: number;
  total_advances: number;
  marketing_ads_spending: number;
  other_spending: number;
  total_streaming_revenue: number;
  monthly_spending_breakdown: MonthlySpendingBreakdown[];
  monthly_advances: MonthlyAdvances[];
}

export interface RegionMonthlyBreakdown {
  year: number;
  month: number;
  period: string; // "Jan 2024" format
  streams: number;
  revenue: number;
}

export interface TopRegion {
  region: string;
  total_streams: number;
  total_revenue: number;
  monthly_data: RegionMonthlyBreakdown[];
}

export interface DspMonthlyBreakdown {
  year: number;
  month: number;
  period: string; // "Jan 2024" format
  streams: number;
  revenue: number;
}

export interface TopDsp {
  dsp: string;
  total_streams: number;
  total_revenue: number;
  monthly_data: DspMonthlyBreakdown[];
}

export interface AlbumFinancialResponse {
  upc: string;
  album_name?: string;
  monthly_data: AlbumMonthlyData[];
  summary: AlbumFinancialSummary;
  top_regions: TopRegion[];
  top_dsps: TopDsp[];
}

export const fetchFinancialInsights = async (
  token: string,
  startYear?: number,
  startMonth?: number,
  endYear?: number,
  endMonth?: number,
  aggregatedBy?: "target" | "payout"
): Promise<InsightsResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (startYear !== undefined) params.append("start_year", startYear.toString());
    if (startMonth !== undefined) params.append("start_month", startMonth.toString());
    if (endYear !== undefined) params.append("end_year", endYear.toString());
    if (endMonth !== undefined) params.append("end_month", endMonth.toString());
    if (aggregatedBy) params.append("aggregated_by", aggregatedBy);

    const response = await axios.get<InsightsResponse>(
      `${API_BASE_URL}/financials/insights?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

interface FetchAlbumFinancialDataParams {
  token: string;
  upc: string;
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
}

export const fetchAlbumFinancialData = async ({
  token,
  upc,
  startYear,
  startMonth,
  endYear,
  endMonth,
}: FetchAlbumFinancialDataParams): Promise<AlbumFinancialResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (startYear !== undefined) params.append("start_year", startYear.toString());
    if (startMonth !== undefined) params.append("start_month", startMonth.toString());
    if (endYear !== undefined) params.append("end_year", endYear.toString());
    if (endMonth !== undefined) params.append("end_month", endMonth.toString());

    const queryString = params.toString();
    const url = `${API_BASE_URL}/albums/${upc}/financials${queryString ? `?${queryString}` : ''}`;

    const response = await axios.get<AlbumFinancialResponse>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Export types for use in components
export type { FetchFinancialDataParams, FetchAllFinancialDataParams, FetchAlbumFinancialDataParams };
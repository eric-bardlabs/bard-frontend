import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";

interface CatalogValuationDataRequest {
  owner_ids: string[];
}

export interface CatalogValuationData {
  average_age_score: number;
  total_span_years: number;
  consistency_score: number;
  ownership_score: number;
  ownership_percentage: number;
  total_tracks: number;
}

interface FetchCatalogValuationDataParams {
  token: string;
  owner_ids: string[];
  onSuccess?: (data: CatalogValuationData) => void;
  onError?: (error: any) => void;
}

export const fetchCatalogValuationData = async ({
  token,
  owner_ids,
  onSuccess,
  onError,
}: FetchCatalogValuationDataParams): Promise<CatalogValuationData> => {
  try {
    const response = await axios.post<CatalogValuationData>(
      `${API_BASE_URL}/catalog-valuation/get_catalog_valuation_data`,
      { owner_ids },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
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
export interface SearchResult {
  path: string;
  image: string;
  score: number;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  error?: string | null;
}

export interface SearchParams {
  sketch: string;
  text?: string;
  k?: number;
  lambda?: number;
}

const MODAL_ENDPOINT =
  "https://cmellor--backend-search-similar-images.modal.run";

export async function searchSimilarImages(
  params: SearchParams,
): Promise<SearchResponse> {
  try {
    const response = await fetch(MODAL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sketch: params.sketch,
        text: params.text || "", 
        k: params.k ?? 5,
        lambda: params.lambda ?? 0.95,
        filter_portraits: false,
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return (await response.json()) as SearchResponse;
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface SavedPrintListing {
  id: string;
  portfolioEntryId: string;
  marketplace: string;
  title: string;
  description: string;
  listPrice: number;
  currency: string;
  status: string;
  listedAt: string | null;
  createdAt: string | null;
}

export interface PrintSalesListResponse {
  items: SavedPrintListing[];
  total: number;
}

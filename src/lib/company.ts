/**
 * Company profile shown on the Bill / Report PDFs.
 *
 * The values are edited on the Company Profile screen and stored in Firestore
 * (settings/company). A module-level cache lets the PDF builders read the
 * profile synchronously; DataProvider keeps it hydrated from Firestore.
 */
export interface CompanyProfile {
  name: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  /** Logo as a small data URL (resized on upload). */
  logo?: string;
}

export const DEFAULT_COMPANY: CompanyProfile = {
  name: 'Devakusuma Nursery Gardens',
  tagline: 'Plants for every garden',
};

let current: CompanyProfile = DEFAULT_COMPANY;

/** Synchronous read of the current company profile (used by PDF builders). */
export function getCompanyProfile(): CompanyProfile {
  return current;
}

/** Update the in-memory cache (called by DataProvider from the Firestore listener). */
export function setCompanyProfileCache(profile: Partial<CompanyProfile>): void {
  current = { ...DEFAULT_COMPANY, ...profile };
}

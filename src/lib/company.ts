/**
 * Company profile shown on the Bill (PDF header).
 *
 * For now these are static defaults. The upcoming "Company Profile" module will
 * let the owner edit these and store them in Firestore (settings/company), after
 * which `getCompanyProfile()` can read the saved values. The bill PDF already
 * reads from here, so no invoice changes will be needed then.
 */
export interface CompanyProfile {
  name: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
}

export const companyProfile: CompanyProfile = {
  name: 'Devakusuma Nursery Gardens',
  tagline: 'Plants for every garden',
  address: '',
  phone: '',
  email: '',
  gstin: '',
};

/** Single source of truth for the company details used across the app. */
export function getCompanyProfile(): CompanyProfile {
  return companyProfile;
}

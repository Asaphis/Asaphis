/**
 * Multi-provider identity/KYC abstraction. Never build fake-ID detection in-house.
 * Implement IdentityProvider for each vendor (Smile, Dojah, Onfido, Veriff...).
 * Mock provider queues a MANUAL_REVIEW-safe pending result — never auto-verifies.
 */
export interface IdentitySubmitInput {
  userId: string;
  countryCode: string;
  documentType: string;
  fileId?: string;
}

export interface IdentityProvider {
  readonly name: string;
  submit(input: IdentitySubmitInput): Promise<{ reference: string; status: 'PENDING' | 'VERIFIED' | 'FAILED' }>;
  fetchResult?(reference: string): Promise<{ status: string; matchScore?: number; summary?: string }>;
}

export class MockIdentityProvider implements IdentityProvider {
  readonly name = 'mock';
  async submit(input: IdentitySubmitInput) {
    void input;
    return { reference: `mock-${Date.now()}`, status: 'PENDING' as const };
  }
}

export function identityProviderFor(name: string): IdentityProvider {
  // Add smile/dojah/onfido/veriff implementations behind env secrets.
  void name;
  return new MockIdentityProvider();
}

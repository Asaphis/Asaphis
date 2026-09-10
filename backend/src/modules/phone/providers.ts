/**
 * Provider-independent phone verification abstraction.
 * Primary/fallback providers are selected from env + country config.
 * Add a real vendor by implementing VerificationChannelProvider.
 */
export type PhoneChannel = 'SMS' | 'WHATSAPP' | 'VOICE' | 'EMAIL';

export interface SendResult {
  providerMessageId?: string;
  fallbackUsed: boolean;
}

export interface VerificationChannelProvider {
  readonly name: string;
  send(channel: PhoneChannel, to: string, code: string): Promise<string>;
}

export class MockChannelProvider implements VerificationChannelProvider {
  readonly name = 'mock';
  async send(channel: PhoneChannel, to: string, code: string): Promise<string> {
    // eslint-disable-next-line no-console
    console.log(`[phone:${this.name}] ${channel} -> ${to} code=${code}`);
    return `mock-${Date.now()}`;
  }
}

// Stubs: wire real SDKs with env secrets here; interface stays stable.
export class TwilioChannelProvider implements VerificationChannelProvider {
  readonly name = 'twilio';
  async send(channel: PhoneChannel, to: string, code: string): Promise<string> {
    void channel; void to; void code;
    throw new Error('Twilio provider not configured (missing TWILIO_* secrets)');
  }
}

export class TermiiChannelProvider implements VerificationChannelProvider {
  readonly name = 'termii';
  async send(): Promise<string> {
    throw new Error('Termii provider not configured');
  }
}

export function providerFor(name: string): VerificationChannelProvider {
  switch (name) {
    case 'twilio': return new TwilioChannelProvider();
    case 'termii': return new TermiiChannelProvider();
    default: return new MockChannelProvider();
  }
}

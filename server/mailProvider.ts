/**
 * Certified Mail Provider Adapter
 * 
 * Provider-ready architecture supporting:
 * - Mock (default for MVP)
 * - Click2Mail
 * - PostGrid
 * - Lob
 * - Postalytics
 * 
 * Each provider implements the MailProvider interface.
 * Swap providers by changing the MAIL_PROVIDER env variable.
 */

export interface MailRecipient {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface MailSender {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface SendMailRequest {
  letterPdfUrl: string;
  recipient: MailRecipient;
  sender: MailSender;
  certifiedMail: boolean;
  returnReceipt: boolean;
  metadata?: Record<string, string>;
}

export interface SendMailResult {
  success: boolean;
  trackingNumber: string;
  providerJobId: string;
  estimatedDelivery: Date;
  error?: string;
}

export interface TrackingResult {
  status: "pending" | "in_transit" | "delivered" | "returned" | "failed";
  lastUpdate: Date;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  location?: string;
  description: string;
}

export interface MailProvider {
  name: string;
  sendCertifiedMail(request: SendMailRequest): Promise<SendMailResult>;
  getTracking(trackingNumber: string): Promise<TrackingResult>;
  cancelMail(providerJobId: string): Promise<boolean>;
}

// ─── Mock Provider ──────────────────────────────────────────────────────────

class MockMailProvider implements MailProvider {
  name = "mock";

  async sendCertifiedMail(request: SendMailRequest): Promise<SendMailResult> {
    // Simulate processing delay
    const trackingNumber = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    return {
      success: true,
      trackingNumber,
      providerJobId: `mock-job-${Date.now()}`,
      estimatedDelivery,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    // Mock tracking - simulate progression based on time since creation
    const events: TrackingEvent[] = [
      {
        timestamp: new Date(Date.now() - 86400000 * 3),
        status: "accepted",
        location: "Local Post Office",
        description: "Package accepted by USPS",
      },
      {
        timestamp: new Date(Date.now() - 86400000 * 2),
        status: "in_transit",
        location: "Regional Distribution Center",
        description: "In transit to destination",
      },
      {
        timestamp: new Date(Date.now() - 86400000),
        status: "out_for_delivery",
        location: "Destination Post Office",
        description: "Out for delivery",
      },
    ];

    return {
      status: "in_transit",
      lastUpdate: new Date(),
      events,
    };
  }

  async cancelMail(_providerJobId: string): Promise<boolean> {
    return true;
  }
}

// ─── Click2Mail Provider (Stub) ─────────────────────────────────────────────

class Click2MailProvider implements MailProvider {
  name = "click2mail";

  async sendCertifiedMail(_request: SendMailRequest): Promise<SendMailResult> {
    throw new Error("Click2Mail provider not yet configured. Set CLICK2MAIL_API_KEY and CLICK2MAIL_USERNAME.");
  }

  async getTracking(_trackingNumber: string): Promise<TrackingResult> {
    throw new Error("Click2Mail provider not yet configured.");
  }

  async cancelMail(_providerJobId: string): Promise<boolean> {
    throw new Error("Click2Mail provider not yet configured.");
  }
}

// ─── PostGrid Provider (Stub) ───────────────────────────────────────────────

class PostGridProvider implements MailProvider {
  name = "postgrid";

  async sendCertifiedMail(_request: SendMailRequest): Promise<SendMailResult> {
    throw new Error("PostGrid provider not yet configured. Set POSTGRID_API_KEY.");
  }

  async getTracking(_trackingNumber: string): Promise<TrackingResult> {
    throw new Error("PostGrid provider not yet configured.");
  }

  async cancelMail(_providerJobId: string): Promise<boolean> {
    throw new Error("PostGrid provider not yet configured.");
  }
}

// ─── Lob Provider (Stub) ────────────────────────────────────────────────────

class LobProvider implements MailProvider {
  name = "lob";

  async sendCertifiedMail(_request: SendMailRequest): Promise<SendMailResult> {
    throw new Error("Lob provider not yet configured. Set LOB_API_KEY.");
  }

  async getTracking(_trackingNumber: string): Promise<TrackingResult> {
    throw new Error("Lob provider not yet configured.");
  }

  async cancelMail(_providerJobId: string): Promise<boolean> {
    throw new Error("Lob provider not yet configured.");
  }
}

// ─── Postalytics Provider (Stub) ────────────────────────────────────────────

class PostalyticsProvider implements MailProvider {
  name = "postalytics";

  async sendCertifiedMail(_request: SendMailRequest): Promise<SendMailResult> {
    throw new Error("Postalytics provider not yet configured. Set POSTALYTICS_API_KEY.");
  }

  async getTracking(_trackingNumber: string): Promise<TrackingResult> {
    throw new Error("Postalytics provider not yet configured.");
  }

  async cancelMail(_providerJobId: string): Promise<boolean> {
    throw new Error("Postalytics provider not yet configured.");
  }
}

// ─── Provider Factory ───────────────────────────────────────────────────────

const providers: Record<string, () => MailProvider> = {
  mock: () => new MockMailProvider(),
  click2mail: () => new Click2MailProvider(),
  postgrid: () => new PostGridProvider(),
  lob: () => new LobProvider(),
  postalytics: () => new PostalyticsProvider(),
};

export function getMailProvider(): MailProvider {
  const providerName = process.env.MAIL_PROVIDER || "mock";
  const factory = providers[providerName];
  if (!factory) {
    throw new Error(`Unknown mail provider: ${providerName}. Available: ${Object.keys(providers).join(", ")}`);
  }
  return factory();
}

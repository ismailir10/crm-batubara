/**
 * Coal price provider adapter boundary (specification §13).
 *
 * The single point of future integration. Adding a real provider means writing
 * one class that implements this interface and registering it below — nothing
 * above this boundary changes.
 *
 * No real provider exists in this prototype. Documentation and credentials for
 * the four servers (two Singapore, two China) have not been supplied, so
 * fabricating a connection here would misrepresent what the system does.
 */

export interface RawPriceObservation {
  /** ISO date, YYYY-MM-DD */
  observationDate: string;
  price: number;
  unit: string;
  currency: string;
}

export interface CoalPriceProvider {
  readonly code: string;
  readonly providerName: string;
  readonly region: "Singapore" | "China";
  /** Adapter identity recorded on every ingestion run, for traceability. */
  readonly adapterName: string;
  /** True for synthetic sources. Surfaced in the UI; never hidden. */
  readonly isMock: boolean;
  fetchRange(from: Date, to: Date): Promise<RawPriceObservation[]>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly sourceCode: string
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

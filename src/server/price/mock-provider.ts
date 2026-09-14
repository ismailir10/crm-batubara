import {
  SYNTHETIC_SOURCES,
  generateSeries,
  type SyntheticSource,
} from "./synthetic";
import type { CoalPriceProvider, RawPriceObservation } from "./provider";

/**
 * The only provider implementation in this prototype. Named "mock" deliberately,
 * everywhere it is visible: class name, the adapter_name written to every
 * ingestion run, and the badge shown in the UI.
 */
export class MockCoalPriceProvider implements CoalPriceProvider {
  readonly adapterName = "MockCoalPriceProvider";
  readonly isMock = true;

  constructor(private readonly source: SyntheticSource) {}

  get code() {
    return this.source.code;
  }
  get providerName() {
    return this.source.provider;
  }
  get region() {
    return this.source.region;
  }

  async fetchRange(from: Date, to: Date): Promise<RawPriceObservation[]> {
    const series = generateSeries(this.source, to);
    const fromIso = from.toISOString().slice(0, 10);
    const toIso = to.toISOString().slice(0, 10);

    return series
      .filter((point) => point.date >= fromIso && point.date <= toIso)
      .map((point) => ({
        observationDate: point.date,
        price: point.price,
        unit: "USD/tonne",
        currency: "USD",
      }));
  }
}

/**
 * Provider registry. A real adapter is added here and nowhere else.
 */
export function getProviders(): CoalPriceProvider[] {
  return SYNTHETIC_SOURCES.map((source) => new MockCoalPriceProvider(source));
}

export function getProvider(code: string): CoalPriceProvider | null {
  const source = SYNTHETIC_SOURCES.find((s) => s.code === code);
  return source ? new MockCoalPriceProvider(source) : null;
}

// Client for the Cin7 Core (formerly DEAR Systems) External API v2.
// Docs: https://dearinventory.docs.apiary.io/
//
// Auth: two static headers, no OAuth. Rate limit is 60 req/min, 5 concurrent
// per account, enforced by Cin7 with 429 + Retry-After.

const DEFAULT_BASE_URL = "https://inventory.dearsystems.com/ExternalApi/v2";
const PAGE_LIMIT = 100;
const MAX_RETRIES = 5;

export class Cin7ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "Cin7ApiError";
  }
}

export interface Cin7Credentials {
  accountId: string;
  applicationKey: string;
  baseUrl?: string;
}

export function getCin7CredentialsFromEnv(): Cin7Credentials {
  const accountId = process.env["CIN7_ACCOUNT_ID"];
  const applicationKey = process.env["CIN7_APPLICATION_KEY"];

  if (!accountId || !applicationKey) {
    throw new Error(
      "CIN7_ACCOUNT_ID and CIN7_APPLICATION_KEY environment variables are required to talk to Cin7 Core.",
    );
  }

  return {
    accountId,
    applicationKey,
    baseUrl: process.env["CIN7_API_BASE_URL"] || DEFAULT_BASE_URL,
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(
  creds: Cin7Credentials,
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const url = new URL((creds.baseUrl || DEFAULT_BASE_URL) + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: {
        "api-auth-accountid": creds.accountId,
        "api-auth-applicationkey": creds.applicationKey,
        Accept: "application/json",
      },
    });

    if (res.status === 429) {
      const retryAfterHeader = res.headers.get("Retry-After");
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 2000 * (attempt + 1);
      await sleep(retryAfterMs);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => undefined);
      throw new Cin7ApiError(`Cin7 API request to ${path} failed with ${res.status}`, res.status, body);
    }

    return (await res.json()) as T;
  }

  throw new Cin7ApiError(`Cin7 API request to ${path} exhausted retries after repeated 429s`, 429, undefined);
}

export interface Cin7Product {
  ID: string;
  SKU: string;
  Name: string;
  Category?: string;
  Brand?: string;
  AverageCost?: number;
  PriceTier1?: number;
  Status?: string;
}

export interface Cin7Customer {
  ID: string;
  Name: string;
  Category?: string;
  PriceTier?: string;
  Status?: string;
  PaymentTerm?: string;
  CreditLimit?: number;
}

export interface Cin7SaleListItem {
  SaleID: string;
  CustomerID: string;
  OrderDate: string;
  InvoiceDate?: string;
  Status: string;
  Total: number;
}

export interface Cin7SaleLine {
  Product?: { ID?: string; SKU?: string };
  SKU?: string;
  Quantity: number;
  Price: number;
  Discount?: number;
  Total: number;
  AverageCost?: number;
}

export interface Cin7SaleDetail {
  SaleID: string;
  CustomerID: string;
  OrderDate: string;
  InvoiceDate?: string;
  Status: string;
  Currency?: string;
  Order?: { Lines?: Cin7SaleLine[]; Total?: number; DiscountTotal?: number; TaxTotal?: number };
  Invoices?: { AmountPaid?: number }[];
}

interface Cin7ListResponse<TKey extends string, TItem> {
  Total: number;
}

async function* paginate<TItem>(
  creds: Cin7Credentials,
  path: string,
  listKey: string,
  extraParams: Record<string, string | number | boolean | undefined> = {},
): AsyncGenerator<TItem> {
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await request<Record<string, unknown> & Cin7ListResponse<string, TItem>>(creds, path, {
      Page: page,
      Limit: PAGE_LIMIT,
      ...extraParams,
    });

    const items = (res[listKey] as TItem[] | undefined) ?? [];
    for (const item of items) yield item;

    if (items.length < PAGE_LIMIT) return;
    page += 1;
  }
}

export function listProducts(creds: Cin7Credentials): AsyncGenerator<Cin7Product> {
  return paginate<Cin7Product>(creds, "/product", "Products");
}

export function listCustomers(creds: Cin7Credentials): AsyncGenerator<Cin7Customer> {
  return paginate<Cin7Customer>(creds, "/customer", "CustomerList");
}

export function listSales(creds: Cin7Credentials, updatedSince?: string): AsyncGenerator<Cin7SaleListItem> {
  return paginate<Cin7SaleListItem>(creds, "/sale/list", "SaleList", {
    UpdatedSince: updatedSince,
  });
}

export function getSaleDetail(creds: Cin7Credentials, saleId: string): Promise<Cin7SaleDetail> {
  return request<Cin7SaleDetail>(creds, "/sale", { ID: saleId });
}

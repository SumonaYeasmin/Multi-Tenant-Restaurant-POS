import { backendFetch } from "./api-client";
import type { Promotion } from "@/types/domain";

export interface BackendPromotion {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  kind: "PERCENT" | "AMOUNT";
  value: number;
  minSpend: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  uses: number;
  maxUses: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionInput {
  name: string;
  code: string;
  kind: "percent" | "amount" | "PERCENT" | "AMOUNT";
  value: number;
  minSpend?: number;
  startsAt?: string;
  endsAt: string;
  maxUses?: number | null;
  active?: boolean;
}

/**
 * Maps backend Prisma promotion record to frontend domain model
 */
export function mapBackendPromotionToDomain(
  promo: BackendPromotion
): Promotion {
  return {
    id: promo.id,
    tenantId: promo.tenantId,
    name: promo.name,
    code: promo.code,
    kind: promo.kind.toLowerCase() as "percent" | "amount",
    value: promo.value,
    minSpend: promo.minSpend,
    startsAt: promo.startsAt.slice(0, 10),
    endsAt: promo.endsAt.slice(0, 10),
    active: promo.active,
    uses: promo.uses,
    maxUses: promo.maxUses,
  };
}

/**
 * Create a new promotional discount via backend API
 */
export async function createPromotionApi(
  tenantSlug: string,
  input: CreatePromotionInput
): Promise<BackendPromotion> {
  return backendFetch<BackendPromotion>(`/tenants/${tenantSlug}/promotions`, {
    method: "POST",
    body: JSON.stringify({
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      kind: input.kind.toUpperCase(),
      value: input.value,
      minSpend: input.minSpend ?? 0,
      startsAt: input.startsAt
        ? new Date(input.startsAt).toISOString()
        : undefined,
      endsAt: new Date(input.endsAt).toISOString(),
      maxUses: input.maxUses ?? null,
      active: input.active ?? true,
    }),
  });
}

/**
 * Fetch all promotions for a tenant from backend API
 */
export async function getPromotionsApi(
  tenantSlug: string
): Promise<BackendPromotion[]> {
  return backendFetch<BackendPromotion[]>(`/tenants/${tenantSlug}/promotions`);
}

/**
 * Fetch a single promotion by ID from backend API
 */
export async function getPromotionByIdApi(
  tenantSlug: string,
  id: string
): Promise<BackendPromotion> {
  return backendFetch<BackendPromotion>(
    `/tenants/${tenantSlug}/promotions/${id}`
  );
}

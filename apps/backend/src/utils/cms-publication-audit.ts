import type StoreCmsModuleService from "../modules/store-cms/service"
import { randomUUID } from "crypto"

export type PublicationAuditInput = {
  entity_type: string
  entity_id: string
  action: string
  actor_user_id: string | null
  metadata?: Record<string, unknown> | null
}

/** NFR-6 — ghi log publish (tối thiểu actor, timestamp, entity). */
export async function recordPublicationAudit(
  cms: StoreCmsModuleService,
  row: PublicationAuditInput
): Promise<void> {
  await cms.createStoreCmsPublicationAudits([
    {
      id: randomUUID(),
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      action: row.action,
      actor_user_id: row.actor_user_id,
      metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    },
  ])
}

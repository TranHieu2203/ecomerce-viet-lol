import { createCustomersWorkflow } from "@medusajs/core-flows"
import type { Event, MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import type { CustomerDTO, FilterableCustomerProps } from "@medusajs/types"
import {
  guestCustomerEmailFromNormalizedPhone,
  isGuestOrderLocalEmail,
  normalizeVietnamesePhone,
} from "./vietnamese-phone"

type OrderPlacedPayload = { id: string }

function orderEmailIsStubOnly(
  orderEmail: string,
  canonicalEmail: string
): boolean {
  const e = orderEmail.trim().toLowerCase()
  if (!e) {
    return true
  }
  if (e === canonicalEmail) {
    return true
  }
  return isGuestOrderLocalEmail(e)
}

function mergeGuestMetadata(
  prev: Record<string, unknown> | undefined,
  normalized: string,
  marketingContact: boolean
): Record<string, unknown> {
  const base =
    prev && typeof prev === "object" ? { ...prev } : {}
  return {
    ...base,
    source: "guest_checkout_order",
    phone_normalized: normalized,
    marketing_contact:
      marketingContact || Boolean(base["marketing_contact"]),
  }
}

async function findGuestCustomerForPhone(
  customerModule: {
    listCustomers: (
      filters?: FilterableCustomerProps,
      config?: { take?: number }
    ) => Promise<CustomerDTO[]>
  },
  normalized: string,
  phoneRaw: string
): Promise<CustomerDTO | undefined> {
  const candidates = [
    ...new Set(
      [normalized, (phoneRaw || "").trim()].filter(
        (p): p is string => typeof p === "string" && p.length > 0
      )
    ),
  ]

  for (const p of candidates) {
    const rows = await customerModule.listCustomers(
      { phone: p, has_account: false } as FilterableCustomerProps,
      { take: 15 }
    )
    for (const c of rows) {
      if (c.has_account) {
        continue
      }
      const pn = normalizeVietnamesePhone(c.phone ?? "")
      if (pn === normalized) {
        return c
      }
    }
  }
  return undefined
}

/**
 * Sau khi đơn đặt xong: nếu khách không có customer_id (guest),
 * đảm bảo có bản ghi Customer trong Admin theo SĐT (email guest deterministic),
 * hoặc email marketing thật khi khách nhập; gộp theo stub / SĐT khi cần.
 */
export async function upsertGuestCustomerAfterOrderPlaced(args: {
  event: Event<OrderPlacedPayload>
  container: MedusaContainer
}): Promise<void> {
  const { event, container } = args
  const orderId = event.data.id
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const customerModule = container.resolve(Modules.CUSTOMER)

  const { data: rows } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "email",
      "customer_id",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.phone",
    ],
    filters: { id: orderId },
  })

  const order = rows[0] as
    | {
        id: string
        email?: string | null
        customer_id?: string | null
        shipping_address?: {
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
        } | null
      }
    | undefined

  if (!order) {
    logger.warn(`guest-customer-upsert: order ${orderId} not found`)
    return
  }

  if (order.customer_id) {
    return
  }

  const phoneRaw = order.shipping_address?.phone
  const normalized = normalizeVietnamesePhone(phoneRaw || "")
  if (!normalized) {
    logger.warn(
      `guest-customer-upsert: order ${orderId} has no normalizable phone, skip`
    )
    return
  }

  const canonicalEmail = guestCustomerEmailFromNormalizedPhone(normalized)
  const orderEmail = (order.email ?? "").trim().toLowerCase()
  const stubOnly = orderEmailIsStubOnly(orderEmail, canonicalEmail)
  const marketingContact = !stubOnly

  if (!stubOnly) {
    const emailOwners = await customerModule.listCustomers(
      { email: orderEmail },
      { take: 3 }
    )
    if (emailOwners.some((c) => c.has_account)) {
      return
    }
  }

  const byCanonical = await customerModule.listCustomers(
    { email: canonicalEmail, has_account: false },
    { take: 1 }
  )
  let guest: CustomerDTO | undefined = byCanonical[0]

  if (!guest) {
    guest = await findGuestCustomerForPhone(
      customerModule,
      normalized,
      phoneRaw || ""
    )
  }

  const first =
    order.shipping_address?.first_name?.trim() ||
    order.email?.split("@")[0] ||
    "Khách"
  const last =
    order.shipping_address?.last_name?.trim() ||
    (first && first !== "." ? "." : ".")

  if (guest) {
    const prevMeta = guest.metadata as Record<string, unknown> | undefined
    const meta = mergeGuestMetadata(prevMeta, normalized, marketingContact)
    const payload: {
      phone: string
      metadata: Record<string, unknown>
      email?: string
      first_name?: string
      last_name?: string
    } = {
      phone: normalized,
      metadata: meta,
    }

    if (!stubOnly && isGuestOrderLocalEmail(guest.email ?? "")) {
      payload.email = orderEmail
    }
    if (!guest.first_name?.trim()) {
      payload.first_name = first
    }
    if (!guest.last_name?.trim()) {
      payload.last_name = last
    }

    try {
      await customerModule.updateCustomers(guest.id, payload)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (/unique|duplicate/i.test(msg) && payload.email) {
        logger.warn(
          `guest-customer-upsert: cannot set email ${orderEmail} on ${guest.id}, merge metadata only`
        )
        await customerModule.updateCustomers(guest.id, {
          phone: normalized,
          metadata: meta,
          ...(payload.first_name ? { first_name: payload.first_name } : {}),
          ...(payload.last_name ? { last_name: payload.last_name } : {}),
        })
        return
      }
      throw e
    }
    return
  }

  if (!stubOnly) {
    const dup = await customerModule.listCustomers(
      { email: orderEmail, has_account: false },
      { take: 1 }
    )
    if (dup[0]) {
      return
    }
  }

  const emailForCreate = stubOnly ? canonicalEmail : orderEmail

  const wf = createCustomersWorkflow(container)
  try {
    await wf.run({
      input: {
        customersData: [
          {
            email: emailForCreate,
            first_name: first,
            last_name: last || ".",
            phone: normalized,
            has_account: false,
            metadata: {
              source: "guest_checkout_order",
              phone_normalized: normalized,
              marketing_contact: marketingContact,
            },
          },
        ],
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/unique|duplicate|already exists/i.test(msg)) {
      logger.info(
        `guest-customer-upsert: customer ${emailForCreate} already exists (race), skip`
      )
      return
    }
    throw e
  }
}

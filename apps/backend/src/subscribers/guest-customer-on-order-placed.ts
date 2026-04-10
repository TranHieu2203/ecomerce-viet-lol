import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { upsertGuestCustomerAfterOrderPlaced } from "../utils/guest-customer-from-order"

export default async function guestCustomerOnOrderPlaced(
  args: SubscriberArgs<{ id: string }>
) {
  await upsertGuestCustomerAfterOrderPlaced(args)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

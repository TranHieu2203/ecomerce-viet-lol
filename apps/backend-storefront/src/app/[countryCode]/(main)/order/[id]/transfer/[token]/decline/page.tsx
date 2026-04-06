import { declineTransferRequest } from "@lib/data/orders"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { Heading, Text } from "@medusajs/ui"
import TransferImage from "@modules/order/components/transfer-image"

function fillTransferId(s: string, id: string) {
  return s.replaceAll("{id}", id)
}

export default async function TransferPage({
  params,
}: {
  params: Promise<{ countryCode: string; id: string; token: string }>
}) {
  const { countryCode, id, token } = await params
  const tr = getStorefrontMessages(countryCode).transfer

  const { success, error } = await declineTransferRequest(id, token)

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        {success && (
          <>
            <Heading level="h1" className="text-xl text-zinc-900">
              {tr.declineSuccessTitle}
            </Heading>
            <Text className="text-zinc-600">
              {fillTransferId(tr.declineSuccessBody, id)}
            </Text>
          </>
        )}
        {!success && (
          <>
            <Text className="text-zinc-600">{tr.declineError}</Text>
            {error && (
              <Text className="text-red-500">
                {tr.errorPrefix} {error}
              </Text>
            )}
          </>
        )}
      </div>
    </div>
  )
}

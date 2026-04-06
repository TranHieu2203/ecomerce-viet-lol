import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { Heading, Text } from "@medusajs/ui"
import TransferActions from "@modules/order/components/transfer-actions"
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

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        <Heading level="h1" className="text-xl text-zinc-900">
          {fillTransferId(tr.requestTitle, id)}
        </Heading>
        <Text className="text-zinc-600">{fillTransferId(tr.intro, id)}</Text>
        <div className="w-full h-px bg-zinc-200" />
        <Text className="text-zinc-600">{tr.acceptExplain}</Text>
        <Text className="text-zinc-600">{tr.declineExplain}</Text>
        <div className="w-full h-px bg-zinc-200" />
        <TransferActions id={id} token={token} />
      </div>
    </div>
  )
}

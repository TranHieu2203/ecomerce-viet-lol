import { Text } from "@medusajs/ui"
import { VariantPrice } from "types/global"

export default function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  if (price.price_type !== "sale") {
    return (
      <Text className="text-ui-fg-base font-medium" data-testid="price">
        {price.calculated_price}
      </Text>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <Text
          className="text-[12px] leading-none text-ui-fg-muted line-through"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
        <span className="text-[10px] leading-none font-semibold text-white bg-brand-accent rounded-full px-1.5 py-[3px]">
          -{price.percentage_diff}%
        </span>
      </div>
      <Text
        className="text-brand-accent font-semibold"
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
    </div>
  )
}

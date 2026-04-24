"use client";

import Script from "next/script";

interface StripePricingTableProps {
  pricingTableId: string;
  publishableKey: string;
}

export function StripePricingTable({ pricingTableId, publishableKey }: StripePricingTableProps) {
  return (
    <>
      <Script async src="https://js.stripe.com/v3/pricing-table.js" />
      {/* @ts-expect-error stripe-pricing-table is a custom HTML element */}
      <stripe-pricing-table
        pricing-table-id={pricingTableId}
        publishable-key={publishableKey}
      />
    </>
  );
}

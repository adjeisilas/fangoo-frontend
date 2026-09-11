<script setup lang="ts">
const { listSuppliers } = useMarketplace();

const { data: suppliers, status } = await useAsyncData(
  'home-suppliers',
  () => listSuppliers(),
  { default: () => [] },
);

// Everything the page shows as "live" comes from here — real offers, cheapest first.
const { offers, supplierCount, fuelCount } = useMarketOffers(suppliers);

useSeo({
  title: 'Fangoo — Compare Verified Fuel Suppliers in Ghana',
  description:
    'Fangoo is a B2B fuel marketplace. Compare verified suppliers on price per litre, check stock and delivery terms, order petrol, diesel, kerosene or LPG, and track every delivery.',
});
</script>

<template>
  <div class="pb-4">
    <HomeHeroSection
      :offers="offers"
      :status="status"
      :supplier-count="supplierCount"
      :fuel-count="fuelCount"
    />
    <HomeLiveMarketplace :offers="offers" :status="status" />
    <HomeHowItWorks />
    <HomeBuyerExperience />
    <HomeSupplierExperience />
    <HomeTrustVerification />
    <HomeDeliveryTracking />
    <HomeClosingCta :supplier-count="supplierCount" />
  </div>
</template>

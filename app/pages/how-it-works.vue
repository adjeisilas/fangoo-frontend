<script setup lang="ts">
/**
 * A real route rather than a `#how-it-works` anchor on the home page: an anchor put
 * the fragment in the address bar, could not carry its own title or description, and
 * relied on the browser landing in the right place after the reveal animation had
 * settled. A page just works, and is indexable on its own terms.
 */
import { imagery } from '../config/imagery.js';

const { listSuppliers } = useMarketplace();

const { data: suppliers } = await useAsyncData(
  'how-it-works-suppliers',
  () => listSuppliers().catch(() => []),
  { default: () => [] },
);

const verifiedCount = computed(
  () => suppliers.value.filter((s) => s.verificationStatus === 'VERIFIED').length,
);

/** Buying from the catalogue: you pick the supplier. */
const catalogueSteps = [
  {
    icon: 'search',
    title: 'Compare the market',
    body: 'Filter by fuel, delivery area, supplier and maximum price per litre. Every listing shows live stock, the minimum order and the delivery fee before you commit.',
  },
  {
    icon: 'wallet',
    title: 'Order and pay securely',
    body: 'Your total is calculated on our servers from the supplier’s live listing — never from anything your browser sends. Payment clears through Paystack before the order moves.',
  },
  {
    icon: 'truck',
    title: 'Track to your gate',
    body: 'Follow the order from confirmed to preparing to out for delivery. You confirm arrival yourself — a supplier cannot close its own delivery.',
  },
];

/** Buying by request: suppliers compete for you. */
const rfqSteps = [
  {
    icon: 'spark',
    title: 'Post what you need',
    body: 'Fuel type, volume, delivery area, address and the date you need it by. It takes a minute and costs nothing.',
  },
  {
    icon: 'building',
    title: 'Verified suppliers bid',
    body: 'Only verified suppliers who actually deliver to your area see the request. Each one bids a delivered price. No supplier can see a rival’s bid.',
  },
  {
    icon: 'check',
    title: 'You award the best offer',
    body: 'Compare price per litre, delivery fee, total and delivery date side by side. Award one, and it becomes an order at exactly that agreed price.',
  },
];

const supplierSteps = [
  {
    title: 'Get verified',
    body: 'Register your company and submit your details. An administrator reviews every depot before it can trade or bid.',
  },
  {
    title: 'Set your prices and coverage',
    body: 'List the fuels you carry with your own price per litre, stock and minimum order, then choose the areas you deliver to and your fee for each.',
  },
  {
    title: 'Win and fulfil work',
    body: 'Take catalogue orders, or bid on buyer requirements in your areas. Confirm, prepare and dispatch from one queue.',
  },
];

const guarantees = [
  {
    icon: 'shield',
    title: 'Every supplier is checked',
    body: 'No depot can list fuel, take an order or bid on a request until an administrator has verified it.',
  },
  {
    icon: 'wallet',
    title: 'Prices are server-calculated',
    body: 'Totals come from the supplier’s live listing or the offer you accepted. A tampered browser cannot change what you pay.',
  },
  {
    icon: 'droplet',
    title: 'Stock moves only on payment',
    body: 'A supplier’s available litres are reduced once payment is confirmed, so you never buy fuel that has already been sold.',
  },
  {
    icon: 'mapPin',
    title: 'You close the loop',
    body: 'Only you can mark an order delivered. The supplier moves it as far as out for delivery, and no further.',
  },
];

useSeo({
  title: 'How Fangoo Works — Compare, Order and Track Fuel in Ghana',
  description:
    'Compare verified Ghanaian fuel suppliers by price per litre, or post a requirement and let them bid. See how ordering, payment and delivery tracking work on Fangoo.',
});
</script>

<template>
  <div class="pb-8">
    <!-- Hero -->
    <section class="container-page pt-12 sm:pt-16">
      <div class="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            How Fangoo works
          </p>
          <h1
            class="mt-3 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl"
          >
            Two ways to buy fuel. Both without a single phone call.
          </h1>
          <p class="mt-5 max-w-xl text-base leading-relaxed text-ink-500">
            Browse verified suppliers and buy at the listed price, or tell the market
            what you need and let suppliers bid for it. Either way the price is agreed
            before anything moves, and you track the delivery to your gate.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <BaseAppButton to="/marketplace" size="lg">
              Browse the marketplace
              <BaseAppIcon name="arrowRight" :size="18" />
            </BaseAppButton>
            <BaseAppButton to="/requests" size="lg" variant="outline">
              Post a requirement
            </BaseAppButton>
          </div>

          <p v-if="verifiedCount" class="mt-6 flex items-center gap-2 text-sm text-ink-500">
            <BaseAppIcon name="shield" :size="15" class="text-brand-600" />
            {{ verifiedCount }} verified
            {{ verifiedCount === 1 ? 'supplier is' : 'suppliers are' }} trading on Fangoo
            right now.
          </p>
        </div>

        <!--
          Decorative: the page reads identically without it, so it carries an empty
          alt and is hidden from assistive tech rather than narrated.
        -->
        <div class="reveal reveal-right relative" style="--reveal-delay: 120ms">
          <div
            class="relative overflow-hidden rounded-4xl border border-ink-100 bg-ink-950"
          >
            <img
              :src="imagery.loadingBay.src"
              alt=""
              aria-hidden="true"
              :width="imagery.loadingBay.width"
              :height="imagery.loadingBay.height"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              class="aspect-[4/5] w-full object-cover sm:aspect-[16/11] lg:aspect-[4/5]"
            />
            <div
              class="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent"
              aria-hidden="true"
            />

            <!-- A real fact about the model, not a caption on the photograph. -->
            <div class="absolute inset-x-0 bottom-0 p-6">
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-400">
                One order, one supplier
              </p>
              <p class="mt-1.5 text-sm leading-relaxed text-white/90">
                Whichever route you take, you always know exactly who is delivering your
                fuel and what you agreed to pay.
              </p>
            </div>
          </div>

          <span
            class="pointer-events-none absolute -right-6 -top-6 -z-10 hidden h-40 w-40 rounded-full bg-brand-400/20 blur-3xl lg:block"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>

    <!-- Route 1: the catalogue -->
    <section class="container-page pt-20 sm:pt-24">
      <BaseAppSectionHeading
        eyebrow="Route one"
        title="Buy from the catalogue"
        lead="You already know roughly what you want. Compare what is listed, pick a supplier, and order."
      />

      <ol class="mt-10 grid gap-4 md:grid-cols-3">
        <li
          v-for="(step, index) in catalogueSteps"
          :key="step.title"
          class="reveal rounded-3xl border border-ink-100 bg-white p-6 transition-all duration-500 hover:border-brand-200 hover:shadow-soft"
          :style="{ '--reveal-delay': index * 100 + 'ms' }"
        >
          <span
            class="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-950 text-brand-400"
          >
            <BaseAppIcon :name="step.icon" :size="20" />
          </span>
          <p class="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
            Step {{ index + 1 }}
          </p>
          <h3 class="mt-1.5 font-display text-lg font-bold text-ink-900">
            {{ step.title }}
          </h3>
          <p class="mt-2 text-sm leading-relaxed text-ink-500">{{ step.body }}</p>
        </li>
      </ol>
    </section>

    <!-- Route 2: request for quote -->
    <section class="container-page pt-20 sm:pt-24">
      <BaseAppSectionHeading
        eyebrow="Route two"
        title="Let suppliers bid for your business"
        lead="You need a large volume, or a better price than the shelf. Post it once and compare what comes back."
      />

      <div class="mt-10 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <ol class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <li
            v-for="(step, index) in rfqSteps"
            :key="step.title"
            class="reveal flex gap-5 rounded-3xl border border-ink-100 bg-white p-6"
            :style="{ '--reveal-delay': index * 100 + 'ms' }"
          >
            <div class="flex flex-col items-center">
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-950 text-brand-400"
              >
                <BaseAppIcon :name="step.icon" :size="20" />
              </span>
              <span
                v-if="index < rfqSteps.length - 1"
                class="mt-2 hidden w-px flex-1 bg-ink-100 lg:block"
                aria-hidden="true"
              />
            </div>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                Step {{ index + 1 }}
              </p>
              <h3 class="mt-1.5 font-display text-lg font-bold text-ink-900">
                {{ step.title }}
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-500">{{ step.body }}</p>
            </div>
          </li>
        </ol>

        <!-- An offer comparison as the buyer actually sees it. -->
        <div
          class="reveal reveal-right rounded-4xl border border-ink-100 bg-sand-100 p-6 lg:sticky lg:top-28"
          style="--reveal-delay: 120ms"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
            Comparing offers
          </p>
          <p class="mt-1 text-xs text-ink-500">25,000 L Diesel (AGO) · Tema</p>

          <div class="mt-4 space-y-3">
            <div class="rounded-3xl border border-brand-300 bg-white p-4 ring-4 ring-brand-400/10">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-bold text-ink-900">Supplier A</p>
                  <p class="text-[11px] text-ink-500">Delivers in 3 days</p>
                </div>
                <BaseAppBadge tone="brand">Lowest price</BaseAppBadge>
              </div>
              <div class="mt-3 flex items-baseline justify-between border-t border-ink-100 pt-3">
                <span class="text-xs text-ink-500">GHS 13.25 / litre</span>
                <span class="font-display text-lg font-extrabold text-ink-900">
                  GHS 332,100
                </span>
              </div>
            </div>

            <div class="rounded-3xl border border-ink-100 bg-white p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-bold text-ink-900">Supplier B</p>
                  <p class="text-[11px] text-ink-500">Delivers tomorrow</p>
                </div>
                <BaseAppBadge tone="success">Earliest delivery</BaseAppBadge>
              </div>
              <div class="mt-3 flex items-baseline justify-between border-t border-ink-100 pt-3">
                <span class="text-xs text-ink-500">GHS 13.60 / litre</span>
                <span class="font-display text-lg font-extrabold text-ink-900">
                  GHS 340,850
                </span>
              </div>
            </div>
          </div>

          <p class="mt-4 text-xs leading-relaxed text-ink-500">
            An illustration of the comparison view. Real offers are priced against the
            exact volume you asked for, so the totals are directly comparable.
          </p>
        </div>
      </div>
    </section>

    <!-- What holds it together -->
    <section class="container-page pt-20 sm:pt-24">
      <BaseAppSectionHeading
        eyebrow="What protects you"
        title="The rules that hold every order together"
        lead="These are enforced on our servers, not asked of anyone politely."
      />

      <div class="mt-10 grid gap-4 sm:grid-cols-2">
        <div
          v-for="(item, index) in guarantees"
          :key="item.title"
          class="reveal flex gap-4 rounded-3xl border border-ink-100 bg-white p-6"
          :style="{ '--reveal-delay': index * 80 + 'ms' }"
        >
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sand-100 text-ink-800"
          >
            <BaseAppIcon :name="item.icon" :size="18" />
          </span>
          <div>
            <h3 class="font-display text-base font-bold text-ink-900">{{ item.title }}</h3>
            <p class="mt-1.5 text-sm leading-relaxed text-ink-500">{{ item.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- For suppliers -->
    <section class="container-page pt-20 sm:pt-24">
      <div class="surface-grain overflow-hidden rounded-4xl bg-ink-950 text-white">
        <div class="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_1.4fr] lg:items-center lg:p-14">
          <div class="reveal">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
              Selling on Fangoo
            </p>
            <h2
              class="mt-3 font-display text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl"
            >
              If you have fuel to sell, the demand is already here.
            </h2>
            <p class="mt-4 max-w-md text-sm leading-relaxed text-ink-300">
              You set your own prices, your own coverage and your own minimum order.
              Fangoo brings you buyers who have already decided to spend.
            </p>
            <BaseAppButton to="/register" class="mt-7">
              Become a supplier
              <BaseAppIcon name="arrowRight" :size="16" />
            </BaseAppButton>
          </div>

          <ol class="reveal grid gap-4 sm:grid-cols-3" style="--reveal-delay: 120ms">
            <li
              v-for="(step, index) in supplierSteps"
              :key="step.title"
              class="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <p class="font-display text-2xl font-extrabold text-brand-400">
                0{{ index + 1 }}
              </p>
              <h3 class="mt-2 text-sm font-bold">{{ step.title }}</h3>
              <p class="mt-1.5 text-xs leading-relaxed text-ink-300">{{ step.body }}</p>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- Close -->
    <section class="container-page pt-20 sm:pt-24">
      <div
        class="reveal flex flex-col items-start gap-6 rounded-4xl border border-ink-100 bg-white p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10"
      >
        <div>
          <h2 class="font-display text-2xl font-bold tracking-tight text-ink-900">
            Ready to see what fuel actually costs today?
          </h2>
          <p class="mt-2 max-w-xl text-sm text-ink-500">
            Browsing is free and needs no account. You only sign in when you order.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <BaseAppButton to="/marketplace">
            Browse fuel
            <BaseAppIcon name="arrowRight" :size="16" />
          </BaseAppButton>
          <BaseAppButton to="/register" variant="outline">Create an account</BaseAppButton>
        </div>
      </div>
    </section>
  </div>
</template>

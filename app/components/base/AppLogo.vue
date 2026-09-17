<script setup lang="ts">
/**
 * The Fangoo logo, for light backgrounds only: its green lettering disappears on
 * dark ones, where the square app mark (`assets/brand/fangoo-mark.png`) is used.
 *
 * Size it with a height class (`h-12`); the width follows the image's aspect ratio.
 * Pass `alt=""` when it sits inside a link that already has an accessible name.
 */
import logo from '../../assets/brand/fangoo-logo.png';

withDefaults(defineProps<{ alt?: string }>(), { alt: 'Fangoo' });
</script>

<template>
  <img :src="logo" :alt="alt" width="259" height="192" decoding="async" class="block w-auto" />
</template>

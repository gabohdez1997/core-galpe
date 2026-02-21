<script lang="ts">
	import "./layout.css";
	import "$lib/styles/icons.css";
	import { Toaster } from "svelte-sonner";
	import { pwaInfo } from "virtual:pwa-info";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#2D733E" />
	<title>CORE by Galpe</title>
	{@html pwaInfo ? pwaInfo.webManifest.linkTag : ""}
</svelte:head>

<Toaster position="top-right" richColors />

<div
	class="min-h-screen bg-neutral-900 text-white font-sans selection:bg-galpe-green/30"
>
	<!-- Animated Background -->
	<div class="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
		<div
			class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-galpe-green/20 blur-[120px] rounded-full animate-pulse"
		></div>
		<div
			class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-galpe-orange/10 blur-[120px] rounded-full animate-pulse delay-700"
		></div>
	</div>

	{@render children()}
</div>

<style>
	:global(body) {
		margin: 0;
		overflow-x: hidden;
		background-color: #0a0a0a;
	}
</style>

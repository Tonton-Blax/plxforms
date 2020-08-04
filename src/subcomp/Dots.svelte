<script>
import { onMount } from 'svelte';

export let score = 1;
export let length = 3;
let ready = false;

let dots = []

onMount(async () => {	
    let tmp = score;
    for (let i = 0; i < length; i++) {
        tmp-- > 0 ? dots.push("plein") : dots.push("vide");
    }
    ready = true;
});

</script>
{#if ready}
    {#each dots as dot}
        <div class="dot" class:plein={dot == "plein"} class:vide={dot == "vide"}></div>
    {/each}
{/if}

<style>
    .dot {
        height: 1em;
        width: 1em;
        border-radius: 50%;
        display: inline-block;
        margin-right: 0.2em;
    }
    .plein {
        background-color: white;
    }
    .vide {
        background-color: none;
        border: solid 2px white;
    }

    @media only screen and (max-width: 1280px) {

        .dot {
            height: 0.8em;
            width: 0.8em;
        }

	}

    
</style>
import { writable } from 'svelte/store';

export let theData = writable(0);
export let API = 'http://localhost:3128/'

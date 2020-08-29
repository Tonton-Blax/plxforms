import { writable } from 'svelte/store';

export let options = writable({isOr : true});
export let API = 'http://localhost:3128/'

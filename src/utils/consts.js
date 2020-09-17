import { writable } from 'svelte/store';

export let options = writable({isOr : true, pageSize : 25});
export let API = 'http://localhost:3128/'
//export let API = 'http://apiclient.ovh/'

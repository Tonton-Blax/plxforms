import App from './App.svelte';
import 'svelma-pro/svelma-pro.css'
import '@fortawesome/fontawesome-free/css/all.css'


const app = new App({
	target: document.body,
	props: {
		name: 'plxForms'
	}
});

export default app;
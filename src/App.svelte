<svelte:head>
	<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500&display=swap" rel="stylesheet">
	<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css">
</svelte:head>
<script>
	import { onMount, onDestroy } from 'svelte';
	import SparkMD5 from 'spark-md5';
	import { Button, Field, Icon, Input, Notification, Pagination } from 'svelma-pro';
	import SavoirFaire from './subcomp/SavoirFaire.svelte';
	import Retourexp from './subcomp/Retourexp.svelte';
	import Switch from './subcomp/Switch.svelte';
	import Detailsexpert from './subcomp/Detailsexpert.svelte';
	import Geco from './subcomp/Geco.svelte';
	import Loading from './subcomp/Loading.svelte';
	import Modal from './subcomp/Modal.svelte'
	import Recherche from './subcomp/Recherche.svelte'
	import { API, theData } from './utils/consts.js'
	import axios from 'axios';
	import Mark from './utils/mark.es6.js'
	
	
	const RANGE = 40;
	let isMobile = window.matchMedia("(max-width: 768px)");

	let results = [];
	let instance = {};
	
	let formIndex; let indexes = [];

	let states = {
		currentRange : 0,
		ready : false,
		domReady : false,
		loading : false,
		lightOn : false,
		inputError : false,
		currentForm : "retex",
		laTotale : false,
		forceScreenGrab : false,
		advancedSearch : false,
		currentPage : {slug: "", isUser : false, isAdmin : false }
	}

	const sheetAPI = API + 'sheet/'
	const WPAPI = "https://www.polyexpert.fr/wp-json/contact-form-7/v1/contact-forms/3718/feedback"
	const PWD = "16bd84b45460199de52067766741e763";

	let entriesObject = [];

	let initForm = {
		email: '',
		password: ''
	};

	let destinataire = '';

	let plxForms = {
		"retex": 
		{ name: "Retour d'Expérience", url: "retex", id: "Adresse e-mail" },
		"interne":
		{ name: "Retour d'Expérience", url: "retex", id: "Adresse e-mail" }, 
		"savoirfaire": 
		{ name: "Savoir-Faire", url: "savoirfaire", id: "Adresse e-mail" },
		"detailsexpert": 
		{ name: "Détails Expert", url : "experts", id: "Adresse e-mail" },
		"experts": 
		{ name: "Détails Expert", url : "experts", id: "Adresse e-mail" },
		"geco": 
		{ name: "Geco", url: "geco", id: "Adresse e-mail" }
	}

	$: 	if (states.ready && window.history && window.history.pushState) {

			window.history.pushState('forward', null, './#forward');

			window.onpopstate = () => {
				states.ready=false; formIndex = undefined; states.currentForm = "retex"; states.laTotale = false;
			}
		}

	
	onMount(async () => {	
		localStorage.clear();
		lightOff()
		

		states.currentPage.slug = window.location.hash.split('#');
		if ((states.currentPage.slug && states.currentPage.slug[1] == 'forward') || states.currentPage.slug.length <= 1) {
				states.currentPage.isAdmin = false;
				states.currentPage.isUser = false;
		}
		else if (states.currentPage.slug[1] && states.currentPage.slug[1].length > 23) {
			states.currentPage.slug = states.currentPage.slug[1];
			states.currentPage.isAdmin = false;
			states.currentPage.isUser = true;
		}
		else if (states.currentPage.slug && states.currentPage.slug[1] == 'admin') {
			states.currentPage.slug = 'admin';
			states.currentPage.isAdmin = true;
			states.currentPage.isUser = false;
		} 
		
		states.domReady = true;
	});

	onDestroy(() => { lightOff() });


	function mailExists (mail) {
		axios.get(sheetAPI+plxForms[states.currentForm].url)
		.then(function(data) { 
			if (data.data.Message.data[i][plxForms[states.currentForm].id].toLowerCase() == mail.toLowerCase()) {
				return true;
			}
		});
	}

	function sendMail ( lienunique, destinataire ) {
	
		let bodyFormData = new FormData()
		bodyFormData.append("lienunique", lienunique);
		bodyFormData.append("destinataire", destinataire);
		
		axios.post (WPAPI, bodyFormData)
		.then((e) => {
            e.data.status == 'mail_sent' ? 
			showNotification( "e-mail envoyé", { type: 'is-success', position: 'is-bottom-right', icon: true })
			: showNotification("Oups! Une erreur s'est produite", { type: 'is-danger', position: 'is-bottom-right', icon: true });
        });	
  	}

	function showNotification(message, props) {
		Notification.create({
			message: message,
			...props
		})
	}

	function handleFormEmail () {
		if (!(initForm.email || destinataire) || !(initForm.email || destinataire).match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
			states.inputError = true;
		else states.inputError = false;
	}
	
	function handlePassword () {
		if (SparkMD5.hash(initForm.password) == PWD) {
			localStorage.setItem('pwd',initForm);
			return true;
		}
		else return false;
	}

	function handleKeydown (e, trigger) {
		states.inputError = false;
		if (e.keyCode === 13) {
			if (!states.currentPage.isUser && !states.currentPage.isAdmin)
				sendMail('https://www.polyexpert.fr/formulaires/#' + SparkMD5.hash(destinataire.toLowerCase()), destinataire.toLowerCase());
			else handleSubmitEmail();
		}
	}

	function handleSubmitEmail () {
		
		if (!states.domReady) return;
		
		if (states.currentPage.isAdmin && !handlePassword()) { 
			showNotification( "Mot de passe erroné", { type: 'is-danger', position: 'is-bottom-right', icon: true });
			return;
		}
		
		else if (states.currentPage.isUser && SparkMD5.hash(initForm.email) != states.currentPage.slug) {
			showNotification( "L'adresse e-mail saisie ne correspond pas à votre lien personnalisé", { type: 'is-danger', position: 'is-bottom-right', icon: true, duration: 6000 });
			return
		}

		else {
			states.loading = true;
			entriesObject = []; indexes = [];
		
			axios.get(sheetAPI+plxForms[states.currentForm].url)
			.then(function(data) {
				//console.log(data.data.data)
				let jason = data.data;
				for (let i = 0; i < jason.length ; i ++) {
		
					if (jason[i][plxForms[states.currentForm].id] && jason[i][plxForms[states.currentForm].id].toLowerCase() == initForm.email.toLowerCase()) {
						indexes.push(i);
					}
				}

				if (!indexes.length) {
					states.loading = false;
					showNotification( "Adresse e-mail introuvable pour ce " + plxForms[states.currentForm].name, { type: 'is-danger', position: 'is-bottom-right', icon: true, duration: 60000 });
					return;
				}
				else {
					indexes.forEach(i => entriesObject.push(jason[i]));
					formIndex = entriesObject.length - 1;
					states.ready = true;
					states.loading = false;
				}
			})
			
		}	
	}

	let handleRequestForceCapture = (index) => {
		formIndex = index;
		states.laTotale = false;
		states.forceScreenGrab = true;
	}

	let handleCaptureOK = () => {		
		states.forceScreenGrab = false;
		states.laTotale = true;
	}

	let handleSearch = (form) => {
		
		states.advancedSearch = false;
		states.ready = false;
		states.loading = true;
		if(!entriesObject.length) {
			showNotification("Aucun résultat trouvé", { type: 'is-danger', position: 'is-bottom-right', icon: true });
			return;
		}
		else if (entriesObject.length >= 1) {
			
			if (entriesObject.length > RANGE) {
				entriesObject = [];
				entriesObject = $theData.filtered.filter((data, i) => i >= states.currentRange && i <= states.currentRange + RANGE);
			}
			states.laTotale = true;
			let message = entriesObject.length >= 2 ? "résultats trouvés" : "résultat trouvé";
			
			showNotification(`${entriesObject.length} ${message}`, { type: 'is-success', position: 'is-bottom-right', icon: true });
		}
		else formIndex = 0;


		states.currentForm = form;
		states.loading = false; states.ready = true;
		//console.log(entriesObject.length);
	}

	function changeRange(dir) {
		if ((states.currentRange + dir) > entriesObject.length) 
			states.currentRange = entriesObject.length -1;
		
		else if ((states.currentRange + dir) < 0)
			states.currentRange = 0;
		else 
			states.currentRange = states.currentRange + dir;
		console.log("states.currentRange : ", states.currentRange, "length : ", entriesObject.length);
	}
	
	function Markit() {
		if (!states.ready || !states.laTotale) return;
		
		states.lightOn = !states.lightOn;
		let secteurs = [];
		let highlights;

		
		let elMap = 
		{
			"région"        : ".infospersos",
			"département"   : ".infospersos",
			"darva"         : ".infospersos",
			"gecor"         : ".infospersos",
			"domaine"       : ".domaines",
			"electricité"   : ".domaines",
			"vol"           : ".domaines",
			"autres"        : ".domaines",

			"macro"     	: ".secteur-activite",
			"enjeu"     	: ".enjeu",
			"resultats" 	: ".resultat-obtenu",

			"certifications"        : ".certifications",
            "vos domaines"          : ".vosdomaines",
            "specialites"           : ".specialites",
            "marquant"              : ".timeline",
            "diplome"               : ".formation"
		}

	
		if (states.lightOn === true)
		{	
			highlights = Object.keys(results);		

			if (highlights.length) {
				highlights.forEach(h => {
					if (!instance[h])
						instance[h] = new Mark(document.querySelectorAll(`${elMap[h]}`));
					if ((Object.prototype.toString.call(results[h]).indexOf("Object")>-1))
						results[h] = Object.values(results[h]);
					//console.log(results[h]);
					//console.log("h :", h, "\n", "res :", results[h], "\n")
					
					instance[h].mark(results[h], {separateWordSearch : false, className : `mark-${h}`});
				});
			}
		}
		else lightOff ();

	}

	let lightOff = () => {
		states.lightOn = false;
		for (const k in instance) {
			instance[k].unmark();
		}
	}

</script>
	{#if entriesObject && entriesObject.length > RANGE}
			<div class="above-all">
				<Pagination current="1" total="{Math.floor($theData.filtered.length / RANGE)}" show="5" align="centered" />
			</div>
		{/if}
		<Modal closeText = "Annuler et revenir" title="Recherche Avancée" width="40vw" bind:active={states.advancedSearch}>
			<Recherche bind:entriesObject bind:results on:searchReady={(e) => handleSearch(e.detail.form)}/>
		</Modal>

	{#if !states.ready}
		
		<!-- LOGO -->
		<div class="columns">
			<div class="column is-one-third global-center">
				<div class="is-flex" style="text-align:center; margin-bottom:3em;">
					<img src="./img/polyexpert.png" width="300px" alt="logo">
				</div>
			
				{#if !states.loading}
				
				<!-- MODAL RECHERCHE -->
	
					{#if !states.currentPage.isUser && !states.currentPage.isAdmin}
					<!-- SASIE E-MAIL POUR RESET SI OUBLI -->
						<div class="is-flex" class:downspacer={!states.currentPage.isAdmin}>
						<p style="margin-bottom:1em;">Vous devez vous connecter à l'aide d'un lien personnalisé.<br>Si vous pensez l'avoir égaré, renseignez votre adresse e-mail ci-dessous</p>
						{#if states.inputError}<div class="help is-danger help-max">Syntaxe du mail invalide</div>{/if}
							<Field expanded size="is-large">
								<input type="email" style="width:100%;" placeholder = "Saisissez votre-email pour recevoir votre lien unique"
								on:keydown={(e)=>handleKeydown(e,'email')} bind:value={destinataire} on:blur|preventDefault={()=>handleFormEmail()} />
							</Field>
						</div>

					{:else if states.currentPage.isUser}
					<!-- SASIE E-MAIL ADMINISTRATEUR -->
						<div class="is-flex" style="margin-bottom:10px;">
						{#if states.inputError}<div class="help is-danger help-max">Syntaxe du mail invalide</div>{/if}
							<Field expanded size="is-large">
								<input type="email" style="width:100%;" placeholder = "Saisissez votre e-mail pour vérification" 
								on:keydown={(e)=>handleKeydown(e,'email')} bind:value={initForm.email} on:blur|preventDefault={()=>handleFormEmail()} />
							</Field>
						</div>

					{:else if states.currentPage.isAdmin}
					<!-- SAISIE MOT DE PASSE SI ADMIN-->
						<div class="is-flex" style="margin-bottom:10px;">
						{#if states.inputError}<div class="help is-danger help-max">Syntaxe du mail invalide</div>{/if}
							<Field expanded size="is-large">
								<input type="email" style="width:100%;" placeholder = "e-mail du répondant"
								on:keydown={(e)=>handleKeydown(e,'email')} bind:value={initForm.email} on:blur|preventDefault={()=>handleFormEmail()} />
							</Field>
						</div>

						<div class="is-flex downspacer">
							<Field expanded size="is-large">
								<input on:keydown={(e)=>handleKeydown(e,'pwd')} type="password" style="width:100%;" 
								bind:value={initForm.password} passwordReveal={true} placeholder = "mot de passe administrateur" />
							</Field>
						</div>
					{/if}

					<!-- CHOIX DU FORM -->
					{#if states.currentPage.isAdmin || states.currentPage.isUser}
					<Field expanded size="is-large">
							<div class="fieldwrapper">
								<input class="is-checkradio" type="radio" name="retourxp" id="retourxp" bind:group={states.currentForm} value={"retex"}>
								<label for="retourxp">Retex (usage externe)</label>	
								<input class="is-checkradio" type="radio" name="retourxpinterne" id="retourxpinterne" bind:group={states.currentForm} value={"interne"}>
								<label for="retourxpinterne">Retex (affichage nom et e-mail)</label>			
								<input class="is-checkradio" type="radio" name="savoirfaire" id="savoirfaire" bind:group={states.currentForm} value={"savoirfaire"}>
								<label for="savoirfaire">Savoir-faire</label>
								<input class="is-checkradio" type="radio" name="detailsexpert" id="detailsexpert" bind:group={states.currentForm} value={"detailsexpert"}>
								<label for="detailsexpert">Compétences</label>
								<input class="is-checkradio" type="radio" name="geco" id="geco" bind:group={states.currentForm} value={"geco"}>
								<label for="geco">Formulaire Geco</label>
							</div>
						</Field>
					
					<!-- SWITCH LA TOTALE + OUBLI -->
					<div class:hide={states.currentForm !== "interne" && states.currentForm !== "retex"} class="switch">
						<Switch bind:checked={states.laTotale} type="is-success"><div class="switch-interne">
							{states.laTotale ? "Voir Tout" : "Afficher uniquement le dernier retour en date"}</div>
						</Switch>
					</div>
					{/if}

					<!-- BOUTON VALIDER -->
					<div class="is-flex downspacer">
						<p class="control" style="text-align:center;">
							<button id="boutonvalider" class="button is-primary" class:is-fullwidth={isMobile.matches} style="padding-left:2em;padding-right:2em;" type="submit" 
							on:click={!states.currentPage.isUser && !states.currentPage.isAdmin ? sendMail('https://www.polyexpert.fr/#' + SparkMD5.hash(destinataire.toLowerCase()), destinataire.toLowerCase()) : handleSubmitEmail}>Valider
							</button>
				
					<!-- BOUTON RECHERCHE AVANCEE -->
						{#if states.currentPage.isAdmin}
							<button class="button is-warning" class:is-fullwidth={isMobile.matches} style="padding-left:2em;padding-right:2em;" type="submit" 
							on:click={() => states.advancedSearch = true}>Recherche avancée
							</button>
						{/if}
						</p>
					</div>
				
				<!-- SPINNER LOADING -->
				{:else}
				<Loading color={"024579"} text={"Chargement"} parentStyle={"position:relative;top:6vh;"}/>
				{/if}
			</div>
		</div>

	{:else}
		
		{#if (states.currentForm=="retex" || states.currentForm=='interne') && !states.laTotale}
		
			<Retourexp entriesObject={entriesObject[formIndex]} isInterne={states.currentForm == 'interne'} forceScreenGrab={states.forceScreenGrab} 
			on:captureOK={handleCaptureOK}  />


		{:else if (states.currentForm=="retex" || states.currentForm=='interne') && states.laTotale}
			<div class="bouton-highlight">
				<button on:click={Markit} class="button is-small" style="border-radius:50%!important;" class:ampoule={states.lightOn === true}><span class="icon is-small"><i class="fas fa-lightbulb"></i></span></button>
			</div>
			<div class="latotale" class:totale-spacer={$theData.filtered.length > RANGE}>
			{#each entriesObject as entry,index}
				<Retourexp entriesObject={entry} {index} laTotale={states.laTotale} isInterne={states.currentForm == 'interne'} 
				on:requestForceCapture={(e)=>handleRequestForceCapture(e.detail.index)}/>
				<hr>
			{/each}
			</div>

		{:else if (states.currentForm == "detailsexpert" || states.currentForm == "experts") && !states.laTotale}
			<Detailsexpert entriesObject={entriesObject[formIndex]} forceScreenGrab={states.forceScreenGrab} 
			on:captureOK={handleCaptureOK} /> 

		{:else if (states.currentForm == "detailsexpert" || states.currentForm == "experts") && states.laTotale}
			<div class="bouton-highlight">
				<button on:click={Markit} class="button is-small" style="border-radius:50%!important;" class:ampoule={states.lightOn ===true} ><span class="icon is-small"><i class="fas fa-lightbulb"></i></span></button>
			</div>
			<div class="latotale" class:totale-spacer={$theData.filtered.length > RANGE}>
			{#each entriesObject as entry,index}
				<Detailsexpert entriesObject={entry} {index} laTotale={states.laTotale}
				on:requestForceCapture={(e)=>handleRequestForceCapture(e.detail.index)}/>
				<hr>
			{/each}
			</div>

		{:else if states.currentForm === "geco" && !states.laTotale}
			<Geco entriesObject={entriesObject[formIndex]} />

		{:else if states.currentForm === "geco" && states.laTotale}
			<div class="latotale" class:totale-spacer={$theData.filtered.length > RANGE}>
			{#each entriesObject as entry,index}
				<Geco entriesObject={entry} {index} laTotale={states.laTotale} 
				on:requestForceCapture={(e)=>handleRequestForceCapture(e.detail.index)}/>
				<hr>
			{/each}
			</div>

		{:else if states.currentForm ==  "savoirfaire" && !states.laTotale}
			<SavoirFaire entriesObject={entriesObject[formIndex]} />

		{:else if states.currentForm ==  "savoirfaire" && states.laTotale}
			<div class="latotale" class:totale-spacer={$theData.filtered.length > RANGE}>
			<div class="bouton-highlight">
				<button on:click={Markit} class="button is-small" style="border-radius:50%!important;" class:ampoule={states.lightOn} ><span class="icon is-small"><i class="fas fa-lightbulb"></i></span></button>
			</div>
			{#each entriesObject as entry,index}
				<SavoirFaire laTotale={states.laTotale} entriesObject={entry} {index}  
				on:requestForceCapture={(e)=>handleRequestForceCapture(e.detail.index)}/>
				<hr>
			{/each}
			</div>
		{/if}
	{/if}

<style lang="scss" global>

	@import "./style/global.sass";
	@import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;0,900;1,300;1,400;1,500&display=swap');
	
	:global(:root) {
		--font-stack:'Roboto', sans-serif;
		--maxwidth: 1720px;
		--bg-color: #ECF2F7;
		--main-color: #024579;
		--bleu-clair: #9fbdd5;
		--bleu-hyperclair : #ecf2f7;
		--bleu-nouveau: #358dbc;
	}

	:global(.hide) {
		opacity:0;
	}

	* {
		font-family: var(--font-stack);
	}

	label {
		font-size:16px;;
	}

	:global(hr) {
		background-color: var(--main-color);
		height:1px;
	}

	:global(h2) {
		font-size:1.8em;
		font-weight:500;
	}

	:global(h3) {
		font-size:1.5em;
		font-weight:500;
	}

	:global(h4) {
		font-size:1.2em;
	}

	:global(.container) {
		max-width:100vw;
		flex-direction: column;
		display: flex;
		justify-content: unset;
		overflow:visible;
		background-color: unset;		
		min-height:100vh;
		background:white;
	}

	:global(.columns) {
		justify-content: center;
	}
	:global(.field.has-addons) {
		justify-content: unset;
	}
	:global(.invisible) {
		display:none!important;
	}

	.bouton-highlight {
		position:fixed;
		top:2em;
		right:2em;
		z-index:300;
	}

	.help.is-danger {
		display: flex;
		justify-content: center;
		font-size:initial;
		position:absolute;
		top:6em;
		left:0.8em;
	}
	:global(body) {
		background-color:white;
		display:flex;
	}
	:global(.latotale) {
		display: block;
		flex: none;
		overflow: visible;
		width:100vw;
	}
	:global(.global-center) {
		position: absolute;
  		top: 50%; left: 50%;
  		transform: translate(-50%,-50%);
	}

	.fieldwrapper {
		flex-direction:column;
		display: flex;     
	}

	.fieldwrapper > label {
		color: black;
	}
	
	.is-checkradio[type="radio"]+label {
		margin: .5em 0em;
	}

	.help-max {
		position: absolute;
		top: -20px;
	}
	
	.ampoule {
		color: var(--main-color)!important;
    	background: floralwhite!important;
		border-color: var(--main-color)!important;
		box-shadow: 0 -0px 18px 2px #0bf!important;
	}

	:global(body) {
		background: white;
	}

	label {
		vertical-align: -webkit-baseline-middle;
	}

	input {
		background:transparent;
		border : 1px solid var(--main-color);
		border-radius: 0;
		outline:0;
	}

	input:focus, input:focus-within {
		outline : 1px solid lightyellow;
	}

	.switch {
		margin-bottom:1em;
	}

	:global(.media) {
		align-items: center;
	}

	:global(.mark-infospersos) {
		background: lightcyan;
		color:black;
	}

	:global(.mark-domaines) {
		background:lightgoldenrodyellow;
		color:black;
	}

	:global(.mark-secteur-activite) {
		background: lightseagreen;
		color:black;
	}

	:global(.mark-enjeu) {
		background: palegreen;
		color:black;
	}

	:global(.mark-resultat-obtenu) {
		background: lightpink;
		color:black;
	}

	:global(.mark-certifications) {
		background: yellow;
		color:black;
	}

	:global(.mark-vosdomaines) {
		background: lightgreen;
		color:black;
	}

	:global(.mark-specialites) {
		background: lightcyan;
		color:black;
	}

	:global(.mark-timeline) {
		background: yellow;
		color:black;
	}

	:global(.mark-formation) {
		background: lightseagreen;
		color:black;
	}

	.above-all {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		position: absolute;
		top: 1vh;
		left: 50vw;
		z-index: 3;
	}

	.totale-spacer {
		margin-top:10vh;
	}

	
	@media only screen and (min-width: 1024px) {
		.downspacer {
			 text-align:center; margin-bottom:3em;
		}
		.switch-interne {
			display:block;font-size:16px;position:relative;bottom:-1px;
		}
	}
	
	@media only screen and (max-width: 768px) {
		.switch-interne {
			display:block;font-size:14px;position:relative;bottom:-1px;
		}
		.switch {
			margin-top:-0.5em;
			margin-bottom:0em;
		}
		.downspacer {
			 text-align:center; margin-top:1em; margin-bottom:1em;
		}
		
	 }

	 @media only screen and (max-width: 1024px) {
		.global-center {
				min-width:90%!important;
			}
		body {
			overflow: scroll;
		}
		#boutonvalider {
			margin-bottom:1em;
		}
	 }


</style>
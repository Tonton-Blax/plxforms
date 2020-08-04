<svelte:head>
	<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500&display=swap" rel="stylesheet">
	<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css">
</svelte:head>
<script>
	import { onMount } from 'svelte';
	import Tabletop from 'tabletop';
	import SparkMD5 from 'spark-md5';
	import { Button, Field, Icon, Input, Notification } from 'svelma-pro';
	import SavoirFaire from './subcomp/SavoirFaire.svelte';
	import Retourexp from './subcomp/Retourexp.svelte';
	import Switch from './subcomp/Switch.svelte';
	import Detailsexpert from './subcomp/Detailsexpert.svelte';
	import {thebigdata} from './bigdata.js'
	import Loading from './subcomp/Loading.svelte';
	import axios from 'axios';
	
	let bigdata = thebigdata;
	let domReady = false;
	let loading = false;
	const SAVOIRFAIRE = 'https://docs.google.com/spreadsheets/d/1Xy0atfORaoi58JMTzXtnOpgCm23SQxl9rMFu2a0xOO0/pub?output=csv';
	const RETOURXP = `https://docs.google.com/spreadsheets/d/1P0VBaT35OntfnFyrZ5q1Ev_oqqdkueEXljhBAioW9qw/pub?output=csv`;
	const DETAILSEXPERTS = 'https://docs.google.com/spreadsheets/d/1-GDV2O10Ds7dY-tiuVKgPnF7Mdufx7FQilWNw-Xy3kc/pub?output=csv';
	const WPAPI = "https://www.polyexpert.fr/wp-json/contact-form-7/v1/contact-forms/3718/feedback"
	const PWD = "16bd84b45460199de52067766741e763"
	//const API = "AIzaSyBT_DkTu5GI5wsPGDvQ92yDmD0Euy16UaE";
	//const GMAILAPI = "AIzaSyD7s3n9-3ugE6X1Xsnv7BbrW1U4ymYWgY8";
	const PROXY = 'https://lower-poutine-21666.herokuapp.com/';
	let ready;
	let pwdOK = false;

	let entriesObject = [];

	let initForm = {
		email: '',
		password: ''
	};

	/* 
	let calmDown = {
		count : 0,
		_time,
		get time() {
			return this._time = _time instanceof Date && !isNaN(_time.valueOf()) ? this._time : this.init(true) ;
		},
		init : (ret) => { this.time = Date.now(); if (ret) return _time },
		check : () => { 
			if (_time instanceof Date && !isNaN(_time.valueOf()))
				return Math.floor((Date.now - _time) / 1000)  <= 5 ? true : false;
			else throw new Error ("la fonction time n'a pas été lancée")
			},
		get yes() {return this.count >= 5 ? true : false},
	} 
	*/

	let destinataire = '';

	let inputError = false;  
	let isRetourXp = true;
	let laTotale = false;
	let forceScreenGrab = false;
	let formIndex; let indexes = [];
	
	let currentPage = {slug: "", isUser : false, isAdmin : false }

	
	let currentForm = {
		true: {name: "Retour d'Expérience", url: RETOURXP, id: "Adresse e-mail"},
		"interne": {name: "Retour d'Expérience", url: RETOURXP, id: "Adresse e-mail"}, 
		false: {name: "Savoir-Faire", url: SAVOIRFAIRE, id: "Adresse e-mail"},
		"detailsexpert": {name: "Détails Expert", url:DETAILSEXPERTS, id: "Adresse e-mail"}
	}

	$: 	if (ready && window.history && window.history.pushState) {

			window.history.pushState('forward', null, './#forward');

			window.onpopstate = () => {
				ready=false; formIndex = undefined; isRetourXp = true; laTotale = false;
			}
		}

	onMount(async () => {	
		//localStorage.clear();
		currentPage.slug = window.location.hash.split('#');
		if ((currentPage.slug && currentPage.slug[1] == 'forward') || currentPage.slug.length <= 1) {
				currentPage.isAdmin = false;
				currentPage.isUser = false;
		}
		else if (currentPage.slug[1] && currentPage.slug[1].length > 23) {
			currentPage.slug = currentPage.slug[1];
			currentPage.isAdmin = false;
			currentPage.isUser = true;
		}
		else if (currentPage.slug && currentPage.slug[1] == 'admin') {
			currentPage.slug = 'admin';
			currentPage.isAdmin = true;
			currentPage.isUser = false;
		} 
		
		domReady = true;
	});

	function mailExists (mail) {
		Tabletop.init( {
				key: currentForm[isRetourXp].url,
				simpleSheet: true 
			}).then(function(data, tabletop) { 
				if (data[i][currentForm[isRetourXp].id].toLowerCase() == mail.toLowerCase()) {
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
			//console.log(e);
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
			inputError = true;
		else inputError = false;
	}
	
	function handlePassword () {
		if (SparkMD5.hash(initForm.password) == PWD) {
			localStorage.setItem('pwd',initForm);
			return true;
		}
		else return false;
	}

	function handleKeydown (e, trigger) {
		inputError = false;
		if (e.keyCode === 13) {
			if (!currentPage.isUser && !currentPage.isAdmin)
				sendMail('https://www.polyexpert.fr/formulaires/#' + SparkMD5.hash(destinataire.toLowerCase()), destinataire.toLowerCase());
			else handleSubmitEmail();
		}
	}

	function handleSubmitEmail () {
		
		if (!domReady) return;
		
		if (currentPage.isAdmin && !handlePassword()) { 
			showNotification( "Mot de passe erroné", { type: 'is-danger', position: 'is-bottom-right', icon: true });
			return;
		}
		
		else if (currentPage.isUser && SparkMD5.hash(initForm.email) != currentPage.slug) {
			showNotification( "L'adresse e-mail saisie ne correspond pas à votre lien personnalisé", { type: 'is-danger', position: 'is-bottom-right', icon: true, duration: 6000 });
			return
		}

		else {
			loading = true;
			entriesObject = []; indexes = [];
			/*
			if (isRetourXp == "detailsexpert") {
				for (let i = 0; i < bigdata.length ; i ++)
					if (bigdata[i][currentForm[isRetourXp].id].toLowerCase() == initForm.email.toLowerCase())
						indexes.push(i);

				if (!indexes.length) {				
						showNotification( "Adresse e-mail introuvable pour ce " + currentForm[isRetourXp].name, { type: 'is-danger', position: 'is-bottom-right', icon: true, duration: 60000 });
						laoding = false;
						return;
				}

				else {
						indexes.forEach(i => entriesObject.push(bigdata[i]));
						formIndex = entriesObject.length - 1;
						ready = true;
						loading = false;
					}
			}
			else { */
				Tabletop.init( {
					key: currentForm[isRetourXp].url,
					simpleSheet: true 
				}).then(function(data, tabletop) {
					for (let i = 0; i < data.length ; i ++) {
			
						if (data[i][currentForm[isRetourXp].id].toLowerCase() == initForm.email.toLowerCase()) {
							indexes.push(i);
						}
					}

					if (!indexes.length) {
						loading = false;
						showNotification( "Adresse e-mail introuvable pour ce " + currentForm[isRetourXp].name, { type: 'is-danger', position: 'is-bottom-right', icon: true, duration: 60000 });
						return;
					}
					else {
						indexes.forEach(i => entriesObject.push(data[i]));
						formIndex = entriesObject.length - 1;
						ready = true;
						loading = false;
					}
				})
			
		}
	}

	let handleRequestForceCapture = (index) => {
		formIndex = index;
		//console.log(entriesObject[formIndex]);
		laTotale = false;
		forceScreenGrab = true;
	}

	let handleCaptureOK = () => {		
		forceScreenGrab = false;
		laTotale = true;
	}

</script>


	{#if !ready}
		
		<!-- LOGO -->
		<div class="columns">
			<div class="column is-one-third global-center">
				<div class="is-flex" style="text-align:center; margin-bottom:3em;">
					<img src="./img/polyexpert.png" width="300px" alt="logo">
				</div>
			
				{#if !loading}

					{#if !currentPage.isUser && !currentPage.isAdmin}
					<!-- SASIE E-MAIL POUR RESET SI OUBLI -->
						<div class="is-flex">
						<p style="margin-bottom:1em;">Vous devez vous connecter à l'aide d'un lien personnalisé.<br>Si vous pensez l'avoir égaré, renseignez votre adresse e-mail ci-dessous</p>
						{#if inputError}<div class="help is-danger help-max">Syntaxe du mail invalide</div>{/if}
							<Field expanded size="is-large">
								<input type="email" style="width:100%;" placeholder = "Saisissez votre-email pour recevoir votre lien unique"
								on:keydown={(e)=>handleKeydown(e,'email')} bind:value={destinataire} on:blur|preventDefault={()=>handleFormEmail()} />
							</Field>
						</div>

					{:else if currentPage.isUser}
					<!-- SASIE E-MAIL ADMINISTRATEUR -->
						<div class="is-flex" style="margin-bottom:10px;">
						{#if inputError}<div class="help is-danger help-max">Syntaxe du mail invalide</div>{/if}
							<Field expanded size="is-large">
								<input type="email" style="width:100%;" placeholder = "Saisissez votre e-mail pour vérification" 
								on:keydown={(e)=>handleKeydown(e,'email')} bind:value={initForm.email} on:blur|preventDefault={()=>handleFormEmail()} />
							</Field>
						</div>

					{:else if currentPage.isAdmin}
					<!-- SAISIE MOT DE PASSE SI ADMIN-->
						<div class="is-flex" style="margin-bottom:10px;">
						{#if inputError}<div class="help is-danger help-max">Syntaxe du mail invalide</div>{/if}
							<Field expanded size="is-large">
								<input type="email" style="width:100%;" placeholder = "e-mail du répondant"
								on:keydown={(e)=>handleKeydown(e,'email')} bind:value={initForm.email} on:blur|preventDefault={()=>handleFormEmail()} />
							</Field>
						</div>

						<div class="is-flex" style="margin-bottom:3em;">
							<Field expanded size="is-large">
								<input on:keydown={(e)=>handleKeydown(e,'pwd')} type="password" style="width:100%;" 
								bind:value={initForm.password} passwordReveal={true} placeholder = "mot de passe administrateur" />
							</Field>
						</div>
					{/if}

					<!-- CHOIX DU FORM -->
					{#if currentPage.isAdmin || currentPage.isUser}
					<Field expanded size="is-large">
							<div class="fieldwrapper">
								<input class="is-checkradio" type="radio" name="retourxp" id="retourxp" bind:group={isRetourXp} value={true}>
								<label for="retourxp">Retex (usage externe)</label>	
								<input class="is-checkradio" type="radio" name="retourxpinterne" id="retourxpinterne" bind:group={isRetourXp} value={"interne"}>
								<label for="retourxpinterne">Retex (affichage nom et e-mail)</label>			
								<input class="is-checkradio" type="radio" name="savoirfaire" id="savoirfaire" bind:group={isRetourXp} value={false}>
								<label for="savoirfaire">Savoir-faire</label>
								
								<input class="is-checkradio" type="radio" name="detailsexpert" id="detailsexpert" bind:group={isRetourXp} value={"detailsexpert"}>
								<label for="detailsexpert">Détails de l'expert</label>
							</div>
						</Field>
					
					<!-- SWITCH LA TOTALE + OUBLI -->
					<div class:hide={isRetourXp == false || isRetourXp == "detailsexpert"}>
						<Switch bind:checked={laTotale} type="is-success"><span style="display:block;font-size:16px;position:relative;bottom:-1px;">
							{laTotale ? "Voir Tout" : "Afficher uniquement le dernier retour en date"}</span>
						</Switch>
					</div>
					{/if}

										<!-- BOUTON VALIDER -->
					<div class="is-flex" style="margin-bottom:3em;margin-top:3em;">
						<p class="control" style="text-align:center;">
							<Button class="is-primary" style="padding-left:2em;padding-right:2em;" type="submit" 
							on:click={!currentPage.isUser && !currentPage.isAdmin ? sendMail('https://www.polyexpert.fr/#' + SparkMD5.hash(destinataire.toLowerCase()), destinataire.toLowerCase()) : handleSubmitEmail}>Valider</Button>
						</p>
					</div>


				
				<!-- SPINNER LOADING -->
				{:else}
				<Loading color={"024579"} text={"Chargement"} parentStyle={"position:relative;top:6vh;"}/>
				{/if}
			</div>
		</div>

	{:else}	
		{#if isRetourXp==true && !laTotale}
			<Retourexp entriesObject={entriesObject[formIndex]} isInterne={typeof isRetourXp !== "boolean"} {forceScreenGrab} 
			on:captureOK={handleCaptureOK} />


		{:else if isRetourXp==true && laTotale}
			<div class="latotale">
			{#each entriesObject as entry,index}
					<Retourexp entriesObject={entry} {index} {laTotale} isInterne={typeof isRetourXp !== "boolean"} 
					on:requestForceCapture={(e)=>handleRequestForceCapture(e.detail.index)}/>
					<hr>
			{/each}
			</div>

		{:else if isRetourXp == "detailsexpert"}
			<Detailsexpert entriesObject={entriesObject[formIndex]} {forceScreenGrab} 
			on:captureOK={handleCaptureOK} /> 

		{:else if !isRetourXp}
			<SavoirFaire entriesObject={entriesObject[formIndex]} />
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
		max-height:100vh;
		overflow:visible;
		background-color: unset;		
		height:100vh;
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

	body {
		background: linear-gradient(133deg, white,var(--bleu-hyperclair), #eef);
    	background-size: 600% 600%;
	    -webkit-animation: fond-degrade 10s ease infinite;
	    -moz-animation: fond-degrade 10s ease infinite;
	    animation: fond-degrade 10s ease infinite;
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

	:global(.media) {
		align-items: center;
	}

	@-webkit-keyframes fond-degrade {
		0%{background-position:0% 7%}
		50%{background-position:100% 94%}
		100%{background-position:0% 7%}
	}
	@-moz-keyframes fond-degrade {
		0%{background-position:0% 7%}
		50%{background-position:100% 94%}
		100%{background-position:0% 7%}
	}
	@keyframes fond-degrade {
		0%{background-position:0% 7%}
		50%{background-position:100% 94%}
		100%{background-position:0% 7%}
	}

	@media only screen and (max-width: 768px) {
		 .global-center {
			 min-width:90%!important;
		 }
	 }


/*
	@media only screen and (max-width: 768px) {

	}
*/


</style>
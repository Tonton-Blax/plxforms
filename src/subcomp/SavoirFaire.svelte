<script>
import { onMount, createEventDispatcher  } from 'svelte';
import Loading from './Loading.svelte'
import Dots from './Dots.svelte'
export let entriesObject;
export let index = 0;
export let forceScreenGrab = false;
import domtoimage from 'dom-to-image-more';

let laTotale;
let ready = false;
let buttonGrab;
let photoVisible;

const dispatch = createEventDispatcher();

$: if (forceScreenGrab) screenGrab();

let photos = []; let loadedPhotos = [];
let bignode;

let QCM = {
    dossiers : [],
    dossiersAnnees : [],
	secteurs : [],
	specialites : [],
    mandants : [],
    xpOld : [],
    certifs : {odd : [], even : []},
    levelsSecteurs : {"Peu intervenu" : 1, "Intervention fréquente" : 2, "Expert du secteur" : 3 },
    levelsSpecialites : {"Notion" : 1, "Spécialiste" : 2, "Maîtrise" : 3 },
    levelsMandants : {"Faible" : 1, "Moyen" : 2, "Forte volumétrie" : 3 }
}

let currentTable2 = 1;

let PROXY = 'https://doublepromax.herokuapp.com/';

function capitalizer(str, separators) {
  separators = separators || [ ' ' ];
  var regex = new RegExp('(^|[' + separators.join('') + '])(\\w)', 'g');
  return str.toLowerCase().replace(regex, function(x) { return x.toUpperCase(); });
}

function requestFullScreen(element) {

    let requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

    if (requestMethod) { // Native full screen.
        requestMethod.call(element);
    } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
}

function screenGrab () {
    if (laTotale) {
        dispatch('requestForceCapture', {index: index});
        return;
    }
    if (!ready) return;
    buttonGrab.style.display = "none";
    requestFullScreen(document.body);

    const scale = 2;
    let node = document.body;
    
    let obj = 
    {
        width: window.innerWidth * scale,
        height: Math.floor(window.innerWidth / 1.777777) * scale,
        style: {transform: `scale(${scale}) translate(${window.innerWidth / 2 / scale}px, ${(Math.floor(window.innerWidth / 1.777777)) / 2 / scale}px)`},
        bgcolor : "#fff"
    }

    domtoimage.toPng(node, obj)
    .then((dataUrl) => {
        let link = document.createElement('a');
        link.download = `cv-${entriesObject[searchObj(entriesObject,/prénom/)[0]].toLowerCase()}-${entriesObject[searchObj(entriesObject,/otre\snom/)[0]].toLowerCase()}.png`;
        link.href = dataUrl;
        link.click();
        document.exitFullscreen();
        if (laTotale) dispatch('captureOK', {text: 'OK'});
        buttonGrab.style.display = "block";

    })
    .catch((error) => {
        console.error('oops, something went wrong!', error);
    });
}

function blobToDataURL(blob) {
    return new Promise((fulfill, reject) => {
        let reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => fulfill(reader.result);
        reader.readAsDataURL(blob);
    })
}

function saveAs(uri, filename) {

    let link = document.createElement('a');

    if (typeof link.download === 'string') {

        link.href = uri;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.bsequiody.removeChild(link);

    } else {
        window.open(uri);
    }
}

onMount(async () => {	
    QCM.secteurs = searchObj(entriesObject, /vos\sdomaines/);
    searchObj(entriesObject, /marquant/).forEach(t => t.includes('Année') ? QCM.dossiersAnnees.push(t) : QCM.dossiers.push(t));
	QCM.specialites = searchObj(entriesObject, /pécialités\s\[/);
    QCM.mandants = searchObj(entriesObject, /mandants/);
    QCM.xpOld = searchObj(entriesObject, /Fonction -/);
    entriesObject[searchObj(entriesObject,/certifications/)[0]].split(",").forEach((e,i) => {i%2 == 0 ? QCM.certifs.even.push(e) : QCM.certifs.odd.push(e)});
    ready = true;
});

let searchObj = (obj, term) => {
  let key, keys = []
  for (key in obj)
    if (obj.hasOwnProperty(key) && term.test(key))
      keys.push(key)
  return keys.length ? keys : [""];
}


</script>

<div id="uniquecontainer-{index}" class="container addon-container" bind:this={bignode}>
    
    <div class="columns">

        <!-- COLONNE GAUCHE AVEC TABLE -->

        <div id="colgauche" class="column is-3">
           
            <div class="image portrait">
                 {#if !photoVisible && index == 0 && entriesObject["Insérer votre photo"].length >= 10}
                    <Loading extraStyle={"left:1.5em;top:1.5em;width:100px;height:100px;filter:invert(1);"} text={''}/>
                {/if}

                <img on:load={()=>photoVisible = true} class="is-rounded" crossorigin="anonymous" src={PROXY + entriesObject["Insérer votre photo"].replace("/open","/uc").replace(/\s/g,'')} alt="Portrait du renseignant">
                <div class="figure-p">
                    <p><strong>{capitalizer(entriesObject[searchObj(entriesObject,/prénom/)[0]],['-'])}{capitalizer(entriesObject[searchObj(entriesObject,/otre\snom/)[0]],['-'])}</strong></p>
                    <p style="font-size:16px; font-weight:300;padding-top: 7px;">✉ : <a href=mailto:{entriesObject["Adresse e-mail"]}>{entriesObject["Adresse e-mail"]}</a></p>                    
                    <p style="font-size:16px; font-weight:300;padding-top: 7px;">☎ : {entriesObject["Téléphone"]}</p>
                    <p style="font-size:16px; font-weight:300;padding-top: 7px;">Chez&nbsp;{entriesObject["Entité"]}&nbsp; depuis &nbsp;{entriesObject[searchObj(entriesObject,/au\ssein/)[0]]}</p>
                </div>

            </div>
            
            <table id="tabletrans" class="table is-narrow">
            <tr><td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Compétences transverses</h3></td></tr>
            
            {#each QCM.specialites as specialite}
                {#if entriesObject[specialite].length && entriesObject[specialite]!="Néant"}
                 <tr>
                    <td width="80%">
                        {specialite.match(/\[(.*?)\]/)[1]}
                    </td> 
                    <td width="20%" style="text-align: right;">
                            <Dots score={QCM.levelsSpecialites[entriesObject[specialite]]} />
                    </td>
                </tr>
                {/if}
            {/each}
            </table>
            <table id="tablesecteur" class="table is-narrow">
            <tr>
                <td colspan="2" style="border:none;padding-top: 3.5vh!important;">
                    <h3><img src="./img/cv_secteurs.svg" alt="client">Compétences sectorielles</h3>
                </td>
            </tr>

            {#each QCM.secteurs as secteur}
                {#if entriesObject[secteur].length && entriesObject[secteur] != "Jamais intervenu"}
                 <tr>
                    <td width="80%">
                        { secteur.match(/\[(.*?)\]/)[1] == "Energie, Environnement, Pollution et Ressources naturelles" ? "Energie et environnement" : secteur.match(/\[(.*?)\]/)[1]}
                    </td> 
                    <td width="20%" style="text-align: right;">
                        <Dots score={QCM.levelsSecteurs[entriesObject[secteur]]} />
                    </td>
                </tr>
                {/if}
            {/each}

            </table>
             <table id="tablecertif" class="table is-narrow" style="margin-top:1.5em;">
            <tr>
                <td colspan="2" style="border:none;padding-top: 0.3vh!important;">
                    <h3><img src="./img/cv_certifications.svg" alt="client">Certifications</h3>
                </td>
            </tr>

            
            {#if QCM.certifs.even.length == 1 && QCM.certifs.odd.length == 1}
                <tr>
                    <td width="100%">●&nbsp;{QCM.certifs.even[0]}</td>
                </tr>
                <tr>
                    <td width="100%">●&nbsp;{QCM.certifs.odd[0]}</td>
                </tr>
            
            {:else}

                {#each QCM.certifs.even as certif, index}                                                
                    <tr>
                        <td width="50%">●&nbsp;{certif}</td>
                        {#if QCM.certifs.odd[index] != undefined }
                            <td width="50%">●&nbsp;{QCM.certifs.odd[index]}</td>
                        {/if}
                    </tr>
                {/each}

            {/if}

            </table>
        </div>
        
        <!-- BIG BLOC 2 COLONNES A DROITE -->

        <div id="coldroite" class="column" style="align-self:center;">
            <div class="entete">
                <div id="logo-entete"><img src={'./img/' + entriesObject["Entité"].toLowerCase().replace(/\s/,'-') + ".png"} alt="Logo de l'entité"></div>                                            
                <div id="superh1">{entriesObject["Intitulé de poste"]}</div>
            </div>
            <div class="bigbox">
                <div class="columns is-multiline">
                    
                     <!-- BLOCS XP + FORMATION -->

                    <div class="column is-one-third">
                    <h3 class="h3droite"><img src="./img/cv_formation.svg" alt="Formation">Formation</h3>
                        <div class="box-interne">
                            <p>
                            {entriesObject["Diplôme"]}<br>
                            {entriesObject["Spécialités"]}<br>
                            {entriesObject["Année d'obtention"]}
                            </p>
                        </div>
                    </div>

                    <div class="column is-two-thirds">
                    <h3 class="h3droite"><img src="./img/cv_xp.svg" alt="client">Expérience professionnelle</h3>
                        <div class="box-interne">
                        
                            <ul>
                            {#each QCM.xpOld as xp}
                                {#if entriesObject[xp].length}
                                <li>{entriesObject[xp]}</li>
                                {/if}
                            {/each}
                            </ul>
                        </div>
                    </div>

                  <!-- BLOC PROJETS INTERNES -->

                    <div class="column is-full">
                    <h3 class="h3droite"><img src="./img/cv_projet.svg" alt="client">Projets Internes</h3>
                        <div class="box-interne premax">
                            {@html entriesObject[searchObj(entriesObject,/projets\sinterne/)[0]].replace(/\n/g,"<br>")}
                        </div>
                    </div>

                    <!-- BLOC FORMATION DOSSIERS MARQUANTS -->
                    <div class="column is-full">
                        <h3 class="h3rien"><img src="./img/cv_projet.svg" alt="client">Dossiers marquants</h3>
                    </div>
                    <div class="column is-full pingouin gauche">
                        
                        <div class="timeline">
                            {#each QCM.dossiers as dossier, index}
                                {#if entriesObject[QCM.dossiersAnnees[index]].length}
                                <div class="timeline-item">
                                    <div class="timeline-marker is-primary"><span class="annees tagmax">{entriesObject[QCM.dossiersAnnees[index]]}</span></div>
                                    <div class="timeline-content">
                                        <p>{entriesObject[dossier]}</p>
                                    </div>
                                </div>
                                {/if}
                            {/each}
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>        
		
        <div class="butcontainer" bind:this={buttonGrab}>
			<button id="download" class="button is-success" data-html2canvas-ignore="true" on:click={screenGrab}>
                <span class="icon">
                    <img width="24px" height="24px" src='./img/camera.svg' alt="Capture d'écran">
                </span>
            </button>
		</div>

	</div>


<style>
    
	ul {
  		list-style: none;
	}

    h3 img {
        margin-right:10px;
        position:relative;
        top:3px;
    }

    li::before {
		content: "● ";
		color: var(--main-color);
        padding-right: 0.5em;
	}

    li strong {
        color:var(--main-color);
    }

    .figure-p strong {
        color:white;
    }

    .entete {
        display:flex;
        flex-direction:column;
        padding-left: 1.5em;
    }
    #logo-entete img {
        width:auto ;
        max-height:2.4vmax;
    }
    
    #logo-entete {
        position: absolute;
        top: 1.3em;
        right: 3vw;
    }

    #superh1 {
        font-size: 2.85em;
        font-weight: 300;
        line-height: 58px;
        color: var(--main-color);
        margin-bottom: 1.5vh;
    }

    .portrait {
        display:flex;
        white-space: pre-line;
        width:auto;
        height:15vh;
        color: var(--main-color);
        margin: 0.8vh 0.8vw 2.9vh 0vw;
        font-size:1.5em;
        margin: 0 auto;
        justify-content: center;
        margin-top:2vh;
        margin-bottom:1.5vh;
    }

    .portrait img {
        height:15vh;
        width:15vh;
        border-radius: 0px;
    }

    .portrait a {
        color: white;
        text-decoration: underline;
        font-weight:300;
        font-size:large;
    }

    .portrait p {
        color: white;
    }


    #colgauche {
        background-color: var(--main-color);
        color:white;
        height:fit-content;
        min-height:100vh;
    }

    #colgauche h3 {
        margin-bottom:0.2em;
    }

    #coldroite {
        padding-top:4vh;
    }

    #coldroite h3 {
            font-size:16px;
    }

    .figure-p {
        padding-left: 1em;
        align-items: baseline;
        justify-content: center;
    }

    .figure-p p {
        line-height:initial;
    }

    #nom-prenom {
        font-size: 1vw;
        color: white;
    }

    .addon-container {
        padding-right: 2em;
        padding-bottom: 2em;
    }

    table tr td {
        font-size: 1em;
        color: white;
        border-color:rgba(255,255,255,0.5)!important;
        vertical-align: middle;
    }

    td + td { 
        vertical-align: middle;
    }

    .butcontainer {
		position: absolute;
        top: 7.5vh;
        right: 3vw;
	}

    #download {
        padding: 1em;
        background-color: var(--bg-color);
        border-radius:8px;
        opacity:1;
    }
    #download:hover {
        background-color: var(--bleu-clair);
        color: var(--main-color);
        box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
        opacity:1;
    }

    .bigbox {
        width: 100%;
        min-height: 70vh;
        padding:1.5em;
    }

    .box-interne {
        display: flex;
        flex-direction: column;
        border-radius:8px;
        background-color: none;
        color: var(--main-color);
        padding:1.5em 0em;
        /* height: 100%; */
    }
    
    .timeline .timeline-item {
        padding-bottom: 0.5em;
    }

    .tagmax {
        color: var(--main-color);
        font-weight:800;
    }

    .table {
        /*width: -webkit-fill-available;*/
        width: 92%;
        background-color: transparent;
        color:white;
        margin: 0 auto;
    }

    .table img {
        filter: invert(100%) hue-rotate(250deg) brightness(200%) contrast(100%);
    }

    .container {
        flex-direction: unset;
        height:unset!important;
        max-height:unset!important;
    }

    .annees {
        position: relative;
        left: -3.7em;
        top: -0.35em;
    }

    .pingouin {
        padding: 1.5em;
        background-color: none; /*var(--bleu-hyperclair);*/
        color: var(--main-color);
    }

    .gauche {
        margin-left: 1.5em;
        margin-right: -0.75em;
        border-radius: 8px 0em 0em 8px;

    }

    .h3droite {
        color: var(--main-color);
        height:30px;
    }
    .h3rien {        
        color: var(--main-color);
        /*margin-top: 1.5em;*/
        margin-bottom: -1em;
        margin-top: -0.75em;
    }

    .column.is-3 {
        width:28%;
    }
    .columns {
        justify-content: initial;
        margin-top:unset!important;
    }

    .premax {
        color:var(--main-color);
        font-family:inherit;
        padding:0;
        font-size:16px;
        padding: 1.5em 0;
    }

    #tablecertif {
       /*
        position: relative;
        bottom: -4%;
*/
        width: 100%;
        margin-left: 0.3em;
    }
    
    #tablesecteur {
  /*
        position: relative;
        top: 2%;
    */
        width: 100%;
        margin-left: 0.3em;
    }
    #tabletrans {
    /*
        position: relative;
        top: 2%;
     */
        width: 100%;
        margin-left: 0.3em;
    }

    @media only screen and (max-width: 768px) {
        .portrait {
            width:auto!important;
            margin-top:1em;
        }
        .addon-container {
            padding:1vmax;
        }
        .bigbox {
            padding:0.8em;
            border-radius:0;
        }
        #superh1 {
            text-align:center;
            font-size:1.8em;
        }
        .butcontainer {
            display:none;
        }
        #logo-entete img {
            max-height: 1.8em;
        }
        .is-3 {
            width:100%!important;
        }
    
        #tablecertif, #tablesecteur, #tabletrans {
            left:unset;
            bottom:unset;
            top:unset;
            width:100%;
            position:unset;
        }
        .portrait * {
            font-size:12px!important;
        }
        #logo-entete {
            display:none;
        }
    }

    @media only screen and (min-width: 768px) {
    
        #logo-entete {
            display:none!important;
        }

    }

    @media only screen and (min-width: 823px) and (max-width: 1280px) {
    
        .butcontainer {
            top: 1.5vh;
            right: 2vw;
        }
        .portrait * {
            font-size:12px!important;
            width:initial;
        }
        .portrait img {
            display:none;
        }
        .table .h3 {
            font-size:1em;
        }
        .table td {
            font-size:0.65em;
        }
        .portrait img {
            width:10vh;
            height:10vh;
        }

        #coldroite div *:not(#superh1) {
            font-size:12px
        }
        #superh1 {
            font-size:24px;
        }
    }

     @media only screen and (min-width: 1280px) and (max-width: 1460px) {
    
        table tr td {
            font-size:0.85em;
        }

    }

    
</style>
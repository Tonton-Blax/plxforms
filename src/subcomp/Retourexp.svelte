<script>
import { onMount, createEventDispatcher  } from 'svelte';
import Loading from './Loading.svelte'
import domtoimage from 'dom-to-image-more';

export let entriesObject;
export let index = 0;
export let forceScreenGrab = false;
export let laTotale;
export let isInterne;

let buttonGrab; 
let ready = false;
let photoVisible;

const dispatch = createEventDispatcher();

$: if (forceScreenGrab) screenGrab();

let photos = []; let loadedPhotos = [];
let bignode;
let entite = "Polyexpert"

let detailSecteur = [];
let PROXY = 'https://doublepromax.herokuapp.com/';
//https://doublepromax.herokuapp.com/


onMount(async () => {	
    //console.log(entriesObject); 
    detailSecteur = searchObj(entriesObject, /du\ssecteur/);
    let photokey=searchObj(entriesObject, /photo/)
    photos = (entriesObject[photokey]).split(',');
    ready = true;
});


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
		requestFullScreen(document.querySelector(`#uniquecontainer-${index}`));
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
            link.download = `retex-${entriesObject["Adresse e-mail"]}-${entriesObject[searchObj(entriesObject,/du\sclient/)[0]]}.png`;
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


let searchObj = (obj, term) => {
  let key, keys = []
  for (key in obj)
    if (obj.hasOwnProperty(key) && term.test(key))
      keys.push(key)
  return keys.length ? keys : [""];
}

</script>

<div id="uniquecontainer-{index}" class="container addon-container" bind:this={bignode}>
    
    <div class="grid-container">
        <div class="entete">
        <div id="superh1">{entriesObject[searchObj(entriesObject,/du\sclient/)[0]]} : {entriesObject[searchObj(entriesObject,/type\sde\sretour/)[0]]}</div>
            {#if isInterne}
                <div id="nom-prenom">
                    {capitalizer(entriesObject[searchObj(entriesObject,/prénom/)[0]],['-'])} 
                    {capitalizer(entriesObject[searchObj(entriesObject,/famille/)[0]],['-']).toUpperCase()} 
                    {entriesObject[searchObj(entriesObject,/éférence /)[0]]}
                </div>
            {/if}
        </div>

        

        <div class="resultat-obtenu">
            <h2><img src="./img/resultat-obtenu.svg" alt="client">Résultat obtenu</h2>
            <div>{entriesObject["Le résultat obtenu"]}</div>
        </div>
        <div class="enjeu-dossier">
            <h2><img src="./img/enjeu-dossier.svg" alt="client">Enjeu dossier</h2>
            <div>{entriesObject[searchObj(entriesObject,/enjeu/)[0]]}</div>
        </div>
        <div class="secteur-activite">
            <h2><img src="./img/secteur-activite.svg" alt="loupe">Secteur d'activité</h2>
            <div>
            {#each detailSecteur as key}
                <p>{entriesObject[key]}</p>
            {/each}
            </div>
        </div>
        <div class="client">
            <h2><img src="./img/client.svg" alt="client">Client</h2>
            <div>{entriesObject[searchObj(entriesObject,/du\sclient/)[0]]}</div>
        </div>
        <div class="contexte">
            <h2><img src="./img/loupe.svg" alt="loupe">Contexte</h2>
            <div>{entriesObject[searchObj(entriesObject,/contexte/)[0]]}</div>
        </div>
        <div class="demarche">
            <h2><img src="./img/demarche.svg" alt="client">Démarche / Méthode</h2>
            <div>{entriesObject[searchObj(entriesObject,/démarche/)[0]]}</div>
        </div>
        <div class="photo">
            <!-- <h2 class="hide">&nbsp;</h2> -->
            {#if photos[0]}
            {#each photos as photo, index}
                <figure class="photo-dossier">
                    {#if !photoVisible && index == 0}
                    <Loading extraStyle={"right:11em;"} text={''}/>
                    {/if}
                    <img on:load={()=>photoVisible = true} crossorigin="anonymous" src={PROXY + photo.replace("/open","/uc").replace(/\s/g,'')} alt="Représentation du dossier">
                </figure>
            {/each}
            {/if}
        </div>
    </div>
    <div class="butcontainer" bind:this={buttonGrab}>
        <button id="download" class="button is-success" data-html2canvas-ignore="true" on:click={screenGrab}>
            <span class="icon">
                <img width="24px" height="24px" src='./img/camera.svg' alt="Capture d'écran">
            </span>
        </button>
        <div id="logo-entete"><img src={'./img/' + entite.toLowerCase() + ".png"} alt="Logo de l'entité"></div>
    </div>	
</div>

<style>

    #logo-entete img {
        width:auto ;
        max-height:2.4vmax;
    }
    
    #logo-entete {
        margin-top:1.3em;
        align-self: flex-end;
        position:absolute;
        bottom:3vh;
        left:4vw;
    }

    #superh1 {
        font-size: 2.85em;
        font-weight: 300;
        line-height: 58px;
        color: var(--main-color);
        margin-bottom:2vh;
        margin-top:3.5vh;
    }
    #nom-prenom {
        font-size: 1vw;
        color: var(--main-color);
        right: 5vw;
        top: 5.5vh;
        position:absolute!important;
    }

    .addon-container {
        padding: 0 3vw 3vh 3vw;
    }

    .grid-container {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1.3fr;
        grid-template-rows: 0.5fr 1fr 1.5fr 1.5fr;
        gap: 1.5vh 1.5vw;
        /*grid-template-areas: "entete entete entete entete" "client secteur-activite enjeu-dossier photo" "contexte contexte resultat-obtenu photo" "demarche demarche resultat-obtenu photo";*/
        grid-template-areas: "entete entete entete entete" "client secteur-activite enjeu-dossier photo" "contexte demarche demarche photo" "contexte resultat-obtenu resultat-obtenu photo";
        max-height:95vh;
        height: calc(95vh - 10px);
    }

    .grid-container div:not(.entete) > div {
        padding: 5px 20px 5px 5px;
        flex: 1;
        background-color: white; /*var(--bg-color);*/
        color: black;
        font-size: 0.8vw;
    }
    .grid-container div:not(.entete):not(.enjeu-dossier):not(.demarche):not(.resultat-obtenu) > div {
        border-right: 2px solid var(--main-color);
    }

    .grid-container div > h2 {
        color: var(--main-color);
        padding:5px;
    }

    .grid-container h2 > img {
        margin-right:10px;
        position:relative;
        top:3px;
        width:32px;
    }

    .resultat-obtenu { grid-area: resultat-obtenu; display: flex; flex-direction:column; }

    .enjeu-dossier { grid-area: enjeu-dossier; display: flex; flex-direction:column; }

    .secteur-activite { grid-area: secteur-activite; display: flex; flex-direction:column; }

    .client { grid-area: client; display: flex; flex-direction:column; }

    .contexte { grid-area: contexte; display: flex; flex-direction:column; }

    .demarche { grid-area: demarche; display: flex; flex-direction:column; }

    .photo { grid-area: photo; display: flex; flex-direction:column; }

    .entete { grid-area: entete; display: flex; flex-direction:column;}

    .photo > figure > img {
        /*max-width: 522px; */
        height: auto;
        max-height:400px;
        border-radius:8px;
        width: max-content;
        object-fit: initial;
        width:100%;
    }

    .photo > figure:first-of-type {
        margin-bottom:20px;
    }

    figure {
        display:flex;
        justify-content: center!important;
    }
    
    .butcontainer {
		position: absolute;
        bottom: 2.4vh;
        right: 2vw;
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

    @media only screen and (max-width: 768px) {
 
        .addon-container {
            padding:1vmax;
        }

        #superh1 {
            text-align:center;
            font-size:1.8em;
        }
        #nom-prenom {
            font-size: 1em;
            text-align: center;
        }
        .grid-container {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: 1fr;
            gap: 1vmax;
            grid-template-areas: "entete" "photo" "client" "secteur-activite" "enjeu-dossier" "contexte" "demarche" "resultat-obtenu";
        }
        .grid-container div:not(.entete) > div {
            font-size:0.9em;
        }
        #logo-entete {
            align-self: center;
            margin-top:0px;
        }
        #logo-entete img {
            width:auto ;
            max-height:1.8em;
            margin-bottom:2em
        }
        .butcontainer {
            display:none;
        }
        .hide {
            display:none;
        }
        h2 {
            font-size:1em;
        }
        .photo {
            width: 96vw;
        }
    }
     @media only screen and (min-width: 768px) and (max-width: 1280px) {
         h2 {
             font-size:1em;
         }
     }
    
</style> 
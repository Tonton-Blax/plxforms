<script>
import { onMount, createEventDispatcher  } from 'svelte';
import Loading from './Loading.svelte'
import Dots from './Dots.svelte'
export let entriesObject;
export let index = 0;
export let forceScreenGrab = false;
import domtoimage from 'dom-to-image-more';

export let laTotale;

let ready = false;
let buttonGrab;
let photoVisible;

const dispatch = createEventDispatcher();

$: if (forceScreenGrab) screenGrab();

let photos = []; let loadedPhotos = [];
let bignode;

//let PROXY = 'https://doublepromax.herokuapp.com/';

let infospersos = {}

onMount(async () => {
    infospersos = {
        "Ligne directe" : entriesObject["Téléphone fixe"] || "",
        "Mobile" : entriesObject["Téléphone portable"] || "",
        "Année de naissance" : entriesObject["Année de naissance"] || "",
        "Diplôme(s)" : entriesObject["Diplôme(s)"] || "",
        "Début dans l'expertise" : entriesObject["Début dans l'expertise"] || "",
        "Chez Polyexpert depuis" : entriesObject["Chez Polyexpert depuis"] || entriesObject["Chez POLYEXPERT depuis"] || "",
        "Région" : entriesObject["Région"] || "",
        "Bureau" : entriesObject["Bureau"] || "",
        "Département d'intervention" : entriesObject["Département d'intervention"] || "",
        "Code EDI DARVA" : entriesObject["Code EDI DARVA"] || entriesObject["CODE EDI DARVA"] || "",
        "Code GECOR" : entriesObject["Code GECOR"] || entriesObject["CODE GECOR"] || ""
    }
    
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
        link.download = `cv-${entriesObject[searchObj(entriesObject,/Prénom/)[0]].toLowerCase()}-${entriesObject[searchObj(entriesObject,/Nom/)[0]].toLowerCase()}.png`;
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

let searchObj = (obj, term) => {
  let key, keys = []
  for (key in obj)
    if (obj.hasOwnProperty(key) && term.test(key))
      keys.push(key)
  return keys.length ? keys : [""];
}

</script>

<!-- COL 1  -------------------------------------------------------------------------------------------------------------------------------------- -->
<!-- COL 1  -------------------------------------------------------------------------------------------------------------------------------------- -->
<!-- COL 1  -------------------------------------------------------------------------------------------------------------------------------------- -->

<div id="uniquecontainer-{index}" class="container" bind:this={bignode}>
    
    <div class="columns">

        <!-- COLONNE GAUCHE AVEC TABLE -->

        <div id="colgauche" class="column is-4">
            <div class="image portrait">
                <div class="figure-p">
                    <p><strong>{capitalizer(entriesObject[searchObj(entriesObject,/Prénom/)[0]],['-'])} {capitalizer(entriesObject[searchObj(entriesObject,/Nom/)[0]],['-'])}</strong></p>
                    <p><a href=mailto:{entriesObject["Adresse e-mail"]} style="text-decoration:none;">{entriesObject["Adresse e-mail"]}</a></p>                    
                </div>
            </div>

        <table class="table is-narrow infospersos">
            <tr>
                <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Agence & contact</h3></td>
            </tr>
            
            {#each Object.keys(infospersos) as champ}
    
                 <tr>
                    <td width="40%">
                        {champ}
                    </td> 
                    <td width="60%">
                        {#if infospersos[champ]}
                        {infospersos[champ]}
                        {/if}
                    </td>
                </tr>

            {/each}

            </table>

        </div>

<!-- COL 2  -------------------------------------------------------------------------------------------------------------------------------------- -->
<!-- COL 2  -------------------------------------------------------------------------------------------------------------------------------------- -->
<!-- COL 2  -------------------------------------------------------------------------------------------------------------------------------------- -->

        <div class="column is-3 space4vh">

            <table class="table is-narrow centermobile">
            {#if entriesObject["Champs d'expertises"]}

            <tr>
                <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Champs d'expertise</h3></td>
            </tr>
            {#each entriesObject["Champs d'expertises"] as champ}
    
                <tr>
                    <td>
                        {champ}
                    </td> 
                </tr>
            {/each}
            {/if}
            {#if entriesObject["Types de risques"]}
            
                <tr>
                    <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Types de risques</h3></td>
                </tr>
                
                {#each entriesObject["Types de risques"] as risque}

                    <tr>
                        <td>
                            {risque}
                        </td> 
                    </tr>
                    
                {/each}
            {/if}
            {#if entriesObject["Branche"]}
            
                <tr>
                    <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Dossiers</h3></td>
                </tr>

            {#each entriesObject["Branche"].replace(/\s*,\s*/g,',').split(",") as dossier}

                <tr>
                    <td>
                        {dossier}
                    </td> 
                </tr>
            {/each}
            {/if}
            
            </table>
        </div>

<!-- COL 3  -------------------------------------------------------------------------------------------------------------------------------------- -->
<!-- COL 3  -------------------------------------------------------------------------------------------------------------------------------------- -->
<!-- COL 3  -------------------------------------------------------------------------------------------------------------------------------------- -->        

        <div class="column is-3 space4vh">
            
            <table class="table is-narrow centermobile domaines">
            {#if entriesObject["Domaines d'intervention"]}
            
                <tr>
                    <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Domaines d'intervention</h3></td>
                </tr>

            {#each entriesObject["Domaines d'intervention"] as domaine}

                <tr>
                    <td>
                        {domaine}
                    </td> 
                </tr>
            {/each}
            {/if}
            {#if entriesObject["Electricité"]}

                <tr>
                    <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Electricité</h3></td>
                </tr>

            {#each entriesObject["Electricité"] as electricite}

                <tr>
                    <td>
                        {electricite}
                    </td>                     
                </tr>
            {/each}
            {/if}
            {#if entriesObject["Vol"]}

                <tr>
                    <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Vol</h3></td>
                </tr>

            {#each entriesObject["Vol"] as vol}

                <tr>
                    <td>
                        {vol}
                    </td>                     
                </tr>
            {/each}
            {/if}
            {#if entriesObject["Autres"]}

                <tr>
                    <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Autres domaines</h3></td>
                </tr>

            {#each entriesObject["Autres"] as autre}

                <tr>
                    <td>
                        {autre}
                    </td>                     
                </tr>
            {/each}
            {/if}
            
            </table>
        </div>

<!-- COL 4  -------------------------------------------------------------------------------------------------------------------------------------- -->
<!-- COL 4  -------------------------------------------------------------------------------------------------------------------------------------- -->
<!-- COL 4  -------------------------------------------------------------------------------------------------------------------------------------- -->        

        <div class="column is-3 space4vh">
            
            <table class="table is-narrow centermobile">
            {#if entriesObject["EEA"]}
                <tr>
                    <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Certifications EAA</h3></td>
                </tr>

            
            {#each entriesObject["EEA"].replace(/\s*,\s*/g,',').split(",") as eaa}

                <tr>
                    <td>
                        {eaa}
                    </td> 
                </tr>
            {/each}
            {/if}
            {#if entriesObject["CEA"]}

                <tr>
                    <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Certifications CEA</h3></td>
                </tr>

            {#each entriesObject["CEA"].replace(/\s*,\s*/g,',').split(",") as cea}

                <tr>
                    <td>
                        {cea}
                    </td>                     
                </tr>
            {/each}
            {/if}
            {#if entriesObject["APSAD"]}

                <tr>
                    <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Certifications APSAD</h3></td>
                </tr>

            {#each entriesObject["APSAD"].replace(/\s*,\s*/g,',').split(",") as apsad}

                <tr>
                    <td>
                        {apsad}
                    </td>                     
                </tr>
            {/each}
            {/if}
            {#if entriesObject["CSTB"]}

                <tr>
                    <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Certifications CSTB</h3></td>
                </tr>

            {#each entriesObject["CSTB"].replace(/\s*,\s*/g,',').split(",") as cstb}

                <tr>
                    <td>
                        {cstb}
                    </td>                     
                </tr>
            {/each}
            {/if}
            {#if entriesObject["Autres certifications"]}

                <tr>
                    <td colspan="2" style="border:none;"><h3><img src="./img/cv_specialites.svg" alt="client">Autres certifications</h3></td>
                </tr>

            {#each entriesObject["Autres certifications"].replace(/\s*,\s*/g,',').split(",") as autres}

                <tr>
                    <td>
                        {autres}
                    </td>       
                </tr>
            {/each}
            {/if}          

            </table>        
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

    .columns {
        justify-content: flex-start;
        width: -webkit-fill-available;
        width: -moz-fill-available;
        width: fill-available;
        margin-left: 0rem;
        margin-right: 0rem;
        margin-top: 0rem;
    }

    h3 img {
        margin-right:10px;
        position:relative;
        top:3px;
    }

    .figure-p strong {
        color:white;
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
        text-transform: uppercase;
        margin-bottom: 1.5vh;
    }

    .portrait {
        display:flex;
        white-space: nowrap;
        height:15vh;
        color: var(--main-color);
        margin: 0.8vh 0.8vw 2.9vh 0vw;
        font-size:1.5em;
        margin: 0 auto;
        justify-content: center;
    }

    .portrait img {
        height:15vh;
        width:15vh!important;
    }

    .portrait a {
        color: white;
        text-decoration: underline;
        font-weight:300;
        font-size:smaller;
    }

    .portrait p {
        color: white;
    }


    #colgauche {
        background-color: var(--main-color);
        color:white;
        min-height:101vh;
    }

    .figure-p {
        justify-content: center;
        text-align:center;
        width:100%
    }

    .figure-p p {
        line-height:initial;
    }

    #colgauche table tr td {
        font-size: 1em;
        color: white;
        border-color:rgba(255,255,255,0.5)!important;
    }

    #colgauche td + td { 
        vertical-align: middle;
    }

    .butcontainer {
		position: absolute;
        top: 3vh;
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

     #colgauche .table {
        background-color: transparent;
        color:white;
        margin: 0 auto;
    }

    #colgauche .table img {
        filter: invert(100%) hue-rotate(250deg) brightness(200%) contrast(100%);
    }

    .container {
        flex-direction: unset;
    }


    @media only screen and (max-width: 768px) {
        .portrait {
            width:auto!important;
            margin-top:1em;
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
        #colgauche {
            min-height:75vh;
        }
        .centermobile {
            text-align:center;
            width:100%;
        }
        .centermobile td {
            border:none;
        }
        .table h3 {
            line-height:1.5em;
            padding-top:1em;
        }
        .container {
            max-height:unset!important;
            height:auto!important;
        }
    }

    @media only screen and (min-width: 860px) {
    
        #colgauche {
            height:100vh;
            padding-left: 1.5em;
        }

        .space4vh {
            margin-top:4vh;
        }
        .table {
            width:87%!important;
        }

        .table td {
            line-height: 2em;
        }

        .table h3 {
            line-height:3em;
            padding-top:0.6em;
        }

        .is-3 {
            width:23%!important;
        }

    }
    @media only screen and (min-width: 860px) and (max-width: 1366px) {
        #colgauche table tr td {
            font-size: 0.8em;
        }
        .table td {
            line-height: 1.2em;
        }
        .centermobile {
            width:100%;
        }
        .centermobile td {
            font-size:0.8em
        }
        .table h3 {
            line-height:1.2em;
            font-size:1.2em;
            padding-bottom:1em;
        }
        h3 img {
            height:18px;
            width:auto;
            margin-right:5px;
        }


    }

    
</style>
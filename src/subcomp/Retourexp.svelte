<script>
import { onMount, createEventDispatcher  } from 'svelte';
import Loading from './Loading.svelte'
import domtoimage from 'dom-to-image-more';
import { API } from '../utils/consts.js'
import Modal from './Modal.svelte'
import { Notification } from 'svelma-pro';
import {capitalizer, requestFullScreen, blobToDataURL, saveAs, searchObj} from './utils.js'

export let entriesObject;
export let index = 0;
export let forceScreenGrab = false;
export let laTotale;
export let isInterne;

let files;
let newName;

let buttonGrab; 
let ready = false;
let modalActive = false;
let photoVisible;

const dispatch = createEventDispatcher();

$: if (forceScreenGrab) screenGrab();

let photos = []; let loadedPhotos = [];
let bignode;
let entite = "Polyexpert";
let detailSecteur = []; let detailSecteurValues = [];
let IMG = API + "assets/retex/";
let photokey;
let secteurs = [];
      
onMount(async () => { 
    detailSecteur = searchObj(entriesObject, /du\ssecteur/);
    detailSecteur.push(searchObj(entriesObject, /macro/));
    detailSecteur = detailSecteur.flat()
    
    detailSecteur.forEach(d=> { 
        Array.isArray(entriesObject[d]) ? detailSecteurValues.push(entriesObject[d]) : detailSecteurValues.push([entriesObject[d]] )
    });

    detailSecteurValues = detailSecteurValues.flat().filter(entry => entry != '');
    
    photokey=searchObj(entriesObject, /photo/)
    photos = (entriesObject[photokey]).split(',');
    ready = true;
});

const changed = (event, index)=>{

        files = event.target.files;
        if (!entriesObject["Adresse e-mail"]) {
            showNotification("Nous avons besoin de l'email, du nom et du prénom pour les relier à la photo", 
            { type: 'is-danger', position: 'is-bottom-right', icon: true })
            return;
        }
        //let filesExt = files[0].name.match(/\.(.*)/)[0] || ".jpg";
        newName = entriesObject["Adresse e-mail"];
        newName = newName.trim().toLowerCase();
        let reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("inmageuploaded").src = e.target.result;
        };
        reader.readAsDataURL(files[0]);
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

async function sendToServer () {
    if (!files[0]) return;
        
    let ctxed = await domtoimage.toBlob(document.getElementById('inmageuploaded'))
    

    const formData = new FormData()
    formData.append('file', ctxed, newName.toLocaleLowerCase() )
    formData.append('formName', 'retex');

    fetch(`${API}upload`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        modalActive = false;
        if (data[0].message === "OK") {
            showNotification("Image envoyée avec succès", { type: 'is-success', position: 'is-bottom-right', icon: true })
            ready=false;
            photoVisible = false;
            getImageSrc(false);
        } else {
            showNotification("Echec de l'envoi. Rééssayez ultérieurement.", { type: 'is-danger', position: 'is-bottom-right', icon: true })
        }
    })
    .catch(error => {
        console.error(error)
    })
}

async function getImageSrc(field, fallback) {
    ready=false;
    newName = API + "assets/upload/retex/" + entriesObject["Adresse e-mail"];
    newName = newName.toLocaleLowerCase();
    return fetch(newName)
        .then(res => {
            if (res.ok) {
                ready=true;
                photoVisible = true;
                return newName;
            } else {
                return !photos[0] || (photos[0] && !photos[0].length) ? './img/avatar_fallback_blue.png' : IMG + photos[0].split('?id=')[1];
            }
        }).catch(err => console.log('Error:', err));
    
    ready=true;
    photoVisible = true;
}

function showNotification(message, props) {
    Notification.create({
        message: message,
        ...props
    })
}

</script>

		<Modal closeText = "Annuler et revenir" title="Envoyer une photo" width="50vw" bind:active={modalActive}>

            <input class="input" id="fileUpload" type="file" accept="image/*" bind:files on:change={changed}>
            {#if files && files[0]}
                <img id="inmageuploaded" alt="avatar"/>
                <div style="text-align:center">
                    <button class="button is-primary is-large" on:click={sendToServer}>ENVOYER</button>
                </div>
            {/if}

		</Modal>

<div id="uniquecontainer-{index}" class="container addon-container" bind:this={bignode}>
    
    <div class="grid-container">
        <div class="entete">
        <div id="superh1">{entriesObject[searchObj(entriesObject,/Quel\stype/)[0]]} - {detailSecteurValues.toString().replace(/,/g, ", ")}</div>
            {#if isInterne}
                <div id="nom-prenom">
                {#if entriesObject[searchObj(entriesObject,/prénom/)[0]].length || entriesObject[searchObj(entriesObject,/famille/)[0]].length}
                    {capitalizer(entriesObject[searchObj(entriesObject,/prénom/)[0]],['-'])}                 
                    {capitalizer(entriesObject[searchObj(entriesObject,/famille/)[0]],['-']).toUpperCase()} <br>
                {/if}
                {#if entriesObject[searchObj(entriesObject,/éférence /)[0]].length}
                    Référence : <strong>{entriesObject[searchObj(entriesObject,/éférence /)[0]]}</strong>,&nbsp;<br>
                {/if}
                {#if entriesObject[searchObj(entriesObject,/du\sclient/)[0]].length}
                    Client : <strong>{entriesObject[searchObj(entriesObject,/du\sclient/)[0]]}</strong>
                {/if}
                </div>
            {/if}
        </div>

        <div class="resultat-obtenu">
            <h2><img src="./img/resultat-obtenu.svg" alt="client">Résultat obtenu</h2>
            <div>{@html entriesObject["Le résultat obtenu"].replace(/\n/g, '<br>')}</div>
        </div>
        <div class="enjeu">
            <h2><img src="./img/enjeu-dossier.svg" alt="client">Enjeu dossier</h2>
            <div>{@html entriesObject[searchObj(entriesObject,/enjeu/)[0]].replace(/\n/g, '<br>')}</div>
        </div>
        <div class="secteur-activite">
            <h2><img src="./img/secteur-activite.svg" alt="loupe">Secteur d'activité</h2>
            <div>
            {#each detailSecteurValues as subkey}
                
                <p>{subkey}<br></p>
                
            {/each}
            </div>
        </div>
        <div class="client">
            <h2><img src="./img/client.svg" alt="client">Client</h2>
            <div>{@html entriesObject["Client"].replace(/\n/g, '<br>')}</div>
        </div>
        <div class="contexte">
            <h2><img src="./img/loupe.svg" alt="loupe">Contexte</h2>
            <div>{@html entriesObject[searchObj(entriesObject,/contexte/)[0]].replace(/\n/g, '<br>')}</div>
        </div>
        <div class="demarche">
            <h2><img src="./img/demarche.svg" alt="client">Démarche / Méthode</h2>
            <div>{@html entriesObject[searchObj(entriesObject,/démarche/)[0]].replace(/\n/g, '<br>')}</div>
        </div>
        <div class="photo">
        <!-- <h2 class="hide">&nbsp;</h2> -->
            <figure class="photo-dossier" on:click={() => modalActive = true}>
                {#if !photoVisible && index == 0}
                <Loading extraStyle={"right:11em;"} text={''}/>
                {/if}
                {#await getImageSrc("Une photo représentative du dossier?") then image}                                  
                    <img on:load={()=>photoVisible = true} crossorigin="anonymous" src={image} alt="Représentation du dossier">
                {/await}
            </figure>
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
        margin-top: -2vh;
    }
    #nom-prenom strong {
        color: var(--main-color);
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
        grid-template-areas: "entete entete entete entete" "client secteur-activite enjeu photo" "contexte demarche demarche photo" "contexte resultat-obtenu resultat-obtenu photo";
        max-height:max-content;
        min-height: calc(95vh - 10px);
    }

    .grid-container div:not(.entete) > div {
        padding: 5px 20px 5px 5px;
        flex: 1;
        background-color: white; /*var(--bg-color);*/
        color: black;
        font-size: 0.8vw;
    }
    .grid-container div:not(.entete):not(.enjeu):not(.demarche):not(.resultat-obtenu) > div {
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

    .enjeu { grid-area: enjeu; display: flex; flex-direction:column; }

    .secteur-activite { grid-area: secteur-activite; display: flex; flex-direction:column; }

    .client { grid-area: client; display: flex; flex-direction:column; }

    .contexte { grid-area: contexte; display: flex; flex-direction:column; }

    .demarche { grid-area: demarche; display: flex; flex-direction:column; }

    .photo { grid-area: photo; display: flex; flex-direction:column; cursor:pointer }

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

    .photo:hover::before {
        position: absolute;
        top: 9rem;
        right: 4.5rem;
        content: "+";
        width: 1em;
        height: 1em;
        font-size: xx-large;
        color: white;
        border: 1px white solid;
        border-radius: 50%;
        display: flex;
        align-items: center;
        place-content: center;
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
            grid-template-areas: "entete" "photo" "client" "secteur-activite" "enjeu" "contexte" "demarche" "resultat-obtenu";
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
<script>
import { onMount, createEventDispatcher  } from 'svelte';
import { Notification } from 'svelma-pro';
import Loading from './Loading.svelte'
import Dots from './Dots.svelte'
export let entriesObject;
export let index = 0;
export let forceScreenGrab = false;
import domtoimage from 'dom-to-image-more';
import { API } from '../utils/consts.js'
import Modal from './Modal.svelte'

let laTotale;
let ready = false;
let buttonGrab;
let photoVisible;
let modalActive = false;
let files;
let newName;
let bigNode;

const dispatch = createEventDispatcher();

$: if (forceScreenGrab) screenGrab();
	
let photos = [];

let QCM = {
    //Quel est votre niveau de maîtrise sur les conventions ?
    levelsLangues : {"Notion" : 1, "Capacité professionnelle" : 2},
    levelsAutresSecteurs : {"Notion" : 1, "En capacité d'exercer" : 2},
    levelsConventions : {"Notions" : 1, "Intervention fréquente" : 2, "Expert" : 3 },
    levelsMandants : {"Faible" : 1, "Moyen" : 2, "Forte volumétrie" : 3 },
    levelsSpecialites : {"Notion" : 1, "Spécialiste" : 2, "Maîtrise" : 3 },
}

let currentTable2 = 1;

//let PROXY = 'https://doublepromax.herokuapp.com/';*
let IMG = API + 'assets/geco/'

function capitalizer(str, separators) {
  separators = separators || [ ' ' ];
  var regex = new RegExp('(^|[' + separators.join('') + '])(\\w)', 'g');
  return str.toLowerCase().replace(regex, function(x) { return x.toUpperCase(); });
}

function showNotification(message, props) {
		Notification.create({
			message: message,
			...props
		})
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
    let node = document.body;
    
    buttonGrab.style.display = "none";
    const scale = 2;
    let obj = {
        height: node.scrollHeight * scale,
        width: node.offsetWidth * scale,
        style: {
            transform: "scale(" + scale + ")",
            transformOrigin: "top left",
            width: node.offsetWidth + "px",
            height: node.scrollHeight + "px"
        },
        bgcolor: "white"
    }

    domtoimage.toPng(node, obj)
    .then((dataUrl) => {
        let link = document.createElement('a');
        link.download = `cv-${entriesObject[searchObj(entriesObject,/prénom/)[0]].toLowerCase()}-${entriesObject[searchObj(entriesObject,/otre\snom/)[0]].toLowerCase()}.png`;
        link.href = dataUrl;
        link.click();

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

let nbl = 0
onMount(async () => {	
 
    for (const v of Object.values(entriesObject[searchObj(entriesObject, /univers/)])) {
        if (v != "Néant")
            nbl++
    }
    //console.log("nblangues : ", nbl);
    ready = true;
    localStorage.clear();
});

let searchObj = (obj, term) => {
  let key, keys = []
  for (key in obj)
    if (obj.hasOwnProperty(key) && term.test(key))
      keys.push(key)
  return keys.length ? keys : [""];
}


async function getImageSrc(field) {
    ready=false;
    newName = API + "assets/upload/geco/" + entriesObject["Adresse e-mail"]+'-'+entriesObject["Votre nom"]+'-'+entriesObject["Votre prénom"];
    newName = newName.toLocaleLowerCase();
    return fetch(newName)
        .then(res => {
            if (res.ok) {
                ready=true;
                photoVisible = true;
                return newName;
            } else {
                //console.log("pouet")
                return entriesObject[field] === undefined || entriesObject[field].split('?id=')[1] === undefined ? './img/avatar_fallback.png' : IMG + entriesObject[field].split('?id=')[1];
            }
        }).catch(err => console.log('Error:', err));
    
    ready=true;
    photoVisible = true;
}

const changed = (event)=>{

        files = event.target.files;
        if (!entriesObject["Adresse e-mail"] || !entriesObject["Votre nom"] || ! entriesObject["Votre prénom"]) {
            showNotification("Nous avons besoin de l'email, du nom et du prénom pour les relier à la photo", 
            { type: 'is-danger', position: 'is-bottom-right', icon: true })
            return;
        }
        //let filesExt = files[0].name.match(/\.(.*)/)[0] || ".jpg";
        newName = entriesObject["Adresse e-mail"]+'-'+entriesObject["Votre nom"]+'-'+entriesObject["Votre prénom"]//+filesExt;
        newName = newName.toLowerCase();
        let reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("inmageuploaded").src = e.target.result;
        };
        reader.readAsDataURL(files[0]);

}
async function sendToServer () {
    if (!files[0]) return;
        
    let ctxed = await domtoimage.toBlob(document.getElementById('inmageuploaded'))
    

    const formData = new FormData()
    formData.append('file', ctxed, newName.toLocaleLowerCase() )
    formData.append('formName', 'geco');

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

<div id="uniquecontainer-{index}" bind:this={bigNode} class="container addon-container">
    
    <div class="columns">

        <!-- COLONNE GAUCHE AVEC TABLE -->

        <div id="colgauche" class="column is-3">
           
        <div class="columns blocinfos">
            <div class="column is-one-third">
                 {#if !photoVisible && index == 0 && entriesObject["Insérer votre photo"].length >= 10}
                    <Loading extraStyle={"left:1.5em;top:1.5em;width:100px;height:100px;filter:invert(1);"} text={''}/>
                {/if}
                
                    <div class="image-avatar" on:click={() => modalActive=true}>
                    {#await getImageSrc("Insérer votre photo") then image}
                        <img id="photorenseignant" on:load={()=>photoVisible = true} src={image} alt="Portrait du renseignant">
                    {/await}
                    </div>
                
            </div>
            <div class="column is-two-thirds">

                <div class="figure-p">                
                    
                        <p><strong><span class="bigger">{capitalizer(entriesObject[searchObj(entriesObject,/prénom/)[0]],['-'])}&nbsp;{capitalizer(entriesObject[searchObj(entriesObject,/otre\snom/)[0]],['-'])}</span></strong><br>
                            <a style="color:white;" href=mailto:{entriesObject["Adresse e-mail"]}>{entriesObject["Adresse e-mail"]}</a><br>
                            {entriesObject[searchObj(entriesObject,/expérience dans l'assurance/)[0]]} an(s) dans l'assurance<br>
                            Chez Geco depuis {entriesObject[searchObj(entriesObject,/au\ssein/)[0]]}<br>
                            <strong>Site : </strong>{entriesObject.Site}
                        </p>
                    
                </div>

            </div>
        </div>
            
            <table id="tabletrans" class="table is-narrow">
            <tr><td colspan="2" style="border:none;"><h3><img src="./img/client.svg" alt="client">Type de client</h3></td></tr>
            <tr><td style="border:none;">
            {#if entriesObject["Type de client gérés"].split(',').length}
            {#each entriesObject["Type de client gérés"].split(',') as client, index}
                {#if client != "Néant"}
                    {client.trim()}{#if index != entriesObject["Type de client gérés"].split(',').length -1},&nbsp{/if}
                {/if}
            {/each}
            {/if}
            </td></tr>
            </table>

            <table id="tablesecteur" class="table is-narrow">
            <tr>
                <td colspan="2" style="border:none;padding-top: 3.5vh!important;">
                    <h3><img src="./img/cv_secteurs.svg" alt="client">Spécialités</h3>
                </td>
            </tr>

            {#each Object.entries(entriesObject["Specialites"]) as [spec,val]}
                {#if val.length && val != "Jamais intervenu"}
                 <tr>
                    <td width="75%">
                        { spec }
                    </td> 
                    <td width="25%" style="text-align: right;">
                        <Dots score={QCM.levelsSpecialites[val]} />
                    </td>
                </tr>
                {/if}
            {/each}

            </table>

            <table id="tablesecteur" class="table is-narrow">
            <tr>
                <td colspan="2" style="border:none;padding-top: 3.5vh!important;">
                    <h3><img src="./img/cv_specialites.svg" alt="Intervention sur le cycle de gestion du dossier">Intervention sur le cycle<br>de gestion du dossier</h3>
                </td>
            </tr>
 
            <tr>
                <td>
                    {entriesObject[searchObj(entriesObject, /cycle\sde\sgestion/)]}
                </td>
            </tr>

            </table>

            
        </div>
        
        <!-- BIG BLOC 2 COLONNES A DROITE -->

        <div id="coldroite" class="column" style="align-self:center;">
            <div class="entete">
                <div id="logo-entete"><img src={'./img/geco.png'} alt="Logo de l'entité"></div>                                            
                <div id="superh1">{entriesObject["Intitulé de poste"]}</div>
            </div>
            <div class="bigbox">
                <div class="columns is-multiline">
                    
                     <!-- BLOCS XP + FORMATION -->

                    <div class="column is-half">
                    <h3 class="h3droite"><img src="./img/cv_formation.svg" alt="Formation">Formation</h3>
                        <div class="box-interne">
                           <p>
                            {#each entriesObject.diplome as diplome}
                                {diplome[searchObj(diplome,/obtention/)].replace(/-|\s-|-\s|\s-\s/g,' - ')} <br>
                            {/each}                
                            
                            </p>
                        </div>
                    </div>
                

                    <div class="column is-half">
                      <h3 class="h3droite"><img src="./img/cv_formation.svg" alt="Formation">Langues maîtrisées</h3>
                        <div class="box-interne">
                            <table>
                                {#each Object.entries(entriesObject[searchObj(entriesObject, /univers/)]) as [langue, niveau]}
                                    {#if niveau.length && niveau != "Néant"}
                                    <tr>
                                        <td width="75%" class:noborders={nbl === 1}>
                                            {langue}
                                        </td> 
                                        <td width="25%" style="text-align: right;" class:noborders={nbl===1}>
                                            <Dots length={2} invert={true} score={QCM.levelsLangues[niveau]} />
                                        </td>
                                    </tr>
                                    {/if}
                                {/each}
                            </table>
                        </div>
                    </div>

                    <!-- BLOCS LANGUES + (CONVENTION  && CYCLE DE GESTION) -->

                    <div class="column is-full">
                    <h3 class="h3droite"><img src="./img/cv_xp.svg" alt="client">Expérience professionnelle</h3>
                        <div class="box-interne">
                        
                            <ul>
                           {#each entriesObject.entreprise as xp}
                                <p>{xp[searchObj(xp,/Fonction/)]}</p>
                            {/each}
                            </ul>
                        </div>
                    </div>
                
<!-- NOUVEAU BLOC -->
                    <div class="column is-half">
                    <h3 class="h3droite"><img src="./img/cv_projet.svg" alt="Formation">Conventions</h3>
                        <div class="box-interne">
                            <table>
                                {#each Object.entries(entriesObject[searchObj(entriesObject, /conventions/)]) as [convention, niveau]}
                                    {#if niveau.length && niveau != "Jamais intervenu"}
                                    <tr>
                                        <td width="75%">
                                            { convention }
                                        </td> 
                                        <td width="25%" style="text-align: right;">
                                            <Dots invert={true} score={QCM.levelsConventions[niveau]} />
                                        </td>
                                    </tr>
                                    {/if}
                                {/each}
                            </table>
                        </div>
                    </div>
                                
                    <div class="column is-half">
                        <h3 class="h3rien"><img src="./img/cv_projet.svg" alt="client">Compétence assurantielle</h3>
                    
                        <table id="tablecertif" class="table is-narrow" style="margin-top:1.5em;">
               
                            {#each Object.entries(entriesObject[searchObj(entriesObject,/autres\ssecteurs/)]) as [sect,val]}
                                {#if val.length && val != "Jamais intervenu"}
                                <tr>
                                    <td width="80%">
                                        { sect }
                                    </td> 
                                    <td width="20%" style="text-align: right;">
                                        <Dots invert={true} length={2} score={QCM.levelsAutresSecteurs[val]} />
                                    </td>
                                </tr>
                                {/if}
                            {/each}

                        </table>
                        
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

    .blocinfos {
        margin-left:1rem;
        margin-top:2rem!important;
    }

    li strong {
        color:var(--main-color);
    }

    .figure-p strong {
        color:white;
    }
    .bigger {
        font-size:1.5em!important;
    }

    .entete {
        display:flex;
        flex-direction:column;
        padding-left: 1.5em;
    }
    .image-avatar {
        cursor: pointer;
    }
    .image-avatar:hover::before {
        position: absolute;
        top: 2rem;
        left: 1em;
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
    #logo-entete img {
        width:auto ;
        max-height:3.4vmax;
    }
    .noborders {
        border:none!important;
    }
    
    #logo-entete {
        position: absolute;
        top: 2em;
        right: 1vw;
    }

    #superh1 {
        font-size: 2.85em;
        font-weight: 700;
        line-height: 58px;
        color: var(--main-color);
        margin-bottom: 1.5vh;
    }

    #colgauche {
        background-color: var(--main-color);
        color:white;
        height: min-content;
        padding-bottom: 3em;
    }

    #colgauche h3 {
        margin-bottom:0.2em;
        font-size: 1.5em;
    }

    #coldroite {
        padding-top:4vh;
        height: min-content;
    }

    #coldroite h3 {
        font-weight: 400;
        font-size: 1.5em;
    }

    .figure-p {
        padding-left: 0.75rem;
    }
    .figure-p a:visited, .figure-p a:active {
        color:white!important;
    }

    .addon-container {
        padding-right: 2em;
        padding-bottom: 2em;
    }

    #colgauche table tr td {
        font-size: 1em;
        color: white;
        border-color:rgba(255,255,255,0.5)!important;
        vertical-align: middle;
    }

    #tablecertif {
        color:var(--main-color)
    }
    #coldroite table tr td {
        border-color:rgba(127,127,127,0.5)!important;
        border-bottom:1px solid;
        padding: 0.5em 1em;
    }

    td + td { 
        vertical-align: middle;
    }

    .butcontainer {
		position: absolute;
        bottom: 2vh;
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


    .table:not(#tablecertif) {
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
        height:unset;
        max-height:unset!important;
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
        margin-top:unset;
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

        #logo-entete {
            display:none;
        }
    }

    @media only screen and (min-width: 823px) and (max-width: 1280px) {
    
        .butcontainer {
            top: 1.5vh;
            right: 2vw;
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
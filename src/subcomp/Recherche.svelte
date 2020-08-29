<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { Button, Field, Icon, Input, Notification } from 'svelma-pro';
  import { Tabs, Tab } from 'svelma-pro'
  import Select from 'svelte-select';
  import { API, options } from '../utils/consts.js'
  import axios from 'axios'

  export let entriesObject = [];

  export let results;
  let gogoDisabled = false;
  let searchHasBegun = false;

  const dispatch = createEventDispatcher();

  
	onMount(async () => {	
    searchHasBegun = false;
  });

  let filtres = {

  retex : {
    secteurs : {
      formKey : "macro", //query string to regex (%20 blabla)
      data :
      [
        "Agriculture",
        "Arts, spectacles, activités récréatives et sportives",
        "Distribution et commerce",
        "Construction",
        "Energie & Environnement",
        "Hôtellerie et restauration",
        "Industrie",
        "Cyber et technologie de l’Information",
        "Services et Finances",
        "Transport, mobilité et entreposage"
      ],
      _selectedData : undefined,
      get selectedData() {
        return this._selectedData;
      }
    },
    enjeux : {
      formKey : "enjeu",
      _selectedData : "",
      inputRegExp : /^[^,]{3,}(?:,[^,]{3,}){0,9}$/g,
      inputErrorMsg : "Veuillez saisir plus de trois caractères par mot-clé",
      hasInputError : undefined,
      get selectedData() {
        return this._selectedData.trim().replace(/\s/g,'');
      }
    },
    resultats : {
      formKey : "resultats", // All à traiter
      _selectedData : "",
      inputRegExp : /^[^,]{3,}(?:,[^,]{3,}){0,9}$/g,
      inputErrorMsg : "Veuillez saisir plus de trois caractères par mot-clé",
      hasInputError : undefined,
      get selectedData() {
        return this._selectedData.trim().replace(/\s/g,'');
      }
    }
  },

  experts : {
    region : {
      formKey : "région",
      data : 
      [      
        {value : "ATL" , label : "Atlantique"},
        {value : "RAA" , label : "Rhône Alpes Auvergne"},
        {value : "MED" , label : "Méditerranée"},
        {value : "LAN" , label : "Languedoc-Roussillon"},
        {value : "PAQ" , label : "Pyrénées-Aquitaine"},
        {value : "EST" , label : "Est"},
        {value : "NORD", label : "Nord"},
        {value : "IDF" , label : "Iles de France Centre"},
        {value : "POLYTEL", label : "Polytel"}
      ],
      _selectedData : undefined,
      get selectedData() {
        return this._selectedData;
      }
    },

    departement : {
      formKey : "département",
      _selectedData : undefined,
      inputRegExp : /^ *\d+ *(?:, *\d+ *)*$/,
      inputErrorMsg : "La liste de département est invalide (vérifiez les virgules et les espaces)",
      hasInputError : undefined,
      get selectedData() {
        return this._selectedData;
      }
    },

    darva : {
      formKey : "darva",
      _selectedData : undefined,
      inputRegExp : /^[a-zA-Z]{1}[0-9]{11}/,
      inputErrorMsg : "Code EDI DARVA invalide",
      hasInputError : undefined,
      get selectedData() {
        return this._selectedData;
      }
    },
    gecor : {
      formKey : "gecor",
      _selectedData : undefined,
      inputRegExp : /^[a-zA-Z]{1}[0-9]{6}/,
      inputErrorMsg : "Code GECOR invalide",
      hasInputError : undefined,
      get selectedData() {
        return this._selectedData;
      }
    },

    domaines : {
      formKey : "domaine" ,
      data : [        
        "Bâtiment et aménagements", 
        "Voierie et réseaux divers",  
        "Mobilier",  
        "Matériel",  
        "Bris de machine",  
        "Marchandises",  
        "Marchandises transportées",  
        "Perte d'exploitation",  
        "Catastrophes naturelles",  
        "Sécheresse",  
        "Aéronautique",  
        "Agricole",  
      ],
      _selectedData : undefined,
      get selectedData() {
        return this._selectedData;
      }
    },
    electricite : {
      formKey : "electricité" ,
      data : [        
        "Dommages électriques",
        "Recours ERDF",
        "Recherche des causes",
      ],
      _selectedData : undefined,
      get selectedData() {
        return this._selectedData;
      }
    },
    vol : {
      formKey : "vol" ,
      data : [        
        "Objets précieux",
        "Bijoux", 
        "Marchandises", 
        "Matériels", 
        "Métaux", 
        "Engins", 
      ],
      _selectedData : undefined,
      get selectedData() {
        return this._selectedData;
      }
    },
    autres : {
      formKey : "autres" ,
      data : [        
        "Recherche des causes d'incendies",
        "SNCF",
        "RCD / Dommages ouvrages",
      ],
      _selectedData : undefined,
      get selectedData() {
        return this._selectedData;
      }
    },
  },

  savoirfaire : {
    certifs : {
      formKey : "certifications",
      data :
      [
        "EEA Généraliste",
        "EEA Bâtiment",
        "EEA Matériels et installations",
        "EEA Préjudices immatériels et marchandises",
        "EEA Dommages agricoles",
        "EEA Plaisance",
        "EEA Matériels et installations",
        "EEA Préjudices immaté",
        "EEA Matériels et installations",
        "EEA Préjudices immaté",
        "CEA Habilitation ERC",
        "CEA Technicien Expert",
        "CSTB Compétence Expert Construction",
        "CSTB Agréé CRAC",
        "Recommandé CESAM et VHT",
        "APSAD Recommandé Bâtiment",
        "APSAD Recommandé Matériel",
        "APSAD Recommandé Marchandise",
        "APSAD Recommandé  PE",
        "APSAD Qualifié Qualifié",
        "APSAD Agréé Bâtiment",
        "APSAD Agréé Matériel",
        "APSAD Agréé Marchandises",
        "APSAD Agréé PE"
      ],
      _selectedData : undefined,
      get selectedData() {
        return this._selectedData;
      }
    },
    sectorielles : {
      formKey : "vos%20domaines",
      data : [
        "Agriculture",
        "Arts, spectacles, activités récréatives et sportives",
        "Distribution et commerce",
        "Construction",
        "Energie, Environnement, Pollution et Ressources naturelles",
        "Hôtellerie et restauration",
        "Industrie",
        "Cyber et technologie de l’Information",
        "Services et Finances",
        "Transport, mobilité et entreposage"
      ],
      _selectedData : undefined,
      get selectedData() {
        return this._selectedData;
      }
    },
    transverses : {
      formKey : "specialites",
      data : [
        "Matériel (bris de machine)",
        "Marchandises/PE",
        "RC spécialisées - Rc risque industrie",
        "RC spécialisées - RC Maritime",
        "Bâtiment / Construction / TRC",
        "RCCI",
        "RC Spécialisées Expert Comptable"
      ],
      _selectedData : undefined,
      get selectedData() {
        return this._selectedData;
      }
    },
    formation : {
      formKey : "diplome", // 1 to 2
      _selectedData : "",
      inputRegExp : /^[^,]{3,}(?:,[^,]{3,}){0,9}$/g,
      inputErrorMsg : "Veuillez saisir plus de trois caractères par mot-clé",
      hasInputError : undefined,
      get selectedData() {
        return this._selectedData.trim().replace(/\s/g,'');
      }
    },
    dossiers : {
      formKey : "[marquant][problématique]", // 1 to 10
      inputRegExp : /^[^,]{3,}(?:,[^,]{3,}){0,9}$/g,
      inputErrorMsg : "Veuillez saisir plus de trois caractères par mot-clé",
      hasInputError : undefined,
      _selectedData : "",
      get selectedData() {
        return this._selectedData.trim().replace(/\s/g,'');
      }
      
    }
  }
}


function showNotification(message, props) {
		Notification.create({
			message: message,
			...props
		})
	}

async function gogoFilter (form) {
  
  let queryStr = [];
  for (const k of Object.keys(filtres[form])) {
    if (filtres[form][k].selectedData && filtres[form][k].selectedData.length) {
      if (Array.isArray(filtres[form][k].selectedData))
        queryStr.push(`${filtres[form][k].formKey}=${filtres[form][k].selectedData.map(e => e.value.replace(/&/g,'$').replace(/\((.*)\)/, "°$1|").replace(/ /g,"%20")).join(`&${filtres[form][k].formKey}=`)}`);
      else queryStr.push(`${filtres[form][k].formKey}=${filtres[form][k].selectedData.replace(/&/g,'$').replace(/\((.*)\)/, "°$1|").replace(/ +/g,"%20").replace(/,/g,`&${filtres[form][k].formKey}=`)}`);
    }
  }

  if (!queryStr.length) {
    showNotification("Aucun filtre saisi", { type: 'is-danger', position: 'is-bottom-right', icon: true })
    return;
  }
  
  queryStr.push(`isOr=${$options.isOr}`)

  //console.log(API + 'sheet/'+ form +'?'+queryStr.join("&"));
  searchHasBegun = true;
  entriesObject = await axios(API + 'sheet/'+ form +'?'+queryStr.join("&"))
  entriesObject = entriesObject.data;
  
  if (entriesObject.filters)
    results = entriesObject.filters;  
  entriesObject = entriesObject.filtered;

  if (!entriesObject || !entriesObject.length)
    searchHasBegun = false;

  dispatch('searchReady', {form: form});
}

let groupBy = (item) => item.group;

function checkInput (obj) {
  
  let { _selectedData, inputRegExp } = obj;
  if (!_selectedData || !inputRegExp || !inputRegExp instanceof RegExp) return;
  
  if (!_selectedData.match(inputRegExp)) {
    obj.hasInputError = true; 
    gogoDisabled = true;
  }
  else {
    obj.hasInputError = false; 
    gogoDisabled = false;
  }

}

</script>

<Tabs on:activeTabChanged={()=>gogoDisabled=false}>

  <Tab label="RETEX">

    <div class="themed">
        <h4 class="firsth4">Secteur d'activité</h4>
          <Select 
          items={filtres.retex.secteurs.data} isMulti={true} placeholder={'Choisir...'}
          bind:selectedValue={filtres.retex.secteurs._selectedData}></Select>
    </div>

    <h4>Rechercher dans les enjeux</h4>
    <Field type="is-primary">
    <div class="control has-icons-left has-icons-right">
        <input on:input={() => checkInput(filtres.retex.enjeux)} on:blur={() => checkInput(filtres.retex.enjeux)} bind:value={filtres.retex.enjeux._selectedData} 
        class="input" class:is-danger={filtres.retex.enjeux.hasInputError} type="search" placeholder="Saisir un ou des mots-clé séparés par une virgule">
              <span class="icon is-small is-left"><i class="fas fa-search"></i></span>
    </div>
    {#if filtres.retex.enjeux.hasInputError} <p class="help is-danger">{filtres.retex.enjeux.inputErrorMsg}</p>{/if}
    </Field>

    <h4>Recherche dans les résultats obtenus</h4>
    <Field type="is-primary">
    <div class="control has-icons-left has-icons-right">
        <input on:input={() => checkInput(filtres.retex.resultats)} on:blur={() => checkInput(filtres.retex.resultats)}
        bind:value={filtres.retex.resultats._selectedData} class:is-danger={filtres.retex.resultats.hasInputError} class="input" type="search" placeholder="Saisir un ou des mots-clé séparés par une virgule">
          <span class="icon is-small is-left"><i class="fas fa-search"></i></span>
    </div>
    {#if filtres.retex.resultats.hasInputError} <p class="help is-danger">{filtres.retex.resultats.inputErrorMsg}</p>{/if}
    </Field>

     <p class="control" style="text-align:center;">
      
      <button class="button is-warning" class:is-loading={searchHasBegun} style="padding-left:2em;padding-right:2em;" type="submit" disabled={gogoDisabled}
        on:click={() => gogoFilter('retex')}>Lancer la recherche
      </button>
    </p>

  </Tab>
  
  <Tab label="SAVOIR-FAIRE">
    
    <div class="themed">
    <h4 class="firsth4">Certifications</h4>
      <Select 
      items={filtres.savoirfaire.certifs.data} isMulti={true} placeholder={'Choisir...'}
      bind:selectedValue={filtres.savoirfaire.certifs._selectedData}></Select>

    <h4>Compétences sectorielles</h4>
      <Select 
      items={filtres.savoirfaire.sectorielles.data} isMulti={true} placeholder={'Choisir...'}
      bind:selectedValue={filtres.savoirfaire.sectorielles._selectedData}></Select>

    <h4>Compétences transverses</h4>
      <Select 
      items={filtres.savoirfaire.transverses.data} isMulti={true} placeholder={'Choisir...'}
      bind:selectedValue={filtres.savoirfaire.transverses._selectedData}></Select>
    </div>

    <h4>Rechercher dans les faits marquants</h4>
    <div class="field">
        <div class="control has-icons-left has-icons-right">
        <input  on:input={() => checkInput(filtres.savoirfaire.dossiers)} on:blur={() => checkInput(filtres.savoirfaire.dossiers)}
                bind:value={filtres.savoirfaire.dossiers._selectedData} 
                class="input" class:is-danger={filtres.savoirfaire.dossiers.hasInputError} type="search" placeholder="Saisir un ou des mots-clé séparés par une virgule">
              <span class="icon is-small is-left"><i class="fas fa-search"></i></span>
        </div>
        {#if filtres.savoirfaire.dossiers.hasInputError} <p class="help is-danger">{filtres.savoirfaire.dossiers.inputErrorMsg}</p>{/if}
    </div>

    <h4>Rechercher dans les formations</h4>
    <div class="field">
        <div class="control has-icons-left has-icons-right">
        <input  on:input={() => checkInput(filtres.savoirfaire.formation)} on:blur={() => checkInput(filtres.savoirfaire.formation)} 
                bind:value={filtres.savoirfaire.formation._selectedData} class="input" class:is-danger={filtres.savoirfaire.formation.hasInputError} type="search" placeholder="Saisir un ou des mots-clé séparés par une virgule">
              <span class="icon is-small is-left"><i class="fas fa-search"></i></span>
        </div>
        {#if filtres.savoirfaire.formation.hasInputError} <p class="help is-danger">{filtres.savoirfaire.formation.inputErrorMsg}</p>{/if}
    </div>

    <p class="control" style="text-align:center;">
      
      <button class="button is-warning" class:is-loading={searchHasBegun} style="padding-left:2em;padding-right:2em;" type="submit" disabled={gogoDisabled}
        on:click={() => gogoFilter('savoirfaire')}>Lancer la recherche
      </button>
    </p>
  </Tab>


  <Tab label="COMPETENCES">

    <div class="themed">

      <h4 class="firsth4">Région</h4>
        <Select 
        items={filtres.experts.region.data} isMulti={true} placeholder={'Choisir...'}
        bind:selectedValue={filtres.experts.region._selectedData}></Select>

    </div>
    
    <div class="columns">

      <div class="column is-one third">
      
        <h4>Département</h4>    
        <div class="field">
          <p class="control has-icons-left has-icons-right">
            <input on:input={() => checkInput(filtres.experts.departement)} 
            bind:value={filtres.experts.departement._selectedData} class="input" type="text" placeholder="Saisissez un ou plusieurs départements séparés par des virgules">
              <span class="icon is-small is-left"><i class="fas fa-search"></i></span>
            
            {#if filtres.experts.departement.hasInputError ===true}
              <span class="icon is-small is-right"><i class ="fas fa-exclamation-triangle"></i></span>
            {:else if filtres.experts.departement.hasInputError ===false}
              <span class="icon is-small is-right"><i class="fas fa-check"></i></span>
            {/if}
          </p>
        </div>
      </div>

      <div class="column is-one third">
        <h4>Code DARVA</h4>
        <div class="field">
          <p class="control has-icons-left has-icons-right">
            <input on:input={() => checkInput(filtres.experts.darva)}
            bind:value={filtres.experts.darva._selectedData} class="input" type="text" placeholder="Saisir le code">
              <span class="icon is-small is-left"><i class="fas fa-search"></i></span>
            {#if filtres.experts.darva.hasInputError ===true}
              <span class="icon is-small is-right"><i class ="fas fa-exclamation-triangle"></i></span>
            {:else if filtres.experts.darva.hasInputError ===false}
              <span class="icon is-small is-right"><i class="fas fa-check"></i></span>
            {/if}
          </p>
        </div>
      </div>

      <div class="column is-one third">
        <h4>Code GECOR</h4>
        <div class="field">
          <p class="control has-icons-left has-icons-right">
            <input on:input={() => checkInput(filtres.experts.gecor)}
            bind:value={filtres.experts.gecor._selectedData} class="input" type="text" placeholder="Saisir le code">
              <span class="icon is-small is-left"><i class="fas fa-search"></i></span>
            {#if filtres.experts.gecor.hasInputError ===true}
              <span class="icon is-small is-right"><i class ="fas fa-exclamation-triangle"></i></span>
            {:else if filtres.experts.gecor.hasInputError ===false}
              <span class="icon is-small is-right"><i class="fas fa-check"></i></span>
            {/if}
          </p>
        </div>
      </div>

    </div>
    
    <div class="themed">

      <h4 class="firsth4">Domaine d'intervention</h4>
        <Select isMulti={true}
        items={filtres.experts.domaines.data} placeholder={'Choisir...'}
        bind:selectedValue={filtres.experts.domaines._selectedData}></Select>
      
      <h4>Electricité</h4>
        <Select isMulti={true}
        items={filtres.experts.electricite.data} placeholder={'Choisir...'}
        bind:selectedValue={filtres.experts.electricite._selectedData}></Select>

      <h4>Vol</h4>
        <Select isMulti={true}
        items={filtres.experts.vol.data} placeholder={'Choisir...'}
        bind:selectedValue={filtres.experts.vol._selectedData}></Select>

      <h4>Autres</h4>
        <Select isMulti={true}
        items={filtres.experts.autres.data} placeholder={'Choisir...'}
        bind:selectedValue={filtres.experts.autres._selectedData}></Select>
      
    </div>

     <p class="control" style="text-align:center;margin-top:1em;">
      
      <button class="button is-warning" class:is-loading={searchHasBegun} style="padding-left:2em;padding-right:2em;" disabled={gogoDisabled}
        on:click={() => gogoFilter('experts')}>Lancer la recherche
      </button>
    </p>

  </Tab>
  <Tab label="Options" icon="cog">
    <h4>Sélection des résultats : </h4>
    <Field expanded size="is-large">
      <div class="fieldwrapper">
        <input class="is-checkradio" type="radio" name="isOr" id="isOr" bind:group={$options.isOr} value={true}>
        <label for="isOr">Au moins un des filtres doit correspondre</label>	
        <input class="is-checkradio" type="radio" name="isAnd" id="isAnd" bind:group={$options.isOr} value={false}>
        <label for="isAnd">Tous les filtres doivent correspondre</label>			
      </div>
    </Field>

    <p class="control" style="text-align:center;margin-top:1em;">
      <button class="button is-warning" style="padding-left:2em;padding-right:2em;"
        on:click={() => showNotification("Options sauvegardées", { type: 'is-success', position: 'is-bottom-right', icon: true }) }
        >Valider
      </button>
    </p>
  </Tab>

</Tabs>

<style>
:global(.modal-card-body) {
  height:82vh;
}
:global(.tabs-wrapper .tab-content) {
  overflow:visible!important;
}

:global(a:hover) {
  text-decoration : none;
}

.help.is-danger {
  position:relative!important;
  top:0em;
  left:0em;
}

.icon {
  z-index:0!important;
}

.control input {
  border: solid 1px var(--main-color);
}

.themed {
  --borderRadius:0px;
  --borderFocusColor:var(--main-color);
  --itemFirstBorderRadius:0px;
  --listBorderRadius:0px;
  --multiClearRadius:0px;
  --multiItemBorderRadius:0px;
  --multiItemActiveBG:var(--main-color);
  --multiSelectPadding:0px 35px 5px 16px;
}

:global(.multiSelectItem_label) {
  font-size:14px;
  overflow:auto;
}

h4:not(.firsth4) {
  margin-top:1em;
}
h4 {
  margin-bottom:0.5em;
}

@media only screen and (max-width: 1024px) {
  :global(.modal-card) {
    width:96vw!important;
  }
}

</style>
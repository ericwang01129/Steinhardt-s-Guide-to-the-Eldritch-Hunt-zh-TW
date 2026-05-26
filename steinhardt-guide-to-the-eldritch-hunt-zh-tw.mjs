/* named export for internal use */
class Util {
  static DATA = {
    ID: "steinhardt-guide-to-the-eldritch-hunt-zh-tw",
    get PATH() {
      return `modules/${this.ID}/`;
    },
    get STATIC() {
      return this.PATH + 'static/'
    },
    get ASSETS() {
      return this.STATIC + 'assets/'
    },
    get TEMPLATES() {
      return this.STATIC + 'templates/'
    },
  };

  /**
   * Helper function for reading back values in the CONFIG object
   *
   * @param {String} dataPath dot-notation path pointing to the data inside desired config object.
   * @param {boolean} [sh5e=true] Read Superheroic 5e config. False reads from dnd5e config.
   */
  static config(dataPath, sgeh = true) {
    return game.sgeh.config.get(sgeh ? "SGEH" : "DND5E", dataPath);
  }

  static #flagData(key) {
    const flagConfig = Util.config("flags");
    const flagData = foundry.utils.getProperty(flagConfig, key);
    if (!flagData) {
      throw new Error('Cannot locate flag configuration via key "' + key + '"');
    }

    flagData.scope ??= 'steinhardt-guide-to-the-eldritch-hunt-zh-tw';

    return flagData;
  }

  static getFlag(doc, key, asData = false) {
    const flagData = Util.#flagData(key);
    let current = asData ? foundry.utils.getProperty(doc, `flags.${flagData.scope}.${flagData.key}`) : doc.getFlag(flagData.scope, flagData.key);

    if (flagData.sparse && !!current)
      foundry.utils.mergeObject(current, flagData.def, {
        overwrite: false,
      });

    return current ?? flagData.def;
  }

  /**
   *
   * @returns {Object|Promise<Object>}
   */
  static setFlag(doc, key, value, asData = false) {
    const flagData = Util.#flagData(key);
    
    if(asData || !doc.setFlag) {
      const newFlags = {flags: {[flagData.scope]: {[flagData.key]: value}}};
      return foundry.utils.mergeObject(doc, newFlags);
    }

    return doc.setFlag(flagData.scope, flagData.key, value);
  }

  static flagPath(key) {
    const flagData = Util.#flagData(key);
    if (!flagData) {
      console.error('Cannot locate flag configuration via key "' + key + '"');
      return;
    }

    return `flags.${flagData.scope}.${key}`;
  }

  static flagDefault(key) {
    const flagData = Util.config("flags")[key];
    if (!flagData) {
      console.error('Cannot locate flag configuration via key "' + key + '"');
      return;
    }

    if (flagData.def !== null) {
      return flagData.def;
    }

    console.error(`No default flag value found for ${key}`);
    return null;
  }
  
  /**
   *
   * Helper function for localizing strings inside the sgeh namespace
   * @param {string} moduleSpaceKey i18n key without the leading module ID
   *
   * @example
   * ```js
   * const local = Util.localize('sheet.property');
   * const direct = game.i18n.localize('SGEH.sheet.property');
   * console.log(local === direct); //true
   * ```
   */
  static localize(moduleSpaceKey, i18nData = {}, namespace = 'SGEH') {
    return game.i18n.format(`${namespace}.${moduleSpaceKey}`, i18nData);
  }

  static settings = {
    get: function (key, scope = Util.DATA.ID) {
      return game.settings.get(scope, key);
    },
    set: function (key, value, scope = Util.DATA.ID) {
      return game.settings.set(scope, key, value);
    },
  };

  static applySettings(settingsData) {
    Object.entries(settingsData).forEach(([key, data]) => {
      game.settings.register(Util.DATA.ID, key, {
        name: Util.localize(`setting.${key}.name`),
        hint: Util.localize(`setting.${key}.hint`),
        ...data,
      });
    });
  }

  static notify(type, i18nKey, i18nData) {
    const msg = Util.localize(i18nKey, i18nData);
    ui.notifications[type](msg);
  }

  static async registerTemplates(templatePaths) {
    const paths = {};
    for ( const path of templatePaths ) {
      paths[path.replace(".hbs", ".html")] = path;
      paths[`steinhardt-guide-to-the-eldritch-hunt-zh-tw.${path.split("/").pop().replace(".hbs", "")}`] = path;
    }

    return await loadTemplates(paths)
  }

  static makeReadOnly = (obj, allowInsertion = false) => new Proxy(obj, {
    get: function(target, property) {
      return target[property];
    },
    set: function(target, property, value) {
      if (property in target) return target[property];

      if (allowInsertion) return target[property] = value;

      return undefined;
    }
  })
}

class Config {
  /**
   * @returns {Promise<any>}
   */
  static registerTemplates(paths) {
    return loadTemplates(paths);
  }

  constructor() {
    this.#setConfig();
  }

  #setConfig() {
    globalThis.CONFIG.SGEH = {};

    /* config values here */
    this.add('DND5E','itemProperties', {
      art: {label: "SGEH.property.wep.art"},
      rlf: {label: "SGEH.property.wep.rlf"},
      rls: {label: "SGEH.property.wep.rls"},
      blr: {label: "SGEH.property.wep.blr"},
      boo: {label: "SGEH.property.wep.boo"},
      cnc: {label: "SGEH.property.wep.cnc"},
      spr: {label: "SGEH.property.wep.spr"},
      sdy: {label: "SGEH.property.wep.sdy"},
    });

    this.set('DND5E', 'validProperties.weapon', 'art', 'rlf', 'rls', 'blr', 'boo', 'cnc', 'spr', 'sdy');

    this.add('DND5E', 'featureTypes', {class: {
      subtypes: {
        'bloodShot': 'SGEH.feature.bloodShot',
        'eldMelody': 'SGEH.feature.eldMelody',
        'moonCond': 'SGEH.feature.moonCond',
        'tortTech': 'SGEH.feature.tortTech',
        'divineBlessing': 'SGEH.feature.divineBlessing',
        'focusArt': 'SGEH.feature.focusArt',
        'finisher': 'SGEH.feature.finisher',
      }
    }});

    this.add('DND5E', 'toolIds', {torturer: 'Compendium.steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-items.Item.g2zoaaRK1OaSDEVN'});
    
    this.add('DND5E', 'sourceBooks', {"SGEH": "SGEH.book.title"});

    const fontPath = Util.DATA.STATIC + 'fonts/' ;
    this.add('fontDefinitions','Allrounder Monument', {
      editor: true,
      fonts: [{
        urls: [fontPath + 'allrounder-monument-medium.otf'],
        stretch: '80%',
        weight: 'bold',
      },{
        urls: [fontPath + 'allrounder-monument-regular.otf'],
      }],
    });

    this.add('fontDefinitions','Gilda', {
      editor: true,
      fonts: [{
        urls: [fontPath + 'gilda.ttf']
      }],
    });

    this.add('fontDefinitions','Average', {
      editor: true,
      fonts: [{
        urls: [fontPath + 'average-regular.ttf']
      }],
    });

    this.add('fontDefinitions','Granville', {
      editor: true,
      fonts: [{
        urls: [fontPath + 'granville-regular.otf'],
      },{
        urls: [fontPath + 'granville-italic.otf'],
        style: 'italic',
      },{
        urls: [fontPath + 'granville-bold.otf'],
        weight: 'bold',
      },{
        urls: [fontPath + 'granville-bold-italic.otf'],
        weight: 'bold',
        style: 'italic',
      }],
    });

    this.add('fontDefinitions','OptimusPrinceps', {
      editor: true,
      fonts: [{
        urls: [fontPath + 'optimus-princeps.ttf'],
      },{
        urls: [fontPath + 'optimus-princeps-semibold.ttf'],
        weight: 600,
      }],
    });

    Hooks.on('setup', () => {
      this.add('DND5E', 'weaponIds', {
        cleaver:"steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-items.Pf8rPk1uS2lxq9bF",
        scythe:"steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-items.uNXIB8xR6NIm53Rr",
        blunderbuss:'steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-items.L4Xm0AekSgsv8QB5',
        cannon: 'steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-items.zJukI9uWn0ckfn7l',
        flintlock: 'steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-items.DEH8AXlWgL7rLyQK',
        pistol: 'steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-items.gIPccLky5NLrxFSC',
        rifle: 'steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-items.tbe1SXzQre0u1lWx',
      });
    });

  }

  registerFlag(key, {def = null, sparse = false, scope='steinhardt-guide-to-the-eldritch-hunt-zh-tw'} = {} ) {
    const flagData = {[key]: {key, def, sparse, scope}};
    this.add('SGEH', 'flags', flagData);
    return this;
  }
    
  add(scope, key, data) {
    foundry.utils.mergeObject(globalThis.CONFIG[scope], { [key]: data });
    return this;
  }

  get(scope, dataPath) {
    return foundry.utils.getProperty(globalThis.CONFIG[scope], dataPath);
  }

  set(scope, path, ...elements) {
    const configSet = this.get(scope, path);
    elements.forEach(e => configSet.add(e));
    return this;
  }

  push(path, elements, scope = 'sgeh') {
    switch(scope) {
      case 'root':
        foundry.utils.getProperty(globalThis.CONFIG, path).push(...elements);
        break;
      default:
        Util.config(path, scope == 'sgeh').push(...elements);
        break;
    }

    return this;
  }
}

var core = () => {
  game.sgeh ??= {};
  game.sgeh.config = new Config();
};

const imageSidePanel = Handlebars.compile(`
<aside class="sidebar flexcol art-sidebar" style="flex:{{size}}">
  <output name="artpanel"></output>
  <div class="notification panel-tip" hidden>{{{localize 'SGEH.journal.panelTip'}}}</div>
  <div class="controls">
    <button class="cycle-action" data-action="art-size-delta" data-increment="-0.1">
    <i class="fa-solid fa-minus"></i>
  </button>
  <button class="cycle-action" data-action="art-size-delta" data-increment="+0.1">
    <i class="fa-solid fa-plus"></i>
  </button>

  </div>
  <div class="controls">
  <button class="cycle-action" data-action="art-prev">
    <i class="fa-solid fa-chevron-left"></i>
  </button>
  <button class="cycle-action" data-action="art-next">
    <i class="fa-solid fa-chevron-right"></i>
  </button>
  </div>
</aside>
`);


class SGEHJournal extends JournalSheet {

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.classes.push(Util.DATA.ID);
    return options;
  }

  constructor(object, options = {}) {
    options.artSize ??= Util.getFlag(object, 'defaultArtFlex');
    super(object, options);
  }

  async _renderInner(data) {
    const html = await super._renderInner(data);
    const panel = imageSidePanel({size: this.options.artSize });
    html[0].insertAdjacentHTML('beforeend', panel);
    return html;
  }

  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    if (this.object.isOwner && this.isEditable) {
      buttons.unshift({
        label: Util.localize('journal.artConfig'),
        class: "steinhardt-guide-to-the-eldritch-hunt-zh-tw-art-config",
        icon: "fas fa-images",
        onclick: ev => this._onConfig(ev),
      });
    }

    return buttons;
  }

  #artObserver;
  #artStack = [{}, {}, {}, {}, {}];
  #artSlot;

  get cardStack() {
    return this.#artSlot.querySelector('.card-list');
  }

  set showPanelTip(bool) {
    this.element[0].querySelector('.art-sidebar .panel-tip').hidden = !bool;
  }

  _observeHeadings() {
    super._observeHeadings();
    const html = this.element;
    this.#artSlot = html[0].getElementsByTagName('output')['artpanel'];
    this._rebuildArtPanel();
    this.#artObserver = new IntersectionObserver( (entries, observer) => {
      this._handleArtScroll(entries, observer);
    }, {
      root: html.find('.journal-entry-pages .scrollable')[0], 
      threshold: 0.2,
    });

    html.find('.journal-entry-page [data-bkit-asset]').each((_, el) => this.#artObserver.observe(el));

    this.showPanelTip = true;
  }

  

  #handleArtEnter(intersectionEntries) {

    this.#artStack.forEach( stack => {
      stack.target?.classList.remove('active-art');
    });

    const newHTML = intersectionEntries.reduce( (acc, entry) => {
      const id = entry.target.dataset.bkitId;
      const path = Util.DATA.ASSETS + (entry.target.dataset.bkitAsset ?? 'cover.webp');
      this.#artStack.push({id, path, target: entry.target});
      return acc + `<li class="card artwork"><img id="${id}" src=${path}></li>`;
    }, '');

    /* remove N oldest entries in the list */
    const cardList = this.#artSlot.querySelector('.card-list');
    const cards = cardList.children;
    let overflow = cards.length + intersectionEntries.length - 5;
    while(overflow > 0) {
      const anchor = cardList.firstElementChild.id;
      if (anchor) {
        this.element[0].querySelector(`[data-bkit-id="${anchor}"]`)?.classList.remove('active-art');
      }
      cardList.firstElementChild.remove();
      overflow--;
    }

    cardList.insertAdjacentHTML('beforeend', newHTML);
    this.#artStack.at(-1)?.target?.classList.add('active-art');
    this.#artStack = this.#artStack.slice(-5);
  }

  _handleArtScroll(entries, observer) {
    if ( !entries.length ) return;

    /* This has been triggered by an old 
     * IntersectionObserver from the previous
     * render and is no longer relevant.
     */
    if ( observer !== this.#artObserver ) return;

    const {entering, leaving} = entries.filter(entry => !!entry.target.dataset?.bkitId).reduce( (acc, entry) => {
      const group = (entry.isIntersecting && entry.intersectionRatio >= 0.2) ? acc.entering : acc.leaving;
      group.push(entry);
      return acc;
    },{entering:[], leaving:[]});

    this.#handleArtEnter(entering);
  }

  _onConfig(ev) {
    const content = `
    <input type="range" value="${Util.getFlag(this.object, 'defaultArtFlex')}" name="enabled" list="markers" min="0" max="1" step="0.1">
    <datalist data-tooltip="${Util.localize('journal.configTip')}" class="range-label" id="markers">
    <option label="0"></option>
    <option label="0.1"></option>
    <option label="0.2"></option>
    <option label="0.3"></option>
    <option label="0.4"></option>
    <option label="0.5"></option>
    <option label="0.6"></option>
    <option label="0.7"></option>
    <option label="0.8"></option>
    <option label="0.9"></option>
    <option label="1.0"></option>
    </datalist>
    `;
    Dialog.prompt({
      content,
      title: Util.localize('journal.artConfigTitle'),
      options: {
        classes:['dialog','steinhardt-guide-to-the-eldritch-hunt-zh-tw'],
        width:300,
      },
      callback: (html) => {
        const range = html[0].querySelector('input')?.value;
        if (!!range) {
          this.options.artSize = range;
          const sidebar = this.#artSlot.closest('.art-sidebar');
          sidebar.style.flexGrow = this.options.artSize;
          Util.setFlag(this.object, 'defaultArtFlex', range);
        }
      }
    });
  }

  _onAction(event) {
    super._onAction(event);
    const button = event.currentTarget;
    const action = button.dataset.action; 

    switch (action) {
      case 'art-prev':
        this.showPanelTip = false;
        return this.prevArt();
      case 'art-next':
        this.showPanelTip = false;
        return this.nextArt();
      case 'art-size': {
        this.showPanelTip = false;
        const newFlex = button.dataset.size;
        this.#artSlot.closest('.art-sidebar').style.flex = newFlex;
        this.options.artSize = newFlex;
        return;
      }
      case 'art-size-delta': {
        this.showPanelTip = false;
        const delta = button.dataset.increment ?? "0";
        const offset = Number(delta);
        const sidebar = this.#artSlot.closest('.art-sidebar');
        const currentFlex = Number(sidebar.style.flexGrow);
        
        this.options.artSize = `${Math.clamped(currentFlex + offset, 0.1, 1)}`;
        sidebar.style.flexGrow = this.options.artSize;
        return;
      }
    }

  }

  #swapFront = (newFront, newBack) => {
      const list = newFront?.parentNode;
      if (!list) return;
      const currentBack = list.firstElementChild;
      list.insertBefore(newBack, currentBack);
      list.appendChild(newFront);
      newFront.classList.remove('transformFront');
      newBack.classList.remove('transformBack');
  }

  #pullFront = (newFront) => {
      const list = newFront?.parentNode;
      if (!list) return;
      list.append(newFront);
      newFront.classList.remove('pullFront');
  }

  nextArt() {
    if (this.cardStack.childElementCount < 2) return;

    const topCard = this.cardStack.lastElementChild;
    topCard.classList.add('transformBack');
    topCard.previousElementSibling.classList.add('transformFront');

    const topData = this.#artStack.pop();
    topData?.target?.classList.remove('active-art');
    this.#artStack.unshift(topData);
    this.#artStack.at(-1)?.target?.classList.add('active-art');

    setTimeout( () => this.#swapFront(topCard.previousElementSibling, topCard), 500);
  }

  prevArt() {

    if (this.cardStack.childElementCount < 2) return;

    const backCard = this.cardStack.firstElementChild;
    backCard.classList.add('pullFront');

    this.#artStack.at(-1)?.target?.classList.remove('active-art');
    const backData = this.#artStack.shift();
    backData?.target?.classList.add('active-art');
    this.#artStack.push(backData);
    setTimeout( () => this.#pullFront(backCard), 500);

  }

  _rebuildArtPanel() {
    const inner = this.#artStack.reduce( (acc, curr) => {
      return acc + `<li class="card artwork"><img id="${curr.id}" src="${curr.path ?? Util.DATA.ASSETS + 'cover.webp'}"></li>`;
    },'');

    const outer = `
    <div class="card-stack">
      <ul class="card-list scrollable">
        ${inner}
      </ul>
    </div>`;

    this.#artSlot.innerHTML = outer;
  }
}

var journal = () => {
  Journal.registerSheet(Util.DATA.ID, SGEHJournal, {
    makeDefault: false,
    label: 'SGEH.journal.label'
  });

  game.sgeh.config.registerFlag('defaultArtFlex', {def: "0.5"});

};

var armor = () => {
  game.sgeh.config.add('DND5E', 'armorClasses', {
    'awakened': {
      label: 'SGEH.property.awakenedAC',
      formula: '11 + @abilities.dex.mod + @abilities.con.mod'
    },
    'momentum': {
      label: 'SGEH.property.momentumAC',
      formula: '@attributes.ac.armor + min(2, @abilities.con.mod)'
    }
  });
};

const fields = foundry.data.fields;
const models = dnd5e.dataModels.item;
const dndfields = dnd5e.dataModels.fields;

//class TrickFormData extends fields.ObjectField {
class TrickFormData extends fields.ObjectField {
  constructor(options = {}) {
    super(options);
  }

  static get implementation() {
    return TrickForm;
  }

  get implementation() {
    return this.constructor.implementation;
  }

  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {required:true});
  }

  /**
   * Get the defaults object for the specified field as defined in metadata.
   * @returns {object}
   */
  getDefaults() {
    return {};
  }

  /** @inheritdoc */
  _cleanType(value, options) {
    if ( !(typeof value === "object") ) value = {};

    if ( value instanceof this.implementation ) return this.implementation.cleanData(value, options);
    if ( options.partial ) return value;

    // Use the defined defaults
    const defaults = this.getDefaults();
    return foundry.utils.mergeObject(defaults, value, {inplace: false});
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  initialize(value, model, options={}) {
    const cls = this.implementation;
    if ( cls && !foundry.utils.isEmpty(value) ) return new cls(value, {parent: model.parent.parent, trickParent: model.parent, ...options});
    return foundry.utils.deepClone(value);
  }
}

//class TrickFormCollection extends fields.ArrayField {
class TrickFormCollection extends dndfields.MappingField {
  
  clean(value, options) {
    if(foundry.utils.getType(value) == 'Array') value = value.reduce( (acc, v) => { acc[v._id] = v; return acc; }, {} );
    return super.clean(value,options);
  }
}

class TrickStateCollection extends dndfields.MappingField {

}

class TrickComponents extends fields.SetField {
  //TODO enforce ID only? how do 
}

class TrickStateData extends fields.ObjectField {

  _cast(value) {
    value?.components?.forEach( (comp, idx) => {
      if( typeof comp !== 'string' ) value.components[idx] = comp._id;
    });
    return super._cast(value);
  }

  clean(value, options) {
    if (options.partial) return value ?? {}
    value.components ??= [];
    const forms = !!options.source.system ? options.source.system.forms : options.source.forms;
    value.components = value.components.filter( comp => comp in forms );
    return super.clean(value, options);
  }

  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      label: new fields.StringField({required: true, initial: "SGEH.sheet.trick.state.defaultLabel", label: "SGEH.sheet.trick.state.label"}),
      components: new TrickComponents(new fields.ForeignDocumentField(dnd5e.documents.Item5e, {idOnly:true}), {idOnly:true})
    });
  }

}


/** Most similar to 'weapon' type */
class TrickWeaponData extends models.WeaponData
{
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      states: new TrickStateCollection(new TrickStateData()),
      forms: new TrickFormCollection(new TrickFormData()),
    });
  }

  prepareDerivedData() {
    this.deriveProficiency(); 
    Object.values(this.forms).forEach( form => form.prepareData() );
    super.prepareDerivedData();
  }

  /* Trick weapons are never mountable */
  get isMountable() {
    return false;
  }

  /**
   * Trick weapons shouldn't be used to make attacks directly,
   * but homebrew be homebrew -- assume proficient.
   * @inheritdoc
   * @override
   */
  _configure(options={}) {
    super._configure(options);
    this._source.proficient ??= 1;
  }

  /** 
   * parent class wont prepare prof for subtypes, do it explicitly
   */
  deriveProficiency() {
    const prof = foundry.utils.getProperty(this.parent.actor ?? {}, 'system.attributes.prof') ?? 0;
    const mult = this.proficiencyMultiplier ?? 0;
    this.prof = new game.dnd5e.documents.Proficiency(prof, mult);
  }
}

class TrickForm extends dnd5e.documents.Item5e {

  constructor(data, options) {
    super(data, options);
    this._trickParent = options.trickParent;
  }

  get trickParent() {
    return this._trickParent
  }

  get sheet() {
    if ( !this._sheet ) {
      const cls = this._getSheetClass();
      if ( !cls ) return null;
      this._sheet = new cls(this, {editable: false, submitOnClose:false});
    }
    return this._sheet;
  }

  async delete() {
    return await this.trickParent.update({[`system.forms.-=${this.id}`]: null});
  }

  async update(formData) {
    const ret = await this.trickParent.update({'system.forms': {[this.id]: foundry.utils.expandObject(formData)}});
    return ret;
  }
  
}

const trickPartial = Handlebars.compile(`
<div class="sgeh-action steinhardt-guide-to-the-eldritch-hunt-zh-tw sgeh-feedback">
  <h4 class="header">{{localize 'SGEH.chat.trick.transform'}}</h4>
  {{#each states}}
    <button data-state-id="{{this.id}}">{{this.label}}</button>
  {{/each}}
</div>
`);

const ItemSheet = dnd5e.applications.item.ItemSheet5e;

Handlebars.registerHelper("sgeh-formName", function(formId, formCollection) {
  return formCollection[formId]?.name ?? '**ERROR**';
});

const stateMethods = {
  'swapState': (target) => {
    return async (id) => {

      if (!target.isOwned) {
        return Util.notify('error','error.unownedTrick');
      }

      const states = Object.keys(target.system.states);
      const deactivate = states.filter( stateId => stateId !== id );

      for( const toDeact of deactivate) {
        await stateMethods.deactivateState(target)(toDeact);
      }

      return await stateMethods.activateState(target)(id);
    }
  },
  'activateState': (target) => {
    return async (id) => {
      if (!target.isOwned) {
        return Util.notify('error','error.unownedTrick');
      }
      const state = target.system.states[id];

      /* do not create any currently on the actor */
      const components = state.components.filter( id => !target.parent.items.has(id) );
      const createData = components.map( formId => target.system.forms[formId].toObject() );

      const ret = await target.parent.createEmbeddedDocuments('Item', createData, {keepId: true, keepEmbeddedIds: true});
      const data = {item: target.name, state: state.label};
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor: target.parent}),
        content: `<div class="steinhardt-guide-to-the-eldritch-hunt-zh-tw sgeh-feedback"><p>${Util.localize('chat.trick.activated',data)}</p></div>`
      });

      return ret;
    }
  },
  'deactivateState': (target) => {
    return async (id) => {
      if (!target.isOwned) {
        return Util.notify('error','error.unownedTrick');
      }

      const state = target.system.states[id];

      /* get existing components of this state */
      const components = state.components.filter( id => target.parent.items.has(id) );

      /* update internal data to reflect current state and any changes to the item */
      const formUpdate = components.reduce( (acc, id) => {
        acc[id] = target.parent.items.get(id).toObject();
        return acc;
      }, {});

      /* update self, then delete the items we 'repacked' */
      const ret = await target.update({'system.forms': formUpdate});
      await target.parent.deleteEmbeddedDocuments('Item', components);
      return ret;
    }
  },
};

const trickProxy = {
  get: function(target, prop) {
    if (prop in stateMethods) return stateMethods[prop](target);
    return target[prop];
  }
};


class TrickSheet extends ItemSheet {

  static trickProxy(item) {
    return new Proxy(item, trickProxy);
  }
  
  static get defaultOptions() {
    const options = ItemSheet.defaultOptions;
    options.dragDrop.push({dropSelector: ".trick-form-drop"});
    options.classes.push('steinhardt-guide-to-the-eldritch-hunt-zh-tw');
    return options;
  }

  static _handleTrickClick(evt, actor) {
    evt.preventDefault();
    if (evt.button > 0) return;
    const action = evt.target.closest('[data-action]')?.dataset.action;
    const itemId = evt.target.closest('[data-item-id]')?.dataset.itemId;

    if (!itemId && action !== 'create') return;
    const item = actor.items.get(itemId);

    switch(action) {
      case 'roll':
        return item.use();
      case 'edit':
        return item.sheet.render(true);
      case 'delete':
        return item.deleteDialog();
      case 'create':
        return Item.implementation.create({name: Util.localize('sheet.trick.defaultName'), type: 'steinhardt-guide-to-the-eldritch-hunt-zh-tw.trickwep'}, {parent: actor})
    }
  }

  static async _handleChatClick(event) {
    event.preventDefault();
    const messageId = event.target.closest('[data-message-id]')?.dataset.messageId;
    const stateId = event.target.closest('[data-state-id]')?.dataset.stateId;
    const msg = game.messages.get(messageId);
    if(!msg || !stateId) return;

    const {itemUuid = null} = msg.getFlag('dnd5e','use');
    if (!itemUuid) return;

    const item = await fromUuid(itemUuid);

    const trickItem = TrickSheet.trickProxy(item);
    return await trickItem.swapState(stateId);
  }

  get template() {
    return Util.DATA.TEMPLATES + 'trickwep.hbs'
  }

  #proxy = null;

  get proxy() {
    if (!this.#proxy) this.#proxy = TrickSheet.trickProxy(this.object);
    return this.#proxy;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if(this.isEditable) {
      html.find('.trick-state-control').click( this._onTrickStateControl.bind(this) );
    }

    html.find('.trick-form-control').click( this._onTrickFormControl.bind(this) );
  }

  /**
   * Event Handlers *
   */
  _onTrickFormControl(event) {
    const formId = event.currentTarget.dataset?.formId;
    if (formId) {
      event.preventDefault();
      this.object.system.forms[formId]?.sheet.render(true, {editable:event.shiftKey && this.isEditable});
    }
  }

  _onTrickStateControl(event) {
    const a = event.currentTarget;
    const stateId = a.closest("[data-state-id]")?.dataset.stateId;
    if (!stateId && a.dataset.action !== 'create') return;
    event.preventDefault();
    switch ( a.dataset.action ) {
      case "create":
        return this.object.update({'system.states': {[foundry.utils.randomID()]: {label: Util.localize('sheet.trick.createForm')}}});
      case "activate":
        return this.proxy.activateState(stateId);
      case "deactivate":
        return this.proxy.deactivateState(stateId);
      case "delete":
        return this.object.update({[`system.states.-=${stateId}`]:null});
    }
  }

  _onDrop(event) {
    if ( !event.currentTarget.dataset?.stateId ) return super._onDrop(event);
    event.preventDefault();
    const targetState = event.currentTarget.dataset.stateId;

    const dropData = TextEditor.getDragEventData(event);

    if (dropData.type !== 'Item') {
      ui.notifications.error(Util.localize('sheet.trick.error.onlyItems'));
      return;
    }

    {
      /* need to create the local form data */
      return (async ()=> {
        const source = await fromUuid(dropData.uuid);
        const form = source.toObject();
        foundry.utils.mergeObject(form, {
          _id: foundry.utils.randomID(),
          flags: { core: { sourceId: dropData.uuid } }
        });
        
        const state = this.object.system.states[targetState];
        const update = {
          system: {
            forms: {
              [form._id]: form,
            },
            states: {
              [targetState]: {
                label: state.label,
                components: [...(state.components ?? []), form._id]
              }
            }
          }
        };

        return await this.object.update(update);
      })();
    }
  }


}

const sheetInjections$1 = () => {
  
  Hooks.on('renderActorSheet', (app, html, data) => {

    if ( !data.isCharacter && !data.isNPC ) return;

    const trickWeps = app.actor.itemTypes['steinhardt-guide-to-the-eldritch-hunt-zh-tw.trickwep'];
    if(trickWeps.length == 0) return;

    let pane = html[0].querySelector('.inventory dnd5e-inventory .containers'); 
    let dragSelector = '.container.steinhardt-guide-to-the-eldritch-hunt-zh-tw'; 

    let trickHTML = '';
    /* grabbed the new containers */
    if (pane) {
      trickHTML = trickWeps.reduce( (acc, curr) => acc + `
<li class="container steinhardt-guide-to-the-eldritch-hunt-zh-tw" data-item-id="${curr.id }" draggable="true">
  <a class="item-action" data-action="roll" 
   data-tooltip="${ curr.name }" aria-label="${ name }">
      <img src="${ curr.img }" alt="${ curr.name }">
  </a>
</li>`, '');

    } else {
      pane = html[0].querySelector('.inventory dnd5e-inventory .items-list .item-list:last-of-type');
      if (!pane) return;

      dragSelector = '.item.steinhardt-guide-to-the-eldritch-hunt-zh-tw';

      trickHTML = trickWeps.reduce( (acc, curr) => acc + `
<li class="item flexrow steinhardt-guide-to-the-eldritch-hunt-zh-tw" data-item-id="${curr.id}" draggable="true">
  <div class="item-name flexrow rollable steinhardt-guide-to-the-eldritch-hunt-zh-tw actor tricks">
    <div class="item-image item-action" data-action="roll"
     style="background-image:url('${curr.img}');aspect-ratio:1;"
     data-tooltip="${ curr.name }" aria-label="${ curr.name }"
    >
    </div>
    <h4 class="item-action" data-action="expand">${curr.name}</h4>
  </div>
</li>`, '');

    }


    pane.insertAdjacentHTML('beforeend', trickHTML);
    
    pane.addEventListener('mouseup', (evt) => TrickSheet._handleTrickClick(evt, app.document) );
    const dragDrop = new DragDrop({dragSelector, dropSelector: null, callbacks: {dragstart: app._onDragStart.bind(app)}});
    dragDrop.bind(pane);

  });

};

function flagTrickCard(item, chatData) {
  const isTrick = item.type == 'steinhardt-guide-to-the-eldritch-hunt-zh-tw.trickwep';
  if (!isTrick) return;

  const stateInfo = Reflect.ownKeys(item.system.states).map( stateId => ({id: stateId, label: item.system.states[stateId].label}));

  Util.setFlag(chatData, 'trickStates', stateInfo, true);
}

function injectTrickStates(msg, roots) {
  if (msg.user.id !== game.user.id) return;

  const states = Util.getFlag(msg, 'trickStates');
  if( states.length > 0 ) {
    const body = roots[0];
    const trickHTML =  trickPartial({states});
    body.insertAdjacentHTML('beforeend', trickHTML);
    body.lastElementChild.addEventListener('mouseup', TrickSheet._handleChatClick); 
  }


}

var build = () => {
  
  game.sgeh.config
    /* chat message flag for transform buttons */
    .registerFlag('trickStates', { def: [] } );

  /* suffering from success...the trick wep full type name gets expanded by mergeObject...
   * Must add this config value directly
   */
  CONFIG.DND5E.defaultArtwork.Item['steinhardt-guide-to-the-eldritch-hunt-zh-tw.trickwep'] = 'icons/svg/eye.svg';


  /* Registering main sheet */
  DocumentSheetConfig.registerSheet(Item, 'steinhardt-guide-to-the-eldritch-hunt-zh-tw', TrickSheet, {
    types: ['steinhardt-guide-to-the-eldritch-hunt-zh-tw.trickwep'],
    label: 'SGEH.sheet.trick.title',
    makeDefault: true,
  });

  DocumentSheetConfig.unregisterSheet(Item, 'dnd5e', ItemSheet, {types: ['steinhardt-guide-to-the-eldritch-hunt-zh-tw.trickwep']});

  sheetInjections$1();

  /**
   * A hook event that fires before an item chat card is created.
   * @param {Item5e} item             Item for which the chat card is being displayed.
   * @param {object} chatData         Data used to create the chat message.
   * @param {ItemUseOptions} options  Options which configure the display of the item chat card.
   */
  Hooks.on("dnd5e.preDisplayCard", flagTrickCard);

  Hooks.on('renderChatMessage', injectTrickStates);

  return Util.registerTemplates([
    Util.DATA.TEMPLATES + 'trickwep.hbs',
  ]);
};

var trick = () => {
  Object.assign(CONFIG.Item.dataModels, {
    'steinhardt-guide-to-the-eldritch-hunt-zh-tw.trickwep': TrickWeaponData
  });

  build();
};

/**
 * [FoundryVTT Type]
 * Configuration data for a damage roll.
 *
 * @typedef {object} DamageRollConfiguration
 *
 * @property {SingleDamageRollConfiguration[]} [rollConfigs=[]]  Separate roll configurations for different damages.
 * @property {string[]} [parts=[]]  The dice roll component parts.
 * @property {object} [data={}]     Data that will be used when parsing this roll.
 * @property {Event} [event]        The triggering event for this roll.
 * @property {boolean} [returnMultiple=false] Should multiple rolls be returned, or only the first?
 *
 * ## Critical Handling
 * @property {boolean} [allowCritical=true]  Is this damage roll allowed to be rolled as critical?
 * @property {boolean} [critical]            Apply critical to this roll (unless overridden by modifier key or dialog)?
 * @property {number} [criticalBonusDice]    A number of bonus damage dice that are added for critical hits.
 * @property {number} [criticalMultiplier]   Multiplier to use when calculating critical damage.
 * @property {boolean} [multiplyNumeric]     Should numeric terms be multiplied when this roll criticals?
 * @property {boolean} [powerfulCritical]    Should the critical dice be maximized rather than rolled?
 * @property {string} [criticalBonusDamage]  An extra damage term that is applied only on a critical hit.
 *
 * ## Roll Configuration Dialog
 * @property {boolean} [fastForward]        Should the roll configuration dialog be skipped?
 * @property {string} [template]            The HTML template used to render the roll configuration dialog.
 * @property {string} [title]               Title of the roll configuration dialog.
 * @property {object} [dialogOptions]       Additional options passed to the roll configuration dialog.
 *
 * ## Chat Message
 * @property {boolean} [chatMessage=true]  Should a chat message be created for this roll?
 * @property {object} [messageData={}]     Additional data which is applied to the created chat message.
 * @property {string} [rollMode]           Value of `CONST.DICE_ROLL_MODES` to apply as default for the chat message.
 * @property {string} [flavor]             Flavor text to use in the created chat message.
 */

/**
 * Configuration data for a single damage roll.
 *
 * @typedef {object} SingleDamageRollConfiguration
 * @property {string[]} parts         The dice roll component parts.
 * @property {string} [type]          Damage type represented by the roll.
 * @property {string[]} [properties]  Physical properties of the damage source (e.g. magical, silvered).
 */

/* TODO well, this exploded -- need to refactor this "common" template */
const buttonPartial = `
<div class="sgeh-action steinhardt-guide-to-the-eldritch-hunt-zh-tw {{#if context.fumble}}disabled{{/if}}" {{#if context.canFan}}data-sgeh-action="fan-damage"{{/if}} {{#if context.jammed}}data-sgeh-action="fix-jam"{{/if}}>
  <button>
  {{#if context.fumble}}
  {{localize "SGEH.chat.weaponJam"}}
  {{/if}}
  {{#if context.canFan}}
  {{localize "SGEH.chat.rollDamage"}}
  {{/if}}
  {{#if context.jammed}}
    {{#if context.noFix}}
    {{localize "SGEH.chat.extensiveRepair"}}
    {{else}}
    {{localize "SGEH.chat.repairJam"}}
    {{/if}}
  {{/if}}
  </button>
</div>
`;

const consumePartial = `
<div class="form-group sgeh-consume steinhardt-guide-to-the-eldritch-hunt-zh-tw">
  {{#each consumeOpts}}
  <label data-tooltip="{{this.tooltip}}" class="checkbox" for="{{this.name}}"><input type="checkbox" {{disabled this.disabled}} {{checked this.checked}} name="{{this.name}}"/>{{this.label}}</label>
  {{/each}}
</div>
`;

const actionTemplate = Handlebars.compile(buttonPartial);
const consumptionTemplate = Handlebars.compile(consumePartial);

var barrels = () => {
  game.sgeh.config
    .add("DND5E", "itemProperties", {
      twb: {label: "SGEH.property.wep.twb"},
      fnf: {label: "SGEH.property.wep.fnf"},
    })
    .set('DND5E', 'validProperties.weapon', 'twb', 'fnf')
    .add("DND5E", "limitedUsePeriods", {
      brl: {
        label: "SGEH.property.wep.brl",
        formula: false,
        abbreviation: "SGEH.property.wep.brl",
      }
    })
    .add("SGEH", "fanFire", {
      minAttacks: 2,
      penalty: -3,
      repairDc: 15,
      repairSkill: 'slt',
    })
    .add("SGEH", "twinFire", {
      faceBonus: 2,
      numBarrels: 2,
    })
    .registerFlag('reload')
    .registerFlag("fanFire", { def: false })
    .registerFlag('twinFire', {def:false})
    .registerFlag('ffsShot', {def: -1})
    .registerFlag('ffsFumble', {def:false})
    .registerFlag('ffsCrit', {def:false})
    .registerFlag('ffsItem')
    .registerFlag('jammed', {def:false})
    .registerFlag('broken', {def:false});

  /**
   * A hook event that fires before an attack is rolled for an Item.
   * @param {Item5e} item                  Item for which the roll is being performed.
   * @param {D20RollConfiguration} config  Configuration data for the pending roll.
   * @returns {boolean}                    Explicitly return false to prevent the roll from being performed.
   */
  Hooks.on("dnd5e.preRollAttack", handleFanFireAttack);

  /**
   * A hook event that fires after an attack has been rolled for an Item.
   * @param {Item5e} item          Item for which the roll was performed.
   * @param {D20Roll} roll         The resulting roll.
   * @param {object[]} ammoUpdate  Updates that will be applied to ammo Items as a result of this attack.
   */
  Hooks.on("dnd5e.rollAttack", cancelAttackAmmo);


  /**
   * A hook event that fires before a damage is rolled for an Item.
   * @function dnd5e.preRollDamage
   * @memberof hookEvents
   * @param {Item5e} item                     Item for which the roll is being performed.
   * @param {DamageRollConfiguration} config  Configuration data for the pending roll.
   * @returns {boolean}                       Explicitly return false to prevent the roll from being performed.
   */
  Hooks.on('dnd5e.preRollDamage', handlePreDamage);

  /**
   * A hook event that fires before an item usage is configured.
   * @param {Item5e} item                  Item being used.
   * @param {ItemUseConfiguration} config  Configuration data for the item usage being prepared.
   * @param {ItemUseOptions} options       Additional options used for configuring item usage.
   * @returns {boolean}                    Explicitly return `false` to prevent item from being used.
   */
  Hooks.on("dnd5e.preUseItem", reloadBarrelCheck);
  Hooks.on("dnd5e.preUseItem", fanFireCheck);

  /**
   * A hook event that fires before an item's resource consumption has been calculated.
   * @param {Item5e} item                  Item being used.
   * @param {ItemUseConfiguration} config  Configuration data for the item usage being prepared.
   * @param {ItemUseOptions} options       Additional options used for configuring item usage.
   * @returns {boolean}                    Explicitly return `false` to prevent item from being used.
   */
  Hooks.on("dnd5e.preItemUsageConsumption", handleBarrelPreConsumption);

  /**
   * A hook event that fires after an item's resource consumption has been calculated but before any
   * changes have been made.
   * @param {Item5e} item                     Item being used.
   * @param {ItemUseConfiguration} config     Configuration data for the item usage being prepared.
   * @param {ItemUseOptions} options          Additional options used for configuring item usage.
   * @param {object} usage
   * @param {object} usage.actorUpdates       Updates that will be applied to the actor.
   * @param {object} usage.itemUpdates        Updates that will be applied to the item being used.
   * @param {object[]} usage.resourceUpdates  Updates that will be applied to other items on the actor.
   * @returns {boolean}                       Explicitly return `false` to prevent item from being used.
   */
  Hooks.on("dnd5e.itemUsageConsumption", handleItemConsumption);

  /**
   * A hook event that fires before an item chat card is created.
   * @param {Item5e} item             Item for which the chat card is being displayed.
   * @param {object} chatData         Data used to create the chat message.
   * @param {ItemUseOptions} options  Options which configure the display of the item chat card.
   */
  Hooks.on("dnd5e.preDisplayCard", flagJammedCard );

  Hooks.on("renderChatMessage", alterItemCard );
  Hooks.on("renderAbilityUseDialog", injectConsumeConfig);
  
};

const uses = (system = {}, field = "per") =>
  foundry.utils.getProperty(system, `uses.${field}`);
const hasBarrel = (system = {}) => uses(system) == "brl";
const emptyBarrel = (system = {}) =>
  hasBarrel(system) && uses(system, "value") === 0;
const partialBarrel = (system = {}) =>
  hasBarrel(system) && uses(system, "value") < uses(system, "max");
const canFan = (system = {}) =>
  foundry.utils.getProperty(system, "properties")?.has("fnf") ?? false;
const numShots = (system = {}) =>
  hasBarrel(system) ? uses(system, "value") : 0;
const canTwin = (system = {}) =>
  foundry.utils.getProperty(system, 'properties')?.has('twb') ?? false;

const eventChatDoc = (event) => {
  const cardId = event?.currentTarget?.closest(".chat-message.message")
    ?.dataset?.messageId;

  /* couldnt find a clicked parent, return control */
  if (!cardId) return;

  const card = game.messages.get(cardId);
  return card;
};
/**
 * @param {Item5e} item          Item for which the roll was performed.
 * @param {D20Roll} roll         The resulting roll.
 * @param {object[]} ammoUpdate  Updates that will be applied to ammo Items as a result of this attack.
 */
function cancelAttackAmmo(_, roll, ammoUpdate) {
  if (hasBarrel(roll.data?.item)) {
    ammoUpdate.length = 0;
    //const consume = foundry.utils.getProperty(roll.data, "item.consume.target");
    //if (!consume) return;

    //ammoUpdate.forEach((update) => {
    //  if (update._id == consume && "system.quantity" in update) {
    //    delete update["system.quantity"];
    //  }
    //});
  }
}

/**
 * @param {Item5e} item                  Item being used.
 * @param {ItemUseConfiguration} config  Configuration data for the item usage being prepared.
 * @returns {boolean}                    Explicitly return `false` to prevent item from being used.
 */
function reloadBarrelCheck(item, config) {
  if (emptyBarrel(item.system)) {
    config.reloadBarrel = true;
    config.consumeUsage = false;
  }

  return true;
}

/**
 * @param {Item5e} item                     Item being used.
 * @param {ItemUseConfiguration} config     Configuration data for the item usage being prepared.
 * @param {ItemUseOptions} options          Additional options used for configuring item usage.
 */
function handleBarrelPreConsumption(_, config) {
  /* do not compute consumption when reloading or firing */
  if (config.reloadBarrel || config.fanFire) {
    config.consumeUsage = false;
  }
}

function handleItemConsumption(item, config, options, usage) {
  if (config.fanFire) {
    /* flag chat message with needed info
     * Note: using this hook as it is the last part in the
     * chain where I have access to all needed data */
    Util.setFlag(options, "fanFire", true, true);
  }

  if (config.twinFire && 'system.uses.value' in usage.itemUpdates) {
    /* one consumption has already been done by the system,
     * if twinfiring, subtract another */
    usage.itemUpdates['system.uses.value'] -= 1; 
    Util.setFlag(options, 'twinFire', true, true);
  }

  if (config.reloadBarrel) {
    /* reduce linked resource by barrel count (max) */
    config.resourceAmount = uses(item.system, 'max')  - uses(item.system, 'value');
    const success = item._handleConsumeResource(config, usage.itemUpdates, usage.actorUpdates, usage.resourceUpdates, usage.deleteIds);
    if (success === false) {
      return false;
    }
    
    usage.itemUpdates['system.uses.value'] = uses(item.system, 'max');
    const itemProps = foundry.utils.getProperty(item.system, 'properties') ?? new Set();
    const rlf = itemProps.has('rlf');
    const rls = itemProps.has('rls');
    const speed = rlf ? 'fast' : rls ? 'slow' : 'other';
    Util.setFlag(options, 'reload', speed, true);
  }

}

function fanFireCheck(item, config) {
  if (canFan(item.system)) {
    /* set false by default to leave fan-fire mode unchecked in usage dialog */
    config.fanFire ??= false;
  }

  if (Util.getFlag(item,'jammed') || Util.getFlag(item, 'broken')) {
    config.consumeUsage = false;
    config.needsConfiguration = false;
  }

  return true;
}

function injectConsumeConfig(app, html) {
  const system = app.item?.system ?? {};
  const canFanFire = canFan(system);
  const canReload = partialBarrel(system);
  const canTwinFire = canTwin(system);

  if (!canFanFire && !canReload && !canTwinFire) return;

  const configGroup = html[0].getElementsByClassName("form-group")[0];
  if (!configGroup) return;

  const consumeOpts = [];
  const empty = emptyBarrel(system);
  const shotsLoaded = uses(system, 'value');
  const needsRepair = Util.getFlag(app.item, 'jammed') || Util.getFlag(app.item, 'broken');

  /* repare render data */
  if(canFanFire) {
    consumeOpts.push({
      name: 'fanFire',
      label: Util.localize('property.wep.fnf'),
      tooltip: needsRepair ?  Util.localize('sheet.fnf.fanJamTip') : Util.localize('sheet.fnf.briefRules'),
      disabled: needsRepair || shotsLoaded < Util.config('fanFire.minAttacks'),
      checked: false,
    });
  }



  if(canTwinFire) {
    const numBarrels = Util.config('twinFire.numBarrels');
    const disabled = needsRepair || shotsLoaded < numBarrels;
    consumeOpts.push({
      name:'twinFire',
      label: Util.localize('property.wep.twb'),
      tooltip: disabled ? '' : Util.localize('sheet.twb.briefRules'),
      disabled,
      checked:false
    });
  }

  if(canReload) {
    consumeOpts.push({
      name:'reloadBarrel',
      label: Util.localize('sheet.reload'),
      tooltip: '',
      disabled: needsRepair,
      checked:empty && !needsRepair,
    });
  }

  const consumeRow = consumptionTemplate({consumeOpts});
  configGroup.insertAdjacentHTML('afterend', consumeRow);
  app.setPosition({height:'auto'});
}

function injectFanActions(msg, roots) {
  if (msg.user.id !== game.user.id && !game.user.isGM) return;

  /* checked for a jammed/broken weapon */
  const broken = Util.getFlag(msg, 'broken');
  const needsFix = Util.getFlag(msg, 'jammed') || broken;

  const shotNum = Util.getFlag(msg, 'ffsShot'); 
  if (shotNum < 0 && !needsFix) return;

  const fumble = Util.getFlag(msg, 'ffsFumble');

  const body = roots[0];
  const itemUuid = Util.getFlag(msg, 'ffsItem'); 
  const buttons = actionTemplate({itemUuid, context: {canFan: !fumble && !needsFix && (shotNum >= 0), fumble, jammed: needsFix, noFix: broken }});
  body.insertAdjacentHTML('beforeend', buttons);
  body.lastElementChild.addEventListener('mouseup', onFanAction);
}

function injectReloadFeedback(msg, roots) {
  const reloadSpeed = Util.getFlag(msg, 'reload');
  if (!reloadSpeed) return;

  const body = roots[0];
  const feedback = `<div class="sgeh-feedback steinhardt-guide-to-the-eldritch-hunt-zh-tw"><p>${Util.localize('chat.reload.'+ reloadSpeed)}</p></div>`;
  body.insertAdjacentHTML('beforeend', feedback);
}

async function onFanAction(event) {
  const {sgehAction = null} = event.currentTarget?.dataset ?? {};

  if (!sgehAction) return;

  const msgEle = event.currentTarget.closest('.message');
  if(!msgEle) return;

  const msgId = msgEle?.dataset?.messageId;
  const msg = game.messages.get(msgId);
  if(!msg) return;

  const itemUuid = Util.getFlag(msg, 'ffsItem');
  if (!itemUuid) return;

  const item = await fromUuid(itemUuid);

  if (sgehAction == 'fan-damage') {
    const shotNum = Util.getFlag(msg, 'ffsShot');
    if (shotNum < 0) return;
    event.preventDefault(); 
    const critical = Util.getFlag(msg, 'ffsCrit');
    const runner = new FanFireSequence(item, {event, critical});
    event.currentTarget.firstElementChild.innerHTML += ' <i class="fas fa-check"/>';
    return runner.executeDamage(shotNum);
  }

  if (sgehAction == 'fix-jam') {
    if (Util.getFlag(item, 'jammed')) {
      event.preventDefault();

      const {repairDc, repairSkill} = Util.config('fanFire');
      const result = await item.actor.rollSkill(repairSkill);

      if(result.total >= repairDc) {
        await ChatMessage.create({
          content: Util.localize('chat.repair.success'),
          speaker: msg.speaker
        });

        await Util.setFlag(item, 'jammed', false);
      } else {
        await ChatMessage.create({
          content: Util.localize('chat.repair.failure'),
          speaker: msg.speaker
        });

        await Util.setFlag(item, 'jammed', false);
        await Util.setFlag(item, 'broken', true);

      }
    } else if (Util.getFlag(item, 'broken')) {
      await ChatMessage.create({
        content: Util.localize('chat.repair.pro'),
        //content: 'Over an extended period, or with the help of a professional, the weapon is repaired',
        speaker: msg.speaker
      });
      
      await Util.setFlag(item, 'jammed', false);
      await Util.setFlag(item, 'broken', false);
    }

    return;
  }
}

/**
 *
 *
 * @param {Item5e} _
 * @param {DamageRollConfiguration} config
 */
function handlePreDamage(_, config) {
  if ('ffsDmgParts' in config) {
    config.parts = config.ffsDmgParts;
  }

  /* mode may be passed in, or if event is present, try to derive */
  if (!('twinFire' in config)) {
    const card = eventChatDoc(config.event);
    config.twinFire = !!card ? Util.getFlag(card, "twinFire") : false;
  }

  if (config.twinFire) {
    config.rollConfigs[0].parts[0] = config.rollConfigs[0].parts[0].replace(/d(\d+)/, (_, p1) => `d${Number(p1) + Util.config('twinFire.faceBonus')}`);
  }
}

/**
 * @param {Item5e} item                  Item for which the roll is being performed.
 * @param {D20RollConfiguration} config  Configuration data for the pending roll.
 * @returns {boolean}                    Explicitly return false to prevent the roll from being performed.
 */
function handleFanFireAttack(item, config) {
  /* If no explcit fanFire option is provided, try to derive from click event */
  if (!("fanFire" in config)) {
    const card = eventChatDoc(config.event);

    /* couldnt retrieve parent document, return control */
    if (!card) return true;

    /* read fanFire setting from initial use of item */
    config.fanFire = Util.getFlag(card, "fanFire");
  }

  /* if we are fanfiring, take full control (ret = false) */
  if (config.fanFire) return executeFanFire(item, config);
  return true;
}

function executeFanFire(item, config) {
  const runner = new FanFireSequence(item, config);
  runner.executeAttacks();
  return false;
}


/**
 * @param {*} msg ChatMessage document
 * @param {HTMLElement[]} roots  
 */
function alterItemCard(msg, roots) {
  injectFanActions(msg, roots);
  injectReloadFeedback(msg, roots);

  denoteFanFireCard(msg, roots);
  denoteJammedCard(msg, roots);
  denoteTwinFireCard(msg, roots);
}

function denoteTwinFireCard(msg, [body = null]) {
  const twinFire = Util.getFlag(msg, "twinFire");
  if (twinFire && body) {
    /* indicates default message flavor which is hidden */
    const button = body.querySelector('button[data-action="damage"]');
    if (button) button.innerHTML = `
      <dnd5e-icon src="systems/dnd5e/icons/svg/damage/piercing.svg"></dnd5e-icon>${Util.localize('chat.twb.cardFlavor')}`;
  }
}

function denoteFanFireCard(msg, [body = null]) {
  const fanFire = Util.getFlag(msg, "fanFire");
  if (fanFire && body) {
    const button = body.querySelector('button[data-action="attack"]');
    if (button) button.innerHTML = `
      <dnd5e-icon src="systems/dnd5e/icons/svg/damage/radiant.svg"></dnd5e-icon>${Util.localize('chat.fnf.cardFlavor')}`;
  }
}

function flagJammedCard(item, chatData) {

  const jammed = Util.getFlag(item, 'jammed');
  const broken = Util.getFlag(item, 'broken');
  if (jammed || broken) {
    chatData.flags ??= {};
    Util.setFlag(chatData, 'ffsItem', item.uuid, true);
    Util.setFlag(chatData, 'jammed', jammed, true);
    Util.setFlag(chatData, 'broken', broken, true);
  }
}

function denoteJammedCard(msg, [body = null]) {

  const jammed = Util.getFlag(msg, 'jammed');
  const broken = Util.getFlag(msg, 'broken');
  /* indicates default message flavor which is hidden */
  const state = broken ? 'broken' : jammed ? 'jammed' : false;
  if(!state || !body) return;
  
  const attack = body.querySelector('button[data-action="attack"]');
  const damage = body.querySelector('button[data-action="damage"]');
  [attack, damage].forEach( n => {if (n) n.disabled = true;} );
}

class FanFireSequence {
  static availableShots(system, dex = 0, minimum = null) {
    minimum ??= game.sgeh.config.get("SGEH", "fanFire.minAttacks");
    return Math.min(Math.max(dex, minimum), numShots(system));
  }

  constructor(item, rollConfig = {}) {
    this.item = item;
    const {actor, data, ...config} = rollConfig;
    this.config = config;
    this.config.fanFire = false;

    this.speaker = ChatMessage.getSpeaker({actor: this.item.actor});
    this._shot = 0;
    this._fumble = false;
  }

  rollConfig(shotIndex = this._shot) {
    const config = foundry.utils.deepClone(this.config);
    config.chatMessage = false;
    config.parts = [
      shotIndex * game.sgeh.config.get("SGEH", "fanFire.penalty"),
    ];

    const alias = foundry.utils.getProperty(
      this.config,
      "messageData.speaker.alias"
    );
    
    const i18nKey = !!alias ? 'chat.fnf.alias' : 'chat.fnf.noAlias';

    if (alias) {
      config.messageData.speaker.alias = Util.localize(i18nKey, {
        name: alias,
        count: this._shot + 1,
      });
    }

    return config;
  }

  dmgConfig(shotIndex) {
    const config = foundry.utils.deepClone(this.config);

    /* ensure ammo is latched */
    const consume = this.item.system.consume;
    if ( consume?.type === "ammo" ) {
      const ammo = this.item.actor.items.get(consume.target);
      if ( ammo?.system ) {
        delete this.item._ammo;
        this.item._ammo = ammo;
      }
    }

    /* modify speaker alias to indicate shot number */
    config.options = foundry.utils.mergeObject(config.options ?? {}, {messageData: {speaker: {...this.speaker}}}, {inplace:false});
    config.options.messageData.speaker.alias = Util.localize('chat.fnf.dmgAlias', {name: this.speaker.alias, count: shotIndex + 1});

    if (shotIndex > 0) {
      const rollData = this.item.getRollData();
      
      /* zero out any numeric terms for shots after first */
      const parts = this.item.system.damage?.parts ?? [];
      const ammo = this.item._ammo?.system?.damage?.parts ?? [];
      /* need to modify the formula to remove all flat modifiers */
      const newParts = parts.concat(ammo).map( ([formula, _]) => {
        const roll = new Roll(formula, rollData);
        const noMods = roll.terms.map( term => {
          if (term instanceof NumericTerm) term.number = 0;
          return term;
        });
        const newFormula = Roll.getFormula(noMods);
        return [newFormula];
      });
      
      config.options.ffsDmgParts = newParts;
    }

    return config;
  }

  get actor() {
    return this.item?.actor;
  }

  get dex() {
    return (
      foundry.utils.getProperty(this.config, "data.abilities.dex.mod") ?? 0
    );
  }

  /**
   *
   *
   * @param {Number} shotNum 0-indexed fan fire shot number
   * @memberof FanFireSequence
   */
  async executeDamage(shotNum) {
    return await this.item.rollDamage(this.dmgConfig(shotNum));
  }


  async executeAttacks() {
    const minAttacks = Util.config('fanFire.minAttacks');
    this.numShots = Math.min(
      Math.max(this.dex, minAttacks),
      numShots(this.item.system ?? 0)
    );

    if (this.numShots < 2) {
      ui.notifications.warn(
        game.i18n.format("DND5E.ItemNoUses", { name: this.item.name })
      );
      return;
    }

    /* roll attacks until fumbling or complete */
    while (this._shot < this.numShots && !this._fumble) {
      const config = this.rollConfig();
      const roll = await this.item.rollAttack(config);
      this._fumble |= roll.isFumble;
      foundry.utils.mergeObject(config, roll.options); 
      Util.setFlag(config.messageData, 'ffsShot', this._shot, true);
      Util.setFlag(config.messageData, 'ffsFumble', this._fumble, true);
      Util.setFlag(config.messageData, 'ffsCrit', roll.isCritical, true);
      Util.setFlag(config.messageData, 'ffsItem', this.item.uuid, true);
      
      await roll.toMessage(config.messageData);

      /* update config according to potential attack dialog modifications */
      if (this._shot == 0) {
        foundry.utils.mergeObject(this.config, {
          advantage: roll.hasAdvantage,
          disadvantage: roll.hasDisadvantage,
          fastForward: true,
          ...roll.options,
        });
      }

      this._shot += 1;
    }

    /* after the sequence is complete, check for fumble and flag weapon */
    if (this._fumble) {
      await Util.setFlag(this.item, 'jammed', true);
    }

    /* consume charges for number of shots taken */
    const current = numShots(this.item.system);
    await this.item.update({'system.uses.value': Math.max(0, current - this._shot)});
  }
}

var moons = () => {
  
  /* Register Lunar Table sheet */
  RollTables.registerSheet('steinhardt-guide-to-the-eldritch-hunt-zh-tw', LunarTableConfig, {
    makeDefault:false,
    label: 'SGEH.sheet.lunar.name',
  });

  /* Register Beckoning Table sheet */
  RollTables.registerSheet('steinhardt-guide-to-the-eldritch-hunt-zh-tw', BeckonTableConfig, {
    makeDefault:false,
    label: 'SGEH.sheet.beckon.name',
  });

  game.sgeh.config
    .add("SGEH", 'moonAppearance', {
      night: 'SGEH.sheet.moons.appear.night',
      day: 'SGEH.sheet.moons.appear.day',
    })
    .add("SGEH", 'links', {
      moons: {
        beckon: {
          rules: {
            counter: {
              uuid: 'Compendium.steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-notes.JournalEntry.bxwCDTgQTcxuWp83.JournalEntryPage.Pilaw2anJN6Uxm4H#eldritch-beckoning-method',
              label: 'SGEH.sheet.moons.beckonRules'
            }
          },
          actions: {
            player: {
              uuid: 'Compendium.steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-notes.JournalEntry.bxwCDTgQTcxuWp83.JournalEntryPage.Pilaw2anJN6Uxm4H#player-actions',
              label: 'SGEH.sheet.moons.actions.player',
            },
            world: {
              uuid: 'Compendium.steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-notes.JournalEntry.bxwCDTgQTcxuWp83.JournalEntryPage.Pilaw2anJN6Uxm4H#world-actions',
              label: 'SGEH.sheet.moons.actions.world',
            }
          }
        },
        
      }
    })
    .add('SGEH', 'beckonTable', {
      50: {
        appear: 'night',
        mode: 'none',
        formula: '0',
      },
      100: {
        formula: '1d1',
        interval: 'year',
        minInterval: 'year',
        mode: 'slumbering',
      },
      200: {
        formula: '1d4',
        interval: 'year',
        minInterval: 'month',
        mode: 'noRebirth'
      },
      300: {
        formula: '2d4',
        mode: 'all',
        merge: 199,
      },
      400: {
        formula: '3d4',
        merge: 299,
      },
      500: {
        formula: '1d4',
        interval: 'month',
        minInterval: 1,
        appear:'night',
        mode: 'all',
      },
      600: {
        interval:14,
        merge:499,
      },
      700: {
        interval:7,
        merge:599,
      },
      800: {
        formula:'1d4',
        interval: 4,
        minInterval: 1,
        appear:'day',
        mode: 'crown',
        crown: false,
      },
      900: {
        merge: 799,
        crown: '1d2cs1',
      },
      1000: {
        merge: 899,
        crown: '1d1',
      },
    })
    .registerFlag('moons', { def: {
      current: false,
      queue: [],
    }})
    .registerFlag('specialMoons', { def: {
      slumbering: '',
      rebirth: '',
    }, sparse: true})
    .registerFlag('beckon', { def: {
      value: 0,
      session: 0,
    }, sparse: true})
    .registerFlag('moonConfig', {def: {
      interval: 28,
      months: 12,
      minInterval: 1,
      formula: '1d4',
      appear: 'night',
    }, sparse: true});
      
};

class MoonTableCommon extends RollTableConfig {
  
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.classes.push(`steinhardt-guide-to-the-eldritch-hunt-zh-tw`);
    options.submitOnChange = true;
    options.submitOnClose = false;
    return options;
  }

  async getData(options={}) {
    const context = await super.getData(options);

    const rawMoons = Util.getFlag(this.document, 'moons');
    
    const makeMoonEntry = async (rawMoon = null) => {
      if (!rawMoon) return null;
      return {
        date: rawMoon.date, 
        appear: Util.localize('sheet.moons.appear.'+rawMoon.appear),
        moon: await TextEditor.enrichHTML(rawMoon.moon, {async:true})
      }
    };

    context.moons = {
      current: await makeMoonEntry(rawMoons.current),
      queue: await Promise.all(rawMoons.queue.map( makeMoonEntry ))
    };

    context.moonConfig = Util.getFlag(this.document, 'moonConfig');
    context.emptyQueue = context.moons.queue.length == 0;

    const moonPath = Util.flagPath('moons');
    const configPath = Util.flagPath('moonConfig');

    context.paths = {
      ...Reflect.ownKeys(context.moonConfig).reduce( (acc, curr) => {
        acc[curr] = configPath + '.' + curr;
        return acc;
      }, {}),
      current: moonPath + '.current',
      queue: moonPath + '.queue',
    };

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    const controls = html[0].getElementsByClassName('controls'); 
    for (const node of controls){
      node.addEventListener('mouseup', this._handleControl.bind(this));
    }
  }

  _handleControl(event) {

    const button = event.target?.closest('button');
    if (!button) return;

    const action = button.dataset?.action;
    if (!action) return;

    event.preventDefault();

    switch (action) {
      case 'roll-moons':
        return this.rollMoons();
      case 'next-moon':
        return this.nextMoon();
      case 'clear-moon':
        return this.clearMoon();
      default:
        /* this class cannot handle the action, return info
         * to potential child caller */
        return this._handleChildControl({action, data: button.dataset});
    }

  }

  _handleChildControl(/*{action, data}*/) {};

  async rollMoons(config = null) {

    const rollConfig = this._prepareRoll(config);
    const results = await this._drawMoons(rollConfig);
    const {current = null, queue = []} = await this._createSchedule(results, rollConfig);

    return this._updateMoons(current, queue);
  };

  _prepareRoll(config) {
    return foundry.utils.mergeObject(Util.getFlag(this.document, 'moonConfig'), config ?? {}, {inplace:false});
  }

  async _drawMoons(rollConfig) {
    const moonRoll = await new Roll(rollConfig.formula).evaluate({async:true});
    const {results} = await this.document.drawMany(moonRoll.total, {displayChat:false});
    return results;
  }

  async _createSchedule(results, rollConfig) {
    if (rollConfig.mode == 'none' || rollConfig.formula === '0') return {current: null, queue:[]};

    if (results.length * rollConfig.minInterval > rollConfig.interval) {
      ui.notifications.error(Util.localize('moons.tooMany'));
      return {current: null, queue: []};
    }

    /* create dates for each moon drawn */
    const dates = [];
    let usableDates = Array.from(Array(rollConfig.interval), (_, i) => i+1);
    do {
      const dateIndex = Math.floor(Math.random() * usableDates.length);
      const date = usableDates[dateIndex];

      /* set the date for whatever moon's appearance */
      dates.push(date);

      /* remove this date and those within minInterval from set of usable dates */
      const blackoutDates = Array.from( Array(rollConfig.minInterval - 1), (_, i) => [date - (i+1), date + (i+1)]).flat();
      blackoutDates.push(date);
      usableDates = usableDates.filter( putative => !blackoutDates.includes(putative));

    } while (dates.length < results.length && usableDates.length > 0)
    
    dates.sort( (a,b) => a - b );

    /* assign to stock schedule */
    const schedule = results.map( (draw, index) => ({date:dates[index], appear:rollConfig.appear, moon: draw.getChatText()}));

    return {current: null, queue: schedule};
  }

  
  async _updateMoons(current, schedule) {
    /* store results in queue and clear current */
    const update = {
      current: !!current ? current : false,
      queue: schedule,
    };

    /* issue update */
    const updateData = Util.setFlag({}, 'moons', update);

    return this.submit({updateData});
  }

  async nextMoon() {
    const moons = Util.getFlag(this.document, 'moons');
    const [current = false, ...queue] = moons.queue;

    const update = {
      current,
      queue,
    };
    
    const updateData = {flags: {}};
    Util.setFlag(updateData, 'moons', update, true);
    
    return this.submit({updateData});
  }

  async clearMoon() {
    const updateData = {flags: {}};
    Util.setFlag(updateData, 'moons', {current: false}, true);
    return this.submit({updateData});
  }

  async _updateObject(event, formData) {
    event.preventDefault();
    const update = foundry.utils.expandObject(formData);
    return this.document.update(update);
  }

}

class LunarTableConfig extends MoonTableCommon {
  
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.template = Util.DATA.TEMPLATES + 'lunar-table-config.hbs';
    return options;
  }

  get title() {
    return `${Util.localize('sheet.lunar.name')}: ${this.document.name}`;
  }

  async _drawMoons(rollConfig) {
    /* each draw is fresh */
    await this.document.resetResults();
    return super._drawMoons(rollConfig);
  }

}

class BeckonTableConfig extends MoonTableCommon {

  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.template = Util.DATA.TEMPLATES + 'beckon-table-config.hbs';
    return options;
  }

  /** @override */
  get title() {
    return `${Util.localize('sheet.beckon.name')}: ${this.document.name}`;
  }

  /** @override */
  async getData(options = {}) {
    const context = await super.getData(options);

    await this._insertBeckonData(context);
    context.increments = this._getIncrementChoices();
    context.appearChoices = this._getAppearanceChoices();

    return context;
  }

  /** @override */
  _prepareRoll(config) {
    const rollConfig = super._prepareRoll(config);
    const counter = Util.getFlag(this.document, 'beckon').value;

    const table = Util.config('beckonTable');

    const mergeConfigs = (counter, current = {}) => {
      const range = Reflect.ownKeys(table).find( upper => Number(counter) < Number(upper) );

      current = foundry.utils.mergeObject(table[range], current, {inplace:false} );

      if ('merge' in current) {
        const nextCounter = current.merge;
        delete current.merge;
        return mergeConfigs(nextCounter, current)
      }

      return current;

    };

    const beckonConfig = mergeConfigs(counter, rollConfig.beckonConfig); 

    /* convert 'enum' values for interval and mininterval */
    const convertBeckonInterval = (interval) => {
      switch (interval) {
        case 'year':
          return rollConfig.interval * rollConfig.months;
        case 'month':
          return rollConfig.interval;
        default:
          return interval;
      }
    };

    beckonConfig.interval = convertBeckonInterval(beckonConfig.interval);
    beckonConfig.minInterval = convertBeckonInterval(beckonConfig.minInterval);
    foundry.utils.mergeObject(beckonConfig, Util.getFlag(this.document, 'specialMoons'));

    return foundry.utils.mergeObject(rollConfig, beckonConfig);
  }

  async _rebirthDraw(num, rebirthId) {
    if (num < 1) return [];
    const {results} = await this.document.drawMany(num, {displayChat:false});

    /* if rebirth is drawn (or the table is totally empty),
     * reset the table results for subsequent rolls */
    if (results.length < 1 || (!!rebirthId && !!results.find( result => result._id == rebirthId ))) {
      await this.document.resetResults();
    }

    const remaining = num - results.length;
    return results.concat( await this._rebirthDraw(remaining, rebirthId) );
  }

  /** @override */
  async _drawMoons(rollConfig) {

    /* mode defines the set of potentials */
    switch (rollConfig.mode) {
      case 'none':
        return [];
      case 'all':
        await this.document.resetResults();
        return await super._drawMoons(rollConfig);
      case 'slumbering': {
        const id = rollConfig.slumbering;
        const num = (await new Roll(rollConfig.formula)).total;
        const results = new Array(num).fill(this.document.results.get(id));
        return results;
      }
      case 'noRebirth': {
        const id = rollConfig.rebirth;

        /* reset results, but set rebirth as already drawn */
        const updates = this.document.results.map(result => ({_id: result.id, drawn: result.id == id}));
        await this.document.updateEmbeddedDocuments("TableResult", updates);
        
        return await super._drawMoons(rollConfig);

      }
      case 'crown': {
        const id = rollConfig.rebirth;
        
        /* crown mode requires results being pulled, if no
           rebirth moon is indicated, or if the current table is
           exhausted, reset it */
        const canDraw = this.document.results.some( result => result.drawn == false );
        if (!canDraw) await this.document.resetResults();

        const moonRoll = await new Roll(rollConfig.formula).evaluate({async:true});
        const dayResults = await this._rebirthDraw(moonRoll.total, id);

        /* night moons are gathered during schedule creation */
        return dayResults;
      }
    }

    return super._drawMoons(rollConfig);
  }

  async _createSchedule(results, rollConfig) {
    let {current, queue} = await super._createSchedule(results, rollConfig);

    if (rollConfig.crown) {
      const rebirth = rollConfig.rebirth;

      /* each night has a chance of spawning a moon */
      let nightResults = [];
      for (const _ of Array.from(Array(rollConfig.interval))) {
        const roll = await new Roll(rollConfig.crown).evaluate({async: true});
        const results = await this._rebirthDraw(Math.clamped(roll.total, 0, 1), rebirth);
        nightResults.push(...results);  
      }

      const nightMoons = await super._createSchedule(nightResults, {interval: rollConfig.interval, minInterval: 1, appear: 'night'});
      queue = queue.concat(nightMoons.queue);

      /* sort new queue with day < night */
      queue.sort( (a,b) => a.date == b.date ? a.appear - b.appear : a.date - b.date);
    }

    return {current, queue};

  }

  incrementSession(delta) {
    if(isNaN(delta)) {
      ui.notifications.error('Cannot increment beckoning counter by non-numeric value');
      return;
    }
    
    const current = Util.getFlag(this.document, 'beckon').session;

    const updateData = Util.setFlag({}, 'beckon', {session: current + delta});

    return this.submit({updateData});
  }

  saveSession() {
    const counters = Util.getFlag(this.document, 'beckon');

    const updateData = Util.setFlag({}, 'beckon', {
      session: 0,
      value: Math.max(0, counters.value + counters.session)
    });

    return this.submit({updateData});
  }

  /** @override */
  _handleChildControl({action, data}) {
    switch (action) {
      case 'session-increment':
        return this.incrementSession(Number.fromString(data.increment));
      case 'session-save':
        return this.saveSession();
    }
  }

  async _insertBeckonData(context = {}) {
    const path = Util.flagPath('beckon');
    const beckon = Util.getFlag(this.document, 'beckon');

    const enrichLink = (refObj) => Promise.all(Object.values(refObj).map( link => TextEditor.enrichHTML(`@UUID[${link.uuid}]{${game.i18n.localize(link.label)}}`, {async:true})));


    const sessionLinks = Util.config('links.moons.beckon.actions');
    const enrichedSession = await enrichLink(sessionLinks);
    const rulesLinks = Util.config('links.moons.beckon.rules');
    const enrichedRules = await enrichLink(rulesLinks);

    const specials = Util.getFlag(this.document, 'specialMoons');

    const moonChoices = context.results.map( async result => {
      {
        const enriched = await TextEditor.enrichHTML(
          this.document.results.get(result._id).getChatText(), {async:true}
        );

        const template = document.createElement('template');
        template.innerHTML = enriched;
        const text = template.content.textContent;

        return {id: result._id, label: text};
      }
    });

    const enrichedChoices = (await Promise.all(moonChoices)).reduce( (acc, choice) => {
      acc[choice.id] = choice.label;
      return acc;
    }, {});

    const slumbering = {
      value: specials.slumbering,
      options: enrichedChoices,
    };

    const rebirth = {
      value: specials.rebirth,
      options: enrichedChoices,
    };

    foundry.utils.mergeObject(context, {
      beckon,
      paths: {
        beckon: Reflect.ownKeys(beckon).reduce( (acc, curr) => {
          acc[curr] = path + '.' + curr;
          return acc;
        }, {}),
        slumbering: Util.flagPath('specialMoons') + '.slumbering' ,
        rebirth: Util.flagPath('specialMoons') + '.rebirth' ,
      },
      special: {
        slumbering,
        rebirth,
      },
      links: {
        session: enrichedSession,
        rules: enrichedRules,
      }
    });
    
  }

  _getIncrementChoices() {
    const positive = [1, 5, 10, 50, 100];
    const neg = positive.map( val => -val );
    return positive.concat(neg);
  }

  _getAppearanceChoices() {
    const choices = Util.config('moonAppearance');
    return choices;
  }
}

const damageButtonPartial = Handlebars.compile(`
<div class="steinhardt-guide-to-the-eldritch-hunt-zh-tw sgeh-action sgeh-feedback" data-sgeh-action="moongold-damage" data-uuid="{{uuid}}">
  {{{header}}}
  {{#if hasDamage}}
  <button data-damage-type="normal">{{localize "SGEH.chat.mng.damage"}}</button>
  {{/if}}
  {{#if hasVersatile}}
  <button data-damage-type="versatile">{{localize "SGEH.chat.mng.versatile"}}</button>
  {{/if}}
</div>
`);

const DMG = 1;
const VER = 2;

var moongold = () => {
  game.sgeh.config
    .add('DND5E', 'itemProperties', {'mng': {
      isPhysical: true,
      label: 'SGEH.property.wep.mng'
    }})
    .set('DND5E', 'validProperties.weapon', 'mng')
    .set('DND5E', 'validProperties.consumable', 'mng')
    .add('DND5E', 'rules', {moongold: 'Compendium.steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-notes.JournalEntry.PtMqY1NvWGCHkLoG.JournalEntryPage.2PPfXJjMx41C0h7L'})
    .add('SGEH', 'moongold', {
      damage: {
        parts: ['1d4'],
        type:''
      },
    })
    //bithot
    .registerFlag('moongold', {def: 0});

  /**
   * A hook event that fires before an item chat card is created.
   * @param {Item5e} item             Item for which the chat card is being displayed.
   * @param {object} chatData         Data used to create the chat message.
   * @param {ItemUseOptions} options  Options which configure the display of the item chat card.
   */
  Hooks.on('dnd5e.preDisplayCard', flagAsMoongold);


  /**
   * A hook event that fires before a damage is rolled for an Item.
   * @function dnd5e.preRollDamage
   * @memberof hookEvents
   * @param {Item5e} item                     Item for which the roll is being performed.
   * @param {DamageRollConfiguration} config  Configuration data for the pending roll.
   * @returns {boolean}                       Explicitly return false to prevent the roll from being performed.
   */
  Hooks.on('dnd5e.preRollDamage', flagDamage);


  Hooks.on("renderChatMessage", injectMoongoldActions);
};

function flagAsMoongold(item, chatData) {
  const isMng = foundry.utils.getProperty(item, 'system.properties')?.has('mng') ?? false;
  if (isMng) {
    const {hasDamage = false, isVersatile = false} = item;
    const flag = (hasDamage ? DMG : 0) | (isVersatile ? VER : 0);
    Util.setFlag(chatData, 'moongold', flag, true);
  }
}

function flagDamage(_, config) {
  if (config.moongold) {
    const moongold = Util.config('moongold');
    config.rollConfigs.push(moongold.damage);
  }
}

async function injectMoongoldActions(msg, roots) {
  if (msg.user.id !== game.user.id && !game.user.isGM) return;

  const moongold = Util.getFlag(msg, 'moongold');
  if (!moongold) return;

  const hasDamage = moongold & DMG;
  const hasVersatile = moongold & VER;
  const {itemUuid = null} = msg.getFlag('dnd5e','use');
  const header = `<h4 class="header">&Reference[moongold]{${Util.localize('chat.mng.header')}}</h4>`;
  const body = roots[0].querySelector('.message-content');
  const buttons = damageButtonPartial({header: await TextEditor.enrichHTML(header, {async: true}), uuid: itemUuid, hasDamage, hasVersatile});
  body.insertAdjacentHTML('beforeend', buttons);
  body.lastElementChild.addEventListener('mouseup', onMngDamage);
}

async function onMngDamage(event) {
  event.preventDefault();
  const {sgehAction = null, uuid = null} = event.currentTarget?.dataset ?? {};
  if(sgehAction !== 'moongold-damage' || !uuid) return;

  const target = event.target.closest('button');
  const action = target.dataset?.damageType;


  switch (action) {
    case 'normal':
      return await (await fromUuid(uuid))?.rollDamage({
        event: event,
        versatile: false,
        options: {moongold: true}
      });
    case 'versatile':
      return await (await fromUuid(uuid))?.rollDamage({
        event: event,
        versatile: true,
        options: {moongold: true}
      });
  }

  
}

var dualtypes = () => {
  game.sgeh.config.registerFlag("dualType", {def: {details: {type: {value: ''}}}});

  /* Sheet injections for second creature type */
  Hooks.on('renderActorSheet', sheetInjections);
};

const sheetInjections = (app, html, data) => {
  if (!data.isNPC) return;

  const firstType = html[0].querySelector('.summary .creature-type');
  if (!firstType) return;

  const dualTypeString = app.actor.constructor.formatCreatureType(Util.getFlag(app.actor, 'dualType')?.details?.type) ?? '';

  const dualTypeElement = document.createElement('li');
  dualTypeElement.classList.add('creature-type', 'steinhardt-guide-to-the-eldritch-hunt-zh-tw', 'dual-type');
  dualTypeElement.innerHTML = `
<span data-tooltip="${dualTypeString}">${dualTypeString}</span>
<a class="config-button" data-action="dual-type" data-tooltip="DND5E.CreatureTypeConfig">
  <i class="fas fa-cog"></i>
</a>
  `;

  if (app.isEditable) {
    dualTypeElement.querySelector('a').addEventListener('click', (event) => {
      if (event.currentTarget.dataset?.action == 'dual-type') {
        event.preventDefault();
        new (DualTypeConfig(game.dnd5e.applications.actor.ActorTypeConfig))(app.actor).render(true);
      }
    });
  }

  firstType.insertAdjacentElement('afterend', dualTypeElement);
};

const DualTypeConfig = (cls) => class extends cls {
  constructor(object = {}, options = {}) {
    super(object, options);

    /* wrap provided object in proxy and re-store */
    const handler = {
      get(target, prop) {
        switch (prop) {
          case "system":
            return Util.getFlag(target, "dualType");
          case "update":
            return (data, ...args) => {
              const redirect = Reflect.ownKeys(data).reduce((acc, curr) => {
                if (curr == "system.details.type")
                  acc[Util.flagPath("dualType") + '.details.type'] = data[curr];
                else acc[curr] = data[curr];
                return acc;
              }, {});
              return target.update(redirect, ...args);
            };
          default:
            return Reflect.get(...arguments);
        }
      },
    };

    this.object = new Proxy(object, handler);
  }
};

class MomentumPanel extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      closeOnSubmit: false,
      title: 'SGEH.momentum.appTitle',
      id: 'momentum-control',
      classes: ['steinhardt-guide-to-the-eldritch-hunt-zh-tw','sheet','item'],
    });
  }

  constructor(actor, effectUUID, options = {}) {
    if (!actor || !effectUUID) throw new Error('No actor provided to modify!');
    options.id ??= MomentumPanel.defaultOptions.id + `-${actor.id}`;
    super(options);
    this.actor = actor;
    this.effectUUID = effectUUID;
    this._effect = fromUuid(this.effectUUID);
    this.actor.apps[this.appId] = this;
  }

  async _renderInner(data) {
    const current = await this.currentMomentum();
    const html = `
<div style="text-align:center">
<h4>${this.actor.name}</h4>
<div class="flexrow"><p>${Util.localize('momentum.count.current', {num: current.length})}</p><p>${Util.localize('momentum.count.max', {num: this.maxMomentum})}</p></div>
<button data-action="add"><label>${Util.localize('momentum.add')}</label></button>
<button data-action="remove"><label>${Util.localize('momentum.remove')}</label></button>
<button data-action="remove-all"><label>${Util.localize('momentum.expend')}</label></button>
</div>`;
    return $(html);
  }

  activateListeners(html) {
    super.activateListeners(html);
    const add = html[0].querySelector('[data-action="add"]');
    const remove = html[0].querySelector('[data-action="remove"]');
    const removeAll = html[0].querySelector('[data-action="remove-all"]');

    add.addEventListener('click', this.add.bind(this));
    remove.addEventListener('click', this.remove.bind(this));
    removeAll.addEventListener('click', this.removeAll.bind(this));

  }

  async close() {
    delete this.actor.apps[this.appId];
    return super.close();
  }

  async currentMomentum() {
    const momentum = await this._effect;
    const origin = momentum.parent.uuid;
    if (!momentum) throw new Error('Cannot locate template active effect: ' + this.effectUUID);

    return this.actor.effects.filter( e => e.origin === origin && e.disabled == false );
  }

  get maxMomentum() {
    const prof = foundry.utils.getProperty(this.actor, 'system.attributes.prof') ?? 0;
    const str = foundry.utils.getProperty(this.actor, 'system.abilities.str.mod') ?? 0;
    const dex = foundry.utils.getProperty(this.actor, 'system.abilities.dex.mod') ?? 0;

    return prof + Math.max(str, dex);
  }

  async postFeedback(content = '', flavor = '') {
    content = `<div class="steinhardt-guide-to-the-eldritch-hunt-zh-tw sgeh-feedback">${content}</div>`;
    await ChatMessage.create({content, speaker: {actor: this.actor}, flavor});
  }

  async add() {
    const momentum = await this._effect;
    if (!momentum) throw new Error('Cannot locate template active effect: ' + this.effectUUID);
    const current = await this.currentMomentum();
    const max = this.maxMomentum;

    if (current.length < max) {
      const cloned = momentum.clone({disabled: false});
      await this.actor.createEmbeddedDocuments('ActiveEffect', [cloned]);
      await this.postFeedback(Util.localize('momentum.chatAdd', {name: cloned.name}));
      return true;
    } else {
      ui.notifications.warn(Util.localize('momentum.cannotAdd', {name: momentum.name}));
      return false;
    }
  }
  
  async remove() {
    const current = await this.currentMomentum();
    if (current.length > 0) {
      await this.postFeedback(Util.localize('momentum.chatRemove', {name: current.at(-1).name}));
      await current.at(-1).delete();
      return true;
    } else {
      return false;
    }
  }

  async removeAll() {
    const current = await this.currentMomentum();
    if (current.length > 0) {
      await this.postFeedback(Util.localize('momentum.chatExpend', {num: current.length, name: current.at(-1).name}));
      await this.actor.deleteEmbeddedDocuments('ActiveEffect', current.map( e => e.id));
    }
    return current.length > 0;
  }
}
var momentum = () => {
  game.sgeh.config.add('SGEH', 'momentum', {
    classes: {'jaeger': 2}, // Class ID and level gained
    effect: 'Compendium.steinhardt-guide-to-the-eldritch-hunt-zh-tw.sgeh-items.Item.yBNmKgP4BxSueIBt.ActiveEffect.PxhGiXEqL7jgvXcd'
  });

  Hooks.on('getActorSheetHeaderButtons', (app, buttons) => {
    const momentumConfig = game.sgeh.config.get('SGEH', 'momentum');
    const actorClasses = app.object?.classes ?? {};
    const momentumClass = Object.entries(momentumConfig.classes).some( ([classId, level]) => actorClasses[classId]?.system.levels >= level );
    if (momentumClass) {
      buttons.unshift({
        class: 'open-momentum',
        label: 'SGEH.momentum.buttonTitle',
        icon: 'fas fa-cubes-stacked',
        onclick: () => (new MomentumPanel(app.object, momentumConfig.effect)).render(true) 
      });
    }
  });
};

const buildList = [
  core,
  journal,
  armor,
  spellcasting,
  trick,
  barrels,
  moons,
  moongold,
  dualtypes,
  momentum,
];

Hooks.on("init", () => buildList.forEach((module) => module()));

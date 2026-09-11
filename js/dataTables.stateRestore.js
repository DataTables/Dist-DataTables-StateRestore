/*! StateRestore 2.0.0 for DataTables
 * Copyright (c) SpryMedia Ltd - datatables.net/license/plus
 *
 * SVG icons: ISC License
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT).
 * All other copyright (c) for Lucide are held by Lucide Contributors 2022.
 */

(function(factory){
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['datatables.net'], function (dt) {
			return factory(window, document, dt);
		});
	}
	else if (typeof exports === 'object') {
		// CommonJS
		var cjsRequires = function (root) {
			if (! root.DataTable) {
				require('datatables.net')(root);
			}
		};

		if (typeof window === 'undefined') {
			module.exports = function (root) {
				if (! root) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				cjsRequires(root);
				return factory(root, root.document, root.DataTable);
			};
		}
		else {
			cjsRequires(window);
			module.exports = factory(window, window.document, window.DataTable);
		}
	}
	else {
		// Browser
		factory(window, document, window.DataTable);
	}
}(function(window, document, DataTable) {
'use strict';

var Dom = DataTable.Dom;
var Api = DataTable.Api;
var util = DataTable.util;

const stateManipulators = {
    cardView: {
        available: state => {
            return state.cardView ? true : false;
        },
        remove: state => {
            delete state.cardView;
        },
        text: dt => dt.i18n('stateRestore.option.cardView', 'Card view mode')
    },
    columnVisibility: {
        available: state => {
            return state.columns &&
                state.columns.length &&
                typeof state.columns[0].visible === 'boolean'
                ? true
                : false;
        },
        remove: state => {
            state.columns.forEach((col) => {
                delete col.visible;
            });
        },
        text: dt => dt.i18n('stateRestore.option.columnVisibility', 'Column visibility')
    },
    columnSearch: {
        available: state => {
            return state.columns &&
                state.columns.length &&
                typeof state.columns[0].search !== 'undefined'
                ? true
                : false;
        },
        remove: state => {
            state.columns.forEach((col) => {
                delete col.search;
            });
        },
        text: dt => dt.i18n('stateRestore.option.columnSearch', 'Search (Columns)')
    },
    columnControl: {
        available: state => {
            return state.columnControl ? true : false;
        },
        remove: state => {
            delete state.columnControl;
        },
        text: dt => dt.i18n('stateRestore.option.columnControl', 'Search (Column Control)')
    },
    columnOrder: {
        available: state => {
            return state.colReorder ? true : false;
        },
        remove: state => {
            delete state.colReorder;
        },
        text: dt => dt.i18n('stateRestore.option.columnOrder', 'Column ordering')
    },
    order: {
        available: state => {
            return typeof state.order !== 'undefined';
        },
        remove: state => {
            delete state.order;
        },
        text: dt => dt.i18n('stateRestore.option.order', 'Ordering')
    },
    pageStart: {
        available: state => {
            return (typeof state.start !== 'undefined');
        },
        remove: state => {
            delete state.start;
        },
        text: dt => dt.i18n('stateRestore.option.pageStart', 'Paging position')
    },
    pageLength: {
        available: state => {
            return (typeof state.length !== 'undefined');
        },
        remove: state => {
            delete state.length;
        },
        text: dt => dt.i18n('stateRestore.option.pageLength', 'Paging length')
    },
    scroller: {
        available: state => {
            return typeof state.scroller !== 'undefined';
        },
        remove: state => {
            delete state.scroller;
        },
        text: dt => dt.i18n('stateRestore.option.scroller', 'Scroller position')
    },
    search: {
        available: state => {
            return typeof state.search !== 'undefined';
        },
        remove: state => {
            delete state.search;
            delete state.searchGroups;
        },
        text: dt => dt.i18n('stateRestore.option.search', 'Search (global)')
    },
    searchBuilder: {
        available: state => {
            return typeof state.searchBuilder !== 'undefined';
        },
        remove: state => {
            delete state.searchBuilder;
        },
        text: dt => dt.i18n('stateRestore.option.searchBuilder', 'Search (SearchBuilder)')
    },
    searchPanes: {
        available: state => {
            return typeof state.searchPanes !== 'undefined';
        },
        remove: state => {
            delete state.searchPanes;
        },
        text: dt => dt.i18n('stateRestore.option.searchBuilder', 'Search (SearchPanes)')
    },
    select: {
        available: state => {
            return typeof state.select !== 'undefined';
        },
        remove: state => {
            delete state.select;
        },
        text: dt => dt.i18n('stateRestore.option.searchBuilder', 'Row selection')
    },
};

const ajax = {
    read: function (dt, host) {
        let p = new Promise((resolve, reject) => {
            let options = util.object.assignDeep({
                // Ajax properties that could be overridden
                method: 'post',
                dataType: 'json',
                data: {
                    action: 'state-read',
                    path: window.location.pathname,
                    table: dt.table().node().id
                }
            }, host.ajax(), {
                // Ajax properties that can't be overridden
                success: json => {
                    if (json.error) {
                        reject();
                    }
                    else {
                        let loadedStates = json.data
                            .map(s => {
                            let state = Object.assign({}, s);
                            // Already JSON
                            if (typeof s.state === 'object') {
                                return s.state;
                            }
                            // Or string based
                            try {
                                state.state = JSON.parse(s.state);
                                return state;
                            }
                            catch (e) {
                                // noop
                            }
                            return null;
                        })
                            .filter(s => !!s);
                        resolve(loadedStates);
                    }
                },
                error: () => {
                    host.error('Error in JSON response');
                    resolve([]);
                }
            });
            DataTable.ajax(options);
        });
        return p;
    },
    create: function (dt, state, host) {
        let p = new Promise((resolve, reject) => {
            if (state.isStatic) {
                // Static states don't get sent to the server-side for storage,
                // so we just need to update the host's storage with the state.
                if (!state.id) {
                    state.id = host.randomId();
                }
                host.storeAdd(state);
            }
            else {
                // Non-static (i.e. user) states, do get sent to the server.
                let options = util.object.assignDeep({
                    // Ajax properties that could be overridden
                    method: 'post',
                    dataType: 'json',
                    data: {
                        action: 'state-create',
                        isDefault: state.isDefault,
                        isSharedOut: state.isSharedOut,
                        name: state.name,
                        path: window.location.pathname,
                        state: JSON.stringify(state.state),
                        table: dt.table().node().id
                    }
                }, host.ajax(), {
                    // Ajax properties that can't be overridden
                    success: json => {
                        if (!json.error &&
                            json.data &&
                            json.data.length === 1) {
                            let state = json.data[0];
                            // Already JSON
                            if (typeof state.state === 'object') {
                                host.storeAdd(state);
                                resolve(true);
                            }
                            // Or string based
                            try {
                                state.state = JSON.parse(state.state);
                                host.storeAdd(state);
                                resolve(true);
                            }
                            catch (e) {
                                resolve(false);
                            }
                        }
                        else {
                            resolve(false);
                        }
                    },
                    error: () => {
                        host.error('Error in JSON response');
                        resolve(false);
                    }
                });
                DataTable.ajax(options);
            }
        });
        return p;
    },
    edit: async function (dt, oldState, newState, host) {
        let p = new Promise((resolve, reject) => {
            if (oldState.isStatic) {
                // Static states don't get sent to the server-side for storage,
                // so we just need to update the host's storage with the state.
                if (!oldState.id) {
                    oldState.id = host.randomId();
                }
                host.storeReplace(oldState, newState);
            }
            else {
                // Non-static (i.e. user) states, do get sent to the server.
                let options = util.object.assignDeep({
                    // Ajax properties that could be overridden
                    method: 'post',
                    dataType: 'json',
                    data: {
                        action: 'state-edit',
                        id: oldState.id,
                        isDefault: newState.isDefault,
                        isSharedOut: newState.isSharedOut,
                        name: newState.name,
                        path: window.location.pathname,
                        state: JSON.stringify(newState.state),
                        table: dt.table().node().id
                    }
                }, host.ajax(), {
                    // Ajax properties that can't be overridden
                    success: json => {
                        if (!json.error &&
                            json.data &&
                            json.data.length === 1) {
                            let state = json.data[0];
                            // Already JSON
                            if (typeof state.state === 'object') {
                                host.storeReplace(oldState, state);
                                resolve(true);
                            }
                            // Or string based
                            try {
                                state.state = JSON.parse(state.state);
                                host.storeReplace(oldState, state);
                                resolve(true);
                            }
                            catch (e) {
                                resolve(false);
                            }
                        }
                        else {
                            resolve(false);
                        }
                    },
                    error: () => {
                        host.error('Error in JSON response');
                        resolve(false);
                    }
                });
                DataTable.ajax(options);
            }
        });
        return p;
    },
    remove: async function (dt, states, host) {
        let p = new Promise((resolve, reject) => {
            // Can only deleted "owned" states
            let ids = states
                .filter(s => !s.isStatic && !s.isSharedIn)
                .map(s => s.id);
            if (ids.length) {
                let options = util.object.assignDeep({
                    // Ajax properties that could be overridden
                    method: 'post',
                    dataType: 'json',
                    data: {
                        action: 'state-remove',
                        ids: ids,
                        path: window.location.pathname,
                        table: dt.table().node().id
                    }
                }, host.ajax(), {
                    // Ajax properties that can't be overridden
                    success: json => {
                        if (!json.error) {
                            ids.forEach(id => {
                                let state = states.find(s => s.id === id);
                                if (state) {
                                    host.storeRemove(state);
                                }
                            });
                        }
                        else {
                            host.error(json.error);
                        }
                        resolve(true);
                    },
                    error: () => {
                        host.error('Error in JSON response');
                        resolve(false);
                    }
                });
                DataTable.ajax(options);
            }
        });
        return p;
    }
};

function localStorageName(dt) {
    return 'dtsr-' + location.pathname + '-' + dt.table().node().id;
}
/**
 * localStorage base for StateRestore. Really basic, the write actions just
 * write all states to the store.
 */
const local = {
    read: async function (dt) {
        let name = localStorageName(dt);
        let stored = localStorage.getItem(name);
        if (stored) {
            try {
                return JSON.parse(stored);
            }
            catch (e) {
                return [];
            }
        }
        // v1 compatibility - check if there are states from v1
        let states = [];
        var keys = Object.keys(localStorage);
        keys.forEach(key => {
            // Check if the key belongs to this page / table
            if (key.startsWith('DataTables_stateRestore_') &&
                (key.endsWith(location.pathname) ||
                    key.endsWith(location.pathname + '_' + dt.table().node().id))) {
                try {
                    let loadedState = JSON.parse(localStorage.getItem(key));
                    states.push({
                        id: null,
                        isDefault: false,
                        isSharedIn: false,
                        isSharedOut: false,
                        isStatic: false,
                        name: key
                            .replace(/^DataTables_stateRestore_/, '')
                            .replace(location.pathname, ''),
                        state: loadedState
                    });
                }
                catch (e) {
                    // noop
                }
            }
        });
        return states;
    },
    create: async function (dt, state, host) {
        if (!state.id) {
            // Create a random uid to act as the id for a local state
            state.id = host.randomId();
        }
        host.storeAdd(state);
        localStorage.setItem(localStorageName(dt), JSON.stringify(host.storeGet()));
        return true;
    },
    edit: async function (dt, oldState, newState, host) {
        host.storeReplace(oldState, newState);
        if (!oldState.isStatic) {
            localStorage.setItem(localStorageName(dt), JSON.stringify(host.storeGet()));
        }
        return true;
    },
    remove: async function (dt, states, host) {
        for (let i = 0; i < states.length; i++) {
            host.storeRemove(states[i]);
        }
        localStorage.setItem(localStorageName(dt), JSON.stringify(host.storeGet()));
        return true;
    }
};

// Sanity check
if (!DataTable || !DataTable.versionCheck || !DataTable.versionCheck('3')) {
    throw 'DataTables StateRestore requires DataTables 3 or newer';
}
const _modal = Dom.c('div').classAdd('dtsb-modal');
const _modalCloseButton = Dom.c('button')
    .classAdd('dtsb-modal-close')
    .attr('type', 'button')
    .html('&times;');
const _modalBackground = Dom.c('div').classAdd('dtsb-modal-background');
class States {
    static modalClean() {
        Dom.s(document).off('keyup.dtsr');
        _modal.empty().classRemove(States.classes.modal.table);
        _modalCloseButton.off('click');
        _modalBackground.off('click');
    }
    static modalClose() {
        _modal.remove();
        _modalBackground.remove();
    }
    static modal(title, body, className, close) {
        _modal.classAdd(className);
        _modalCloseButton.on('click', () => {
            close();
        });
        // Esc will close and cancel the modal
        Dom.s(document).on('keyup.dtsr', e => {
            e.stopPropagation();
            if (e.keyCode === 27) {
                close();
            }
        });
        _modal
            .append(Dom.c('div')
            .classAdd('dtsb-modal-header')
            .text(title)
            .append(_modalCloseButton))
            .append(Dom.c('div').classAdd('dtsb-modal-body').append(body))
            .appendTo('body');
        _modalBackground
            .on('click', () => {
            close();
        })
            .appendTo('body');
        // Initial focus
        _modal
            .find('input, button')
            .filter(':not(.dtsb-modal-close)')
            .eq(0)
            .focus();
    }
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Public methods
     */
    /**
     * Add a new state to the collection but taking the state object to be saved
     * (this will most likely come from `table.state()`), showing a modal to
     * allow customisation of it (name and which properties to include), then
     * eventually adding it to the collection.
     *
     * @param state DataTables state to save
     * @param name New name
     */
    add(state, newName = null, isStatic = false, isDefault = false) {
        if (isStatic) {
            this.s.store.push({
                id: null,
                isDefault,
                isSharedIn: false,
                isSharedOut: false,
                isStatic,
                name: newName || this._nextName(),
                state
            });
        }
        else {
            if (!this.c.canCreate) {
                return;
            }
            this._stateUserInput(this.s.dt.i18n('stateRestore.create.title', 'Save new state'), this.s.dt.i18n('stateRestore.create.info', ''), {
                id: null,
                isDefault,
                isSharedIn: false,
                isSharedOut: false,
                isStatic,
                name: newName || this._nextName(),
                state
            }, async (state) => {
                let result = await this.s.storage.create(this.s.dt, state, this);
                if (result) {
                    this.s.dt.trigger('stateRestore', ['create', state]);
                    this.modalClose();
                }
            });
        }
    }
    /**
     * Get the base Ajax configuration
     *
     * @returns Ajax configuration object
     */
    ajax() {
        return typeof this.c.ajax === 'string'
            ? {
                url: this.c.ajax
            }
            : this.c.ajax;
    }
    /**
     * Is an end user allowed to perform a particular action
     *
     * @returns Flag
     */
    can(action) {
        switch (action) {
            case 'create':
                return this.c.canCreate;
            case 'default':
                return this.c.defaults;
            case 'share':
                return this.c.sharing;
            default:
                return false;
        }
    }
    /**
     * Get the default state
     *
     * @returns DataTables state object
     */
    getDefault() {
        let state = this.s.store.find(s => s.isDefault);
        return state ? state.state : null;
    }
    /**
     * Check if a state is currently displayed. Note that a state is considered
     * to be active if its properties match those for the current state, however
     * it is not bidirectional - a current state could have additional
     * properties added to it (e.g. a new extension added) and they would not
     * be checked.
     *
     * @param state The state object to check
     */
    isCurrent(state) {
        // DataTables caches this, so it isn't an expensive call
        let currentState = this.s.dt.state();
        let keys = Object.keys(state);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            // Ignore time
            if (key === 'time') {
                continue;
            }
            if (!this._isEqual(state[key], currentState[key])) {
                return false;
            }
        }
        return true;
    }
    /**
     * Execute a function once the states have been loaded (allowing async
     * loading)
     *
     * @param cb Function to execute
     */
    loaded(cb) {
        if (this.s.loading) {
            this.s.whenLoaded.push(cb);
        }
        else {
            cb();
        }
    }
    /**
     * Edit a state's properties. Can be used to replace a state if a new state
     * object is passed in with the `state` property set.
     *
     * @param oldState State object to update
     */
    edit(oldState, newState, skipModal = false) {
        let idx = this.s.store.indexOf(oldState);
        if (idx !== -1) {
            // We need a copy of the object, in case it is rejected by an error
            // - i.e. we don't want to mutate the original object.
            let copy = util.object.assignDeep({}, oldState);
            let title = this.s.dt.i18n('stateRestore.edit.title', 'Edit state');
            let info = this.s.dt.i18n('stateRestore.edit.info', '');
            if (newState && newState.state) {
                title = this.s.dt.i18n('stateRestore.replace.title', 'Replace state');
                info = this.s.dt.i18n('stateRestore.replace.info', "Replace the currently saved state with the table's current state.");
            }
            // Shallow copy to allow partial input
            util.object.assign(copy, newState);
            this._stateUserInput(title, info, copy, async (state) => {
                let result = await this.s.storage.edit(this.s.dt, oldState, state, this);
                if (result) {
                    this.s.dt.trigger('stateRestore', ['edit', state]);
                    this.modalClose();
                }
            });
        }
    }
    /**
     * Error message to display
     *
     * @param msg
     */
    error(msg) {
        alert(msg);
    }
    /**
     * Display a modal, allowing for layering, so a modal can have an action
     * that will display an "inner" modal, but uses the same modal display,
     * and then allows it to be returned to.
     *
     * @param title Modal title
     * @param body Element to show in the modal body
     * @param wide Indicate if the modal should be wide
     */
    modal(title, body, wide = false) {
        // Add the modal to the layers, so we can restore to it if needed
        this.s.modalLayers.push({
            title,
            body,
            wide
        });
        // Tidy any existing modal
        States.modalClean();
        // And display
        States.modal(title, body, wide ? this.classes.modal.table : this.classes.modal.form, () => {
            this.modalClose();
        });
    }
    /**
     * Close a modal and if there are any layered above it, display them.
     */
    modalClose() {
        // Tidy up from the last modal
        States.modalClean();
        // Pop off the last state
        this.s.modalLayers.pop();
        // And if there are any left, then we need to display them again
        if (this.s.modalLayers.length) {
            let layer = this.s.modalLayers[this.s.modalLayers.length - 1];
            States.modal(layer.title, layer.body, layer.wide ? this.classes.modal.table : '', () => {
                this.modalClose();
            });
        }
        else {
            // Otherwise we close it off
            States.modalClose();
        }
    }
    /**
     * Get a random ID for client-side states
     *
     * @returns A random ID
     */
    randomId() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    }
    /**
     * Remove a state from the store
     *
     * @param state State object(s) to remove
     */
    remove(stateIn, skipConfirm = false) {
        let states = Array.isArray(stateIn) ? stateIn : [stateIn];
        if (states.length === 0) {
            return;
        }
        else if (skipConfirm) {
            this.s.storage.remove(this.s.dt, states, this);
        }
        else {
            let body = Dom.c('div')
                .classAdd(this.classes.removeMessage)
                .text(this.s.dt.i18n('stateRestore.remove.message', {
                _: 'Are you sure you wish to remove the following states:',
                1: 'Are you sure you wish to remove the following state:'
            }, states.length));
            let form = Dom.c('form').appendTo(body);
            let ul = Dom.c('ul').appendTo(form);
            states.forEach(s => {
                ul.append(Dom.c('li').text(s.name));
            });
            form.append(this._submitButton(this.s.dt.i18n('stateRestore.remove.button', 'Delete')));
            // Event handler for the submission
            form.on('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                let result = await this.s.storage.remove(this.s.dt, states, this);
                if (result) {
                    this.s.dt.trigger('stateRestore', ['remove']);
                    this.modalClose();
                }
            });
            this.modal(this.s.dt.i18n('stateRestore.title.remove', 'Delete state'), body);
        }
    }
    /**
     * Get the states stored for this table / instance
     *
     * @param includeStatics Indicate if static states should be included or not
     * @returns Array of states
     */
    storeGet(includeStatics = false) {
        if (includeStatics) {
            return this.s.store;
        }
        return this.s.store.filter(s => !s.isStatic);
    }
    /**
     * Add a new state to the store
     *
     * @param state To add
     */
    storeAdd(state) {
        this.s.store.push(state);
    }
    /**
     * Remove a state from the store
     *
     * @param state To remove
     * @returns Void
     */
    storeRemove(state) {
        let store = this.s.store;
        let idx = store.indexOf(state);
        if (state.isStatic) {
            return;
        }
        if (idx !== -1) {
            store.splice(idx, 1);
        }
    }
    storeReplace(oldState, newState) {
        let store = this.s.store;
        let idx = store.indexOf(oldState);
        if (oldState.isStatic) {
            return;
        }
        if (idx !== -1) {
            store.splice(idx, 1, newState);
        }
    }
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Constructor
     */
    constructor(host) {
        let dt = new DataTable.Api(host);
        let opts = dt.init().stateRestore;
        DataTable.plus('2026-09-11');
        this.c = util.object.assignDeep({}, States.defaults, DataTable.defaults.stateRestore, opts);
        // Defaults can only be used if `stateRestore` is in the initialisation
        // options (as that will add the state loader - it won't work without
        // it!)
        if (!opts) {
            this.c.defaults = false;
        }
        // Sharing is only relevant if there is Ajax, since otherwise there is
        // no way to states!
        if (!this.c.ajax) {
            this.c.sharing = false;
        }
        // Allow the new state name to be defined from the language object
        if (!this.c.newName) {
            this.c.newName = dt.i18n('stateRestore.newName', 'State #');
        }
        this.s = {
            dt: dt,
            loading: false,
            modalLayers: [],
            store: [],
            storage: this.c.ajax ? ajax : local,
            whenLoaded: []
        };
        this.classes = util.object.assignDeep({}, States.classes);
        let settings = this.s.dt.settings()[0];
        // Check if StateRestore has already been initialised on this table
        if (settings._states) {
            return;
        }
        settings._states = this;
        // Add predefined states to the list
        this._addPredefined(this.c.predefined);
        this.s.dt.on('xhr.dtsr', (e, s, json) => {
            if (json && json.stateRestore) {
                this._addPredefined(json.stateRestore);
            }
        });
        // Initial startup actions
        this._load();
    }
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Private methods
     */
    /**
     * Add predefined states to the list
     *
     * @param predefined Array of states, or object of states
     */
    async _addPredefined(predefined) {
        if (Array.isArray(predefined)) {
            predefined.forEach(s => {
                this.add(s.state, s.name, true, s.isDefault || false);
            });
        }
        else {
            // Legacy support - v1 used objects keyed by the state name
            Object.keys(predefined).forEach(k => {
                this.add(predefined[k], k, true, false);
            });
        }
    }
    /**
     * Load states and execute callbacks from `loaded()` when done
     */
    async _load() {
        this.s.loading = true;
        // Get the initial states
        let restore = await this.s.storage.read(this.s.dt, this);
        this.s.store.push(...restore);
        this.s.loading = false;
        this.s.dt.trigger('stateRestore', ['loaded']);
        // Execute callbacks
        this.s.whenLoaded.forEach(w => w());
        this.s.whenLoaded.length = 0;
    }
    /**
     * Display an editing field
     *
     * @param label Field label
     * @param info Extra field details
     * @param name Name for the input
     * @param value Value for the input
     * @param type Input type
     * @returns The DOM instance containing the element
     */
    _field(label, info, name, value, type = 'text') {
        let classes = this.classes.field;
        let field = Dom.c('div').classAdd(classes.container);
        Dom.c('label')
            .attr('for', 'dtsr-' + name)
            .classAdd(classes.label)
            .text(label)
            .appendTo(field);
        let inputContainer = Dom.c('div')
            .classAdd(classes.value)
            .appendTo(field);
        if (type === 'text') {
            Dom.c('input')
                .attr('id', 'dtsr-' + name)
                .attr('type', 'text')
                .attr('name', name)
                .attr('autocomplete', 'off')
                .val(value)
                .classAdd(classes.input.text)
                .appendTo(inputContainer);
        }
        else if (type === 'checkbox') {
            Dom.c('input')
                .attr('id', 'dtsr-' + name)
                .attr('type', 'checkbox')
                .attr('name', name)
                .prop('checked', value)
                .classAdd(classes.input.checkbox)
                .appendTo(inputContainer);
        }
        if (info) {
            Dom.c('div')
                .classAdd(classes.info)
                .text(info)
                .appendTo(inputContainer);
        }
        Dom.c('div').classAdd(classes.error).appendTo(inputContainer);
        return field;
    }
    /**
     * Display a field with checkboxes
     *
     * @param label Field label
     * @param checkboxes Checkboxes for the field
     * @returns The DOM instance containing the element
     */
    _fieldCheckboxes(label, checkboxes) {
        let classes = this.classes.field;
        let field = Dom.c('div').classAdd(classes.container);
        Dom.c('label').classAdd(classes.label).text(label).appendTo(field);
        let inputContainer = Dom.c('div')
            .classAdd(classes.value)
            .appendTo(field);
        checkboxes.forEach((checkbox, i) => {
            Dom.c('div')
                .classAdd(this.classes.field.checkboxOption)
                .appendTo(inputContainer)
                .append(Dom.c('input')
                .attr('type', 'checkbox')
                .attr('id', checkbox.name)
                .attr('name', checkbox.name)
                .prop('checked', checkbox.value)
                .classAdd(classes.input.checkbox)
                .appendTo(inputContainer))
                .append(Dom.c('label')
                .text(checkbox.label)
                .attr('for', checkbox.name));
        });
        return field;
    }
    /**
     * Check values to see if they are equal
     *
     * @param a First value
     * @param b Second value
     * @returns true if equal, false otherwise
     */
    _isEqual(a, b) {
        // Handles primitives, identical references, and NaN === NaN
        if (Object.is(a, b)) {
            return true;
        }
        // If either isn't an object (or is null), they aren't equal
        if (typeof a !== 'object' ||
            a === null ||
            typeof b !== 'object' ||
            b === null) {
            return false;
        }
        // Ensure both are arrays or both are standard objects
        if (Array.isArray(a) !== Array.isArray(b)) {
            return false;
        }
        const keysA = Object.keys(a);
        // Recursively compare each key/value pair
        for (const key of keysA) {
            if (!Object.prototype.hasOwnProperty.call(b, key) ||
                !this._isEqual(a[key], b[key])) {
                return false;
            }
        }
        return true;
    }
    /**
     * Determine the default name for the next state (used when creating a new
     * state).
     *
     * @returns New name
     */
    _nextName() {
        let matcher = new RegExp('^' + this.c.newName.replace('#', '(\\d?)') + '$');
        let found = [];
        this.s.store.forEach(state => {
            let match = state.name.match(matcher);
            if (match && match[1]) {
                found.push(parseInt(match[1]));
            }
        });
        found.sort((a, b) => b - a);
        let next = !found.length ? '1' : (found[0] + 1).toString();
        return this.c.newName.replace('#', next);
    }
    /**
     * Show a modal to get the user's options for this state
     */
    _stateUserInput(title, info, state, cb) {
        let body = Dom.c('div');
        let form = Dom.c('form').classAdd(this.classes.form).appendTo(body);
        let dt = this.s.dt;
        if (info) {
            form.append(Dom.c('p').text(info));
        }
        form.append(this._field(dt.i18n('stateRestore.state.name', 'Name:'), dt.i18n('stateRestore.state.nameInfo', ''), 'name', state.name));
        if (this.c.defaults) {
            form.append(this._field(dt.i18n('stateRestore.state.defaults', 'Default:'), dt.i18n('stateRestore.state.defaultsInfo', 'The state that is selected as the default will be used automatically when the page is loaded.'), 'default', state.isDefault, 'checkbox'));
        }
        if (this.c.sharing) {
            form.append(this._field(dt.i18n('stateRestore.state.share', 'Share:'), dt.i18n('stateRestore.state.shareInfo', 'Other users of the system will be able to use states that you share. They will not be able to edit the state.'), 'share', state.isSharedOut, 'checkbox'));
        }
        // List of options to that the user can toggle
        let checkboxes = [];
        for (const [name, manipulator] of Object.entries(stateManipulators)) {
            // null indicates that the user can make the selection themselves
            if (this.c.include[name] === null) {
                checkboxes.push({
                    name: name,
                    label: manipulator.text(dt),
                    value: true
                });
            }
        }
        if (checkboxes.length) {
            // Order the available checkboxes alphabetically
            checkboxes.sort((a, b) => a.name.localeCompare(b.name));
            form.append(this._fieldCheckboxes(dt.i18n('stateRestore.state.properties', 'State properties:'), checkboxes));
        }
        form.append(this._submitButton(dt.i18n('stateRestore.state.save', 'Save')));
        // Event handler for when the form is submitted
        form.on('submit', e => {
            e.preventDefault();
            // Post process the modal based on the inputs
            this._stateUserInputProcess(state, body, cb);
        });
        // Finally, show the modal
        this.modal(title, body);
    }
    /**
     * Once the end user submits the modal for saving the state, we need to
     * process it.
     *
     * @param state State to update based on the modal input
     * @param body Dom instance with the form elements
     * @param cb Callback for when the state has been updated
     */
    _stateUserInputProcess(state, body, cb) {
        let nameInput = body.find('input[name=name]');
        let nameError = nameInput
            .parent()
            .find('div.' + this.classes.field.error);
        let defaultInput = body.find('input[name=default]');
        let shareInput = body.find('input[name=share]');
        if (!nameInput.val()) {
            // Show error - name is required
            nameError.text(this.s.dt.i18n('stateRestore.state.nameRequired', 'A name is required for the state'));
            return;
        }
        else {
            state.name = nameInput.val();
            nameError.empty();
        }
        if (defaultInput.length) {
            state.isDefault = defaultInput.prop('checked');
            // If this is the default, no other state can be
            if (state.isDefault) {
                this.s.store
                    .filter(s => s !== state)
                    .forEach(s => (s.isDefault = false));
            }
        }
        if (shareInput.length) {
            state.isSharedOut = shareInput.prop('checked');
        }
        // Work through the list of options and see if they should be included /
        // excluded
        let includes = this.c.include;
        for (const [name, manipulator] of Object.entries(stateManipulators)) {
            if (includes[name] === null) {
                // User selectable, depends on the checkbox state
                if (!body.find(`input[name="${name}"]`).prop('checked')) {
                    manipulator.remove(state.state);
                }
            }
            else if (includes[name] === false) {
                // Options specify that the option shouldn't be included
                manipulator.remove(state.state);
            }
        }
        cb(state);
    }
    /**
     * Common create and submit button
     *
     * @param text Button text
     * @returns DOM element with the button
     */
    _submitButton(text) {
        // No need for a click submit event handler as this button will trigger
        // the `submit` event for the form.
        return Dom.c('div')
            .classAdd('dtsb-modal-buttons')
            .append(Dom.c('button')
            .classAdd(this.classes.modal.button)
            .text(text));
    }
}
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Statics
 */
States.classes = {
    field: {
        checkboxOption: '',
        container: 'dtsb-field',
        error: 'dtsb-field-error',
        info: 'dtsb-field-info',
        label: 'dtsb-field-label',
        value: 'dtsb-field-value',
        input: {
            checkbox: 'dtsb-field-input',
            text: 'dtsb-field-input'
        }
    },
    form: '',
    modal: {
        button: 'dtsb-modal-button',
        table: 'dtsb-modal_wide',
        form: ''
    },
    removeMessage: 'dtsb-remove-message',
    table: {
        table: 'display',
        button: 'dtsb-button'
    }
};
States.defaults = {
    ajax: null,
    canCreate: true,
    defaults: true,
    include: {
        cardView: true,
        columnVisibility: true,
        columnSearch: true,
        columnControl: true,
        columnOrder: true,
        order: true,
        pageStart: false,
        pageLength: true,
        scroller: false,
        search: true,
        searchBuilder: true,
        searchPanes: true,
        select: false
    },
    newName: null,
    sharing: true,
    predefined: []
};
States.manipulators = stateManipulators;
States.version = '2.0.0';

// The SVG for many of these icons are from Lucide ( https://lucide.dev ), which are available
// under the ISC License. There are a number of custom icons as well. These are optimised through
// https://optimize.svgomg.net/
function wrap(paths) {
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        paths +
        '</svg>');
}
const icons = {
    // square-arrow-right-enter
    shareIn: wrap('<path d="m10 16 4-4-4-4"/><path d="M3 12h11"/><path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/>'),
    // square-arrow-right-exit
    shareOut: wrap('<path d="M10 12h11"/><path d="m17 16 4-4-4-4"/><path d="M21 6.344V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1.344"/>'),
    // tick
    tick: wrap('<path d="M20 6 9 17l-5-5"/>'),
};

// Quite a few `any`s in this file, as Select is not a dependency of
// StateRestore as a whole, but is for this view of the states.
function setup(dt, hostButton) {
    let ctx = dt.settings()[0];
    if (!DataTable.select) {
        throw new Error("The Select extension is required for StateRestore's table view");
    }
    if (!ctx._statesTable) {
        ctx._statesTable = new StateTable(dt, hostButton);
    }
    ctx._statesTable.display();
}
class StateTable {
    /**
     * Show the table in a States modal
     */
    display() {
        this.s.states.modal('Saved states', Dom.s(this.s.statesDt.table().container()), true);
    }
    constructor(hostDt, hostButton) {
        let ctx = hostDt.settings()[0];
        if (!ctx._states) {
            new States(hostDt);
        }
        let states = ctx._states;
        let table = Dom.c('table').classAdd(States.classes.table.table);
        let statesDt = new DataTable(table[0], {
            columns: this._columns(states, hostDt),
            layout: {
                topStart: {
                    buttons: this._buttons(states, hostDt)
                }
            },
            paging: false,
            select: {
                style: 'os',
                selector: 'td:first-child'
            },
            order: [[1, 'asc']],
            scrollY: 300,
            scrollCollapse: true,
            rowId: 'id',
            language: {
                entries: hostDt.i18n('stateRestore.table.entries', {
                    _: 'states',
                    1: 'state'
                }, false)
            }
        });
        this.s = {
            hostButton,
            hostDt,
            states,
            statesDt
        };
        // Load button event handler
        statesDt.on('click', 'tbody button', function () {
            let row = statesDt.row(this.closest('tr')).data();
            hostDt.state(row.state).draw(false);
        });
        states.loaded(() => {
            statesDt.clear().rows.add(states.storeGet(true).slice()).draw();
        });
        hostDt
            .on('stateRestore', () => {
            // When the states change, we just redraw completely
            statesDt.clear().rows.add(states.storeGet(true).slice()).draw();
        })
            .on('draw', () => {
            // Update for the "current" state indicator
            statesDt.rows().invalidate().draw();
        });
    }
    /**
     * Create the list of buttons
     *
     * @param states Host states instance
     * @param hostDt Host DataTable
     * @returns Array of buttons
     */
    _buttons(states, hostDt) {
        // Create button is always active
        let buttons = [];
        if (states.can('create')) {
            // Create button is always enabled if available
            buttons.push({
                text: hostDt.i18n('stateRestore.button.create', 'Create state'),
                action: () => {
                    states.add(hostDt.state());
                }
            });
        }
        // A common action between buttons is to get the state, and moreover,
        // the actions can typically only be performed on states the user owns.
        let selectedData = (own) => {
            let selected = this.s.statesDt
                .rows({ selected: true })
                .data()
                .toArray();
            return own
                ? selected.filter(s => !s.isSharedIn && !s.isStatic)
                : selected;
        };
        // Edit button - only enable for a single state, and one which the user
        // can actually edit
        buttons.push({
            text: hostDt.i18n('stateRestore.button.edit', 'Edit'),
            action: () => {
                this.s.states.edit(selectedData(true)[0]);
            },
            init: function (dt) {
                this.disable();
                dt.on('select deselect', () => {
                    this.enable(selectedData(true).length === 1 &&
                        selectedData(false).length === 1);
                });
            }
        });
        // Replace button - same as edit for enablement
        buttons.push({
            extend: 'selectedSingle',
            text: hostDt.i18n('stateRestore.button.replace', 'Replace'),
            action: () => {
                let state = selectedData(true)[0];
                states.edit(state, { state: hostDt.state() });
            },
            init: function (dt) {
                this.disable();
                dt.on('select deselect', () => {
                    this.enable(selectedData(true).length === 1 &&
                        selectedData(false).length === 1);
                });
            }
        });
        // Copy button - any row can be copied (allowing it here in the table,
        // while the list view doesn't have a duplicate for one's own states)
        buttons.push({
            extend: 'selectedSingle',
            text: hostDt.i18n('stateRestore.button.duplicate', 'Copy'),
            action: () => {
                let state = selectedData(false)[0];
                states.add(state.state, state.name + hostDt.i18n('stateRestore.copyName', ' (copy)'));
            }
        });
        // Delete button - can only delete one's own states
        buttons.push({
            text: hostDt.i18n('stateRestore.button.remove', 'Delete'),
            action: () => {
                let state = selectedData(true);
                this.s.states.remove(state);
            },
            init: function (dt) {
                this.disable();
                dt.on('select deselect', () => {
                    this.enable(selectedData(true).length !== 0 &&
                        selectedData(true).length ===
                            selectedData(false).length);
                });
            }
        });
        return buttons;
    }
    /**
     * Define the columns for the DataTable
     *
     * @param states Host states instance
     * @returns Column array
     */
    _columns(states, hostDt) {
        let columns = [
            {
                orderable: false,
                render: DataTable.render.select()
            },
            {
                title: hostDt.i18n('stateRestore.table.name', 'Name'),
                data: 'name'
            },
            {
                title: hostDt.i18n('stateRestore.table.active', 'Active'),
                data: null,
                className: 'dt-center',
                render: data => (states.isCurrent(data.state) ? icons.tick : '')
            }
        ];
        if (states.can('default')) {
            columns.push({
                title: hostDt.i18n('stateRestore.table.default', 'Default'),
                data: 'isDefault',
                className: 'dt-center',
                render: data => (data ? icons.tick : '')
            });
        }
        if (states.can('share')) {
            columns.push({
                title: hostDt.i18n('stateRestore.table.share', 'Share'),
                data: null,
                className: 'dt-center',
                render: data => {
                    if (data.isSharedIn) {
                        return icons.shareIn;
                    }
                    else if (data.isSharedOut) {
                        return icons.shareOut;
                    }
                    return '';
                }
            });
        }
        columns.push({
            data: null,
            defaultContent: '<button class="' +
                States.classes.table.button +
                '">' +
                hostDt.i18n('stateRestore.table.load', 'Load') +
                '</button>',
            orderable: false
        });
        return columns;
    }
}


let buttonCounter = 0;
DataTable.ext.buttons.stateCreate = {
    action(e, dt, node, config) {
        let states = dt.settings()[0]._states;
        states.add(dt.state());
    },
    init(dt, node, config) {
        let ctx = dt.settings()[0];
        if (!ctx._states) {
            new States(dt);
        }
        if (!ctx._states.can('create')) {
            this.disable();
        }
    },
    text: dt => dt.i18n('stateRestore.button.create', 'Create state')
};
DataTable.ext.buttons.removeAllStates = {
    action(e, dt, node, config) {
        let ctx = dt.settings()[0];
        let states = ctx._states;
        // Get all owned states
        let myStates = states.storeGet().filter(s => !s.isSharedIn);
        states.remove(myStates);
    },
    init(dt, node, config) {
        let ctx = dt.settings()[0];
        if (!ctx._states) {
            new States(dt);
        }
        let states = ctx._states;
        dt.on('stateRestore', () => {
            this.enable(states.storeGet().length > 0);
        });
        this.enable(states.storeGet().length > 0);
    },
    text: dt => dt.i18n('stateRestore.button.statesRemoveAll', 'Remove all states')
};
DataTable.ext.buttons.statesList = {
    extend: 'collection',
    autoClose: true,
    action(e, dt, node, config, cb) {
        let states = dt.settings()[0]._states;
        let buttons = [];
        if (config.buttons && config.buttons.length) {
            config.buttons.forEach(btn => buttons.push(btn));
        }
        if (states.storeGet(true).length) {
            states.storeGet(true).forEach(state => {
                let namespace = '.dtst-' + buttonCounter++;
                let splits = [];
                // Split buttons
                if (!state.isSharedIn && !state.isStatic) {
                    // Edit and delete actions available for buttons which are
                    // owned by this user only.
                    splits.push({
                        text: dt.i18n('stateRestore.button.edit', 'Edit'),
                        action: () => {
                            states.edit(state);
                        }
                    });
                    splits.push({
                        text: dt.i18n('stateRestore.button.replace', 'Replace'),
                        action: () => {
                            states.edit(state, { state: dt.state() });
                        }
                    });
                    splits.push({
                        text: dt.i18n('stateRestore.button.remove', 'Delete'),
                        action: () => {
                            states.remove(state);
                        }
                    });
                }
                else {
                    // If the state is shared in or static, then we can't edit
                    // it, but we do allow it to be copied so that it can then
                    // be edited
                    if (states.can('create')) {
                        splits.push({
                            text: dt.i18n('stateRestore.button.duplicate', 'Copy'),
                            action: () => {
                                states.add(state.state, state.name +
                                    dt.i18n('stateRestore.copyName', ' (copy)'));
                            }
                        });
                    }
                }
                buttons.push({
                    action: (e, dt) => {
                        dt.state(state.state).draw(false);
                    },
                    popoverTitle: util.escapeHtml(state.name),
                    split: splits,
                    init: function (dt) {
                        // This is only really needed for a change of state when the
                        // dropdown is open, since the dropdown redraws every time
                        // it is displayed.
                        dt.on('draw' + namespace, () => {
                            this.active(states.isCurrent(state.state));
                        });
                        this.active(states.isCurrent(state.state));
                    },
                    destroy: function (dt) {
                        dt.off('draw' + namespace);
                    },
                    text: util.escapeHtml(state.name)
                });
            });
        }
        else {
            buttons.push({
                extend: 'spacer',
                text: dt.i18n('stateRestore.button.empty', 'No saved states'),
                style: 'empty'
            });
        }
        dt.button(node).collectionRebuild(buttons);
        DataTable.ext.buttons.collection.action.call(this, e, dt, node, config, cb);
    },
    buttons: [],
    text: dt => dt.i18n('stateRestore.button.statesList', 'Saved states')
};
DataTable.ext.buttons.statesTable = {
    autoClose: true,
    action(e, dt, node, config, cb) {
        setup(dt, node);
    },
    buttons: [],
    text: dt => dt.i18n('stateRestore.button.statesTable', 'Saved states')
};
// Legacy aliases
DataTable.ext.buttons.createState = DataTable.ext.buttons.stateCreate;
DataTable.ext.buttons.savedStates = DataTable.ext.buttons.statesList;
DataTable.ext.buttons.removeAllStates = DataTable.ext.buttons.statesRemoveAll;
// Attach a listener to the document which listens for DataTables initialisation
// events so we can automatically initialise
Dom.s(document).on('options.dt.stateRestore', function (e, init) {
    if (e.namespace !== 'dt') {
        return;
    }
    if (init.stateRestore || DataTable.defaults.stateRestore) {
        // We need to allow the DataTable to load an initial state, which it
        // does using its `stateSave` feature, so it has to be enabled, and then
        // restored to what the dev wants the value to be, once we've made use
        // of it.
        let initialValue = init.stateSave || DataTable.defaults.stateSave;
        init.stateSave = true;
        init.stateLoadCallback = (ctx, cb) => {
            let controller = ctx._states || new States(ctx);
            // stateLoadCallback uses the callback if the return from its
            // function is undefined, but it doesn't accept a Promise
            // itself, and we need the function to return before executing the
            // callback, so use a setTimeout
            setTimeout(async () => {
                controller.loaded(() => {
                    // Get default
                    let def = controller.getDefault();
                    // Callback state
                    cb(def || {}, true);
                });
            }, 10);
            // Restore state saving feature to dev's selection.
            ctx.features.stateSave = initialValue;
        };
    }
});
/*
 * DT API interface
 */
Api.register('stateRestore()', function () {
    return this;
});
Api.register('stateRestore.activeStates()', function () {
    let states = this.context[0]._states;
    if (!states) {
        return this;
    }
    return this.inst(this.context, states.storeGet().filter(s => states.isCurrent(s.state)));
});
Api.register('stateRestore.state()', function (id) {
    let inst = this.inst(this.context);
    let states = this.context[0]._states;
    if (states) {
        inst._stateSelected = states.storeGet().find(s => id === s.id);
    }
    return inst;
});
Api.register('stateRestore.add()', function (name) {
    let states = this.context[0]._states;
    if (states) {
        states.add(this.state(), name, false, false);
    }
    return this;
});
Api.register('stateRestore.state().details()', function () {
    return this._stateSelected || null;
});
Api.register('stateRestore.state().load()', function () {
    let selected = this._stateSelected;
    if (selected) {
        this.state(selected.state).draw(false);
    }
    return this;
});
Api.register('stateRestore.state().remove()', function (skipConfirm = false) {
    let states = this.context[0]._states;
    let selected = this._stateSelected;
    if (states && selected) {
        states.remove(selected, skipConfirm);
    }
});
Api.register('stateRestore.state().isActive()', function () {
    let states = this.context[0]._states;
    let selected = this._stateSelected;
    return states && selected ? states.isCurrent(selected) : false;
});
Api.register('stateRestore.state().rename()', function (name) {
    let states = this.context[0]._states;
    let selected = this._stateSelected;
    if (states && selected && name) {
        states.edit(selected, {
            name
        }, true);
    }
    return this;
});
Api.register('stateRestore.state().edit()', function () {
    let states = this.context[0]._states;
    let selected = this._stateSelected;
    if (states && selected) {
        states.edit(selected);
    }
    return this;
});
Api.register('stateRestore.state().save()', function (skipModal = false) {
    let states = this.context[0]._states;
    let selected = this._stateSelected;
    if (states && selected) {
        states.edit(selected, {
            state: this.state()
        }, skipModal);
    }
    return this;
});
Api.register('stateRestore.states()', function (idOrIds) {
    let inst = this.inst(this.context);
    let states = this.context[0]._states;
    if (states) {
        let ids = idOrIds
            ? Array.isArray(idOrIds)
                ? idOrIds
                : [idOrIds]
            : states.storeGet(true).map(s => s.id);
        inst._statesSelected = states
            .storeGet()
            .filter(s => ids.includes(s.id));
    }
    return inst;
});
Api.register('stateRestore.states().details()', function () {
    return this._statesSelected || [];
});
Api.register('stateRestore.states().remove()', function (skipConfirm = false) {
    let states = this.context[0]._states;
    let selected = this._statesSelected;
    if (states && selected) {
        states.remove(selected, skipConfirm);
    }
    return this;
});
DataTable.StateRestore = States;


return DataTable;
}));

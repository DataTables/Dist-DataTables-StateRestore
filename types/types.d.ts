import { Api, Dom, StateLoad, AjaxOptions, Context } from 'datatables.net';

interface Manipulator {
    /**
     * Determine if the option should be shown to the end user based on the
     * state object (i.e. there is no point in showing the end user the option
     * to store card view information, if CardView isn't in the state object!)
     *
     * Any is used for some as the state definition from DataTables core doesn't
     * include all of the extension properties.
     *
     * @param state DataTables state object to check
     * @returns true if the option is present, false otherwise.
     */
    available: (state: any) => boolean;
    /**
     * Remove the value from the state (user has selected not to include it).
     *
     * @param state
     * @returns
     */
    remove: (state: any) => void;
    /**
     * Text to show for the option
     *
     * @param dt DataTable API instance
     * @returns Text to show
     */
    text: (dt: Api) => string;
}
interface ManipulatorOptions {
    /** CardView extension's status */
    cardView: boolean | null;
    /** Column visibility */
    columnVisibility: boolean | null;
    /** Column specific search */
    columnSearch: boolean | null;
    /** ColumnControl extension's filters */
    columnControl: boolean | null;
    /** ColReorder extension's status */
    columnOrder: boolean | null;
    /** Data order (sorting) */
    order: boolean | null;
    /** Page start */
    pageStart: boolean | null;
    /** Page length */
    pageLength: boolean | null;
    /** Scroller extension's status */
    scroller: boolean | null;
    /** Search information */
    search: boolean | null;
    /** SearchBuilder extension's filters */
    searchBuilder: boolean | null;
    /** SearchPanes extension's filters */
    searchPanes: boolean | null;
    /** Select extension's state */
    select: boolean | null;
}

declare class States {
    static classes: Classes;
    static defaults: Defaults;
    static modalClean(): void;
    static modalClose(): void;
    static modal(title: string, body: Dom, className: string, close: () => void): void;
    static manipulators: Record<keyof ManipulatorOptions, Manipulator>;
    static version: string;
    private c;
    private s;
    private classes;
    /**
     * Add a new state to the collection but taking the state object to be saved
     * (this will most likely come from `table.state()`), showing a modal to
     * allow customisation of it (name and which properties to include), then
     * eventually adding it to the collection.
     *
     * @param state DataTables state to save
     * @param name New name
     */
    add(state: StateLoad, newName?: string | null, isStatic?: boolean, isDefault?: boolean): void;
    /**
     * Get the base Ajax configuration
     *
     * @returns Ajax configuration object
     */
    ajax(): AjaxOptions;
    /**
     * Is an end user allowed to perform a particular action
     *
     * @returns Flag
     */
    can(action: 'create' | 'default' | 'share'): boolean;
    /**
     * Get the default state
     *
     * @returns DataTables state object
     */
    getDefault(): StateLoad | null;
    /**
     * Check if a state is currently displayed. Note that a state is considered
     * to be active if its properties match those for the current state, however
     * it is not bidirectional - a current state could have additional
     * properties added to it (e.g. a new extension added) and they would not
     * be checked.
     *
     * @param state The state object to check
     */
    isCurrent(state: StateLoad): boolean;
    /**
     * Execute a function once the states have been loaded (allowing async
     * loading)
     *
     * @param cb Function to execute
     */
    loaded(cb: () => void): void;
    /**
     * Edit a state's properties. Can be used to replace a state if a new state
     * object is passed in with the `state` property set.
     *
     * @param oldState State object to update
     */
    edit(oldState: State, newState?: Partial<State>, skipModal?: boolean): void;
    /**
     * Error message to display
     *
     * @param msg
     */
    error(msg: string): void;
    /**
     * Display a modal, allowing for layering, so a modal can have an action
     * that will display an "inner" modal, but uses the same modal display,
     * and then allows it to be returned to.
     *
     * @param title Modal title
     * @param body Element to show in the modal body
     * @param wide Indicate if the modal should be wide
     */
    modal(title: string, body: Dom, wide?: boolean): void;
    /**
     * Close a modal and if there are any layered above it, display them.
     */
    modalClose(): void;
    /**
     * Get a random ID for client-side states
     *
     * @returns A random ID
     */
    randomId(): string;
    /**
     * Remove a state from the store
     *
     * @param state State object(s) to remove
     */
    remove(stateIn: State | State[], skipConfirm?: boolean): void;
    /**
     * Get the states stored for this table / instance
     *
     * @param includeStatics Indicate if static states should be included or not
     * @returns Array of states
     */
    storeGet(includeStatics?: boolean): State[];
    /**
     * Add a new state to the store
     *
     * @param state To add
     */
    storeAdd(state: State): void;
    /**
     * Remove a state from the store
     *
     * @param state To remove
     * @returns Void
     */
    storeRemove(state: State): void;
    storeReplace(oldState: State, newState: State): void;
    constructor(host: Context | Api);
    /**
     * Add predefined states to the list
     *
     * @param predefined Array of states, or object of states
     */
    private _addPredefined;
    /**
     * Load states and execute callbacks from `loaded()` when done
     */
    private _load;
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
    private _field;
    /**
     * Display a field with checkboxes
     *
     * @param label Field label
     * @param checkboxes Checkboxes for the field
     * @returns The DOM instance containing the element
     */
    private _fieldCheckboxes;
    /**
     * Check values to see if they are equal
     *
     * @param a First value
     * @param b Second value
     * @returns true if equal, false otherwise
     */
    private _isEqual;
    /**
     * Determine the default name for the next state (used when creating a new
     * state).
     *
     * @returns New name
     */
    private _nextName;
    /**
     * Show a modal to get the user's options for this state
     */
    private _stateUserInput;
    /**
     * Once the end user submits the modal for saving the state, we need to
     * process it.
     *
     * @param state State to update based on the modal input
     * @param body Dom instance with the form elements
     * @param cb Callback for when the state has been updated
     */
    private _stateUserInputProcess;
    /**
     * Common create and submit button
     *
     * @param text Button text
     * @returns DOM element with the button
     */
    private _submitButton;
}

declare class StateTable {
    private s;
    /**
     * Show the table in a States modal
     */
    display(): void;
    constructor(hostDt: any, hostButton: any);
    /**
     * Create the list of buttons
     *
     * @param states Host states instance
     * @param hostDt Host DataTable
     * @returns Array of buttons
     */
    private _buttons;
    /**
     * Define the columns for the DataTable
     *
     * @param states Host states instance
     * @returns Column array
     */
    private _columns;
}

declare module 'datatables.net' {
    interface Options {
        /**
         * StateRestore extension options
         */
        stateRestore?: Partial<Config>;
    }
    interface Defaults {
        /**
         * StateRestore extension defaults
         */
        stateRestore?: Config;
    }
    interface Language {
        /**
         * StateRestore language options
         */
        stateRestore?: {
            stateRestore?: {
                button?: {
                    create?: string;
                    duplicate?: string;
                    edit?: string;
                    empty?: string;
                    replace?: string;
                    remove?: string;
                    statesRemoveAll?: string;
                    statesList?: string;
                };
                create?: {
                    title?: string;
                    info?: string;
                };
                edit?: {
                    title?: string;
                    info?: string;
                };
                replace?: {
                    title?: string;
                    info?: string;
                };
                remove?: {
                    button?: string;
                    title?: string;
                    message?: {
                        _?: string;
                        1?: string;
                    };
                };
                state?: {
                    name?: string;
                    nameInfo?: string;
                    nameRequired?: string;
                    defaults?: string;
                    defaultsInfo?: string;
                    save?: string;
                    share?: string;
                    shareInfo?: string;
                    properties?: string;
                };
                table?: {
                    active?: string;
                    default?: string;
                    entries?: {
                        1?: string;
                        _?: string;
                    };
                    load?: string;
                    name?: string;
                    share?: string;
                };
                copyName?: string;
                newName?: string;
            };
        };
    }
    interface Context {
        /**
         * State restore collection
         */
        _states: States;
        /**
         * State table wrapper
         */
        _statesTable: StateTable;
    }
    interface Api<T> {
        /**
         * StateRestore API Methods
         */
        stateRestore: ApiStateRestore<T>;
    }
    interface DataTablesStatic {
        /**
         * Responsive class
         */
        StateRestore: typeof States;
    }
}
interface ApiStateRestore<T> {
    /**
     * Creates a new state, adding it to the collection.
     *
     * @param identifier The identifier that is to be used for the new state
     * @returns DataTables Api for chaining
     */
    activeStates(): Api<State>;
    /**
     * Add a new state
     *
     * @param Name for the state
     * @returns DataTables Api for chaining
     */
    add(name: string | number): Api<T>;
    /**
     * Retrieves a state from the collection.
     *
     * @param identifier The identifier of the state that is to be retrieved.
     * @returns StateRestore instance, or further api methods.
     */
    state(identifier: string | number): StateRestoreStateMethods<T>;
    /**
     * Retrieves all of the states from the collection.
     *
     * @returns An array of the StateRestore instances, or further api methods
     *   that are applicable to multiple states.
     */
    states(identifier?: string | number | Array<string | number>): StateRestoreStatesMethods<T>;
}
interface StateRestoreStateMethods<T> extends Api<T> {
    /**
     * Get the state details object
     */
    details(): State;
    /**
     * Edit an existing state
     *
     * @returns DataTables Api for chaining.
     */
    edit(): Api<T>;
    /**
     * Flag to indicate if a state is currently active or not
     */
    isActive(): boolean;
    /**
     * Apply the selected state to the table
     *
     * @returns DataTables Api for chaining.
     */
    load(): Api<T>;
    /**
     * Delete the selected state
     *
     * @returns DataTables Api for chaining.
     */
    remove(skipConfirm: boolean): Api<T>;
    /**
     * Rename the selected state
     *
     * @returns DataTables Api for chaining.
     */
    rename(name: string): Api<T>;
    /**
     * Save the table's current state into the selected state
     *
     * @returns DataTables Api for chaining.
     */
    save(): Api<T>;
}
interface StateRestoreStatesMethods<T> extends Api<T> {
    /**
     * Get the details for the selected states
     *
     * @returns DataTables Api for chaining.
     */
    details(): Api<State>;
    /**
     * Delete all selected states
     *
     * @returns DataTables Api for chaining.
     */
    remove(): Api<T>;
}
interface Classes {
    field: {
        container: string;
        error: string;
        info: string;
        label: string;
        value: string;
        input: {
            checkbox: string;
            text: string;
        };
        checkboxOption: string;
    };
    form: string;
    modal: {
        button: string;
        table: string;
        form: string;
    };
    removeMessage: string;
    table: {
        table: string;
        button: string;
    };
}
interface Defaults {
    /** Ajax URL to save / load states */
    ajax: AjaxOptions | string | null;
    /**
     * The end user is allowed to create new states
     */
    canCreate: boolean;
    /**
     * Allow the end user to set a default state
     */
    defaults: boolean;
    /**
     * What values should be included in the states being saved. For each:
     *
     * * `true` means that it will be included
     * * `false` means that it will not be includes
     * * `null` will give the end user the option to have it included or not.
     */
    include: ManipulatorOptions;
    /**
     * The base name that will be used for new state names. It _must_ include
     * `#` where you want a number to appear (to allow multiple states with
     * consecutive numbering).
     */
    newName: string;
    /**
     * Set of predefined states
     */
    predefined: Predefined[] | Record<string, StateLoad>;
    /**
     * Indicate if states can be shared between users. Note that this requires
     * `ajax` to be specified for remote state storage.
     */
    sharing: boolean;
}
interface Predefined {
    /**
     * Name to give the state
     */
    name: string;
    /**
     * State to load
     */
    state: StateLoad;
    /**
     * Indicate if the state should be the default one. Can be overridden by an
     * end user selecting to have one of their own states as the default.
     */
    isDefault: boolean;
}
interface Config extends Partial<Defaults> {
}
interface Settings {
    /** DataTables API to the table this States instance manages */
    dt: Api;
    /** Flag to indicate when async loading is happening */
    loading: boolean;
    /** Modal nesting */
    modalLayers: Array<{
        title: string;
        body: Dom;
        wide: boolean;
    }>;
    /** States that have been stored and saved by this instance */
    store: Array<State>;
    /** Remote storage API */
    storage: Storage;
    /** Callbacks to execute when states have been loaded */
    whenLoaded: Array<() => void>;
}
interface State {
    /**
     * Unique ID for the state.
     */
    id: number | string | null;
    /**
     * Indicator to say if the state is the default one.
     */
    isDefault: boolean;
    /**
     * Indicator to say if the state is owned by someone else
     */
    isSharedIn: boolean;
    /**
     * Indicator to say if this state is shared to other users
     */
    isSharedOut: boolean;
    /**
     * A static state is a predefined one - it cannot be edited or deleted as
     * it will simply be there on reload. However, it can be duplicated so the
     * client can have their own copy (if they wanted).
     */
    isStatic: boolean;
    /**
     * Name of the state
     */
    name: string;
    /**
     * The table static itself
     */
    state: StateLoad;
}
interface Checkbox {
    name: string;
    label: string;
    value: boolean;
}
/**
 * Storage controllers for where the data for the states should be "permanently"
 * stored.
 *
 * Note that the storage controllers must also manipulate the `store` array in
 * this States object. This is to allow them to do it before or after the data
 * has been saved / submitted, to allow for easy management and error flow
 * control.
 */
interface Storage {
    /**
     * Get all states
     *
     * @param dt Host DataTable
     * @param host States object
     * @returns Array of the states
     */
    read: (dt: Api, host: States) => Promise<State[]>;
    /**
     * State a new state
     *
     * @param dt Host DataTable
     * @param state New state
     * @param host States object
     * @returns True if everything is okay, false if not.
     */
    create: (dt: Api, state: State, host: States) => Promise<boolean>;
    /**
     * Update an existing state
     *
     * @param dt Host DataTable
     * @param oldState State object that needs to be updated
     * @param newState The new state object
     * @param host States object
     * @returns True if everything is okay, false if not.
     */
    edit: (dt: Api, oldState: State, newState: State, host: States) => Promise<boolean>;
    /**
     * Delete an existing state
     *
     * @param dt Host DataTable
     * @param states States to remove
     * @param host States object
     * @returns True if everything is okay, false if not.
     */
    remove: (dt: Api, states: State[], host: States) => Promise<boolean>;
}

export type { Checkbox, Classes, Config, Defaults, Predefined, Settings, State, Storage };

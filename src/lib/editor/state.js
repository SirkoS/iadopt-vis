
/**
 * @typedef FormState
 * @type {object}
 * @property {Concept} editComp     component currently being edited
 * @property {Concept} sourceComp   component to connect a new component to
 * @property {Variable} variable    link to currently processed variable
 * @property {Map} action2comp        mapping of actions to their corresponding Variable component
 */

// keep the current state of the form
export const /** @type {FormState} */ state = {
  variable:   null,
  editComp:   null,
  sourceComp: null,

  action2comp: new Map(),
};

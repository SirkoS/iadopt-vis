/**
 * @typedef {Object.<string, string>} Localized
 */



export class Concept {

  static #langPref = ['en', '' ];

  /** @type {Variable} */
  #variable;

  /** @type {string} */
  _iri;
  /** @type {string} */
  _shortIri;
  /** @type {Localized} */
  _label = {};
  /** @type {Localized} */
  _comment = {};
  /** @type {boolean} */
  _isBlank;
  /** @type {Array.<Constraint>} */
  _constrained = [];


  /**
   *
   * @param {object}    p
   * @param {string}    p.iri
   * @param {string}    p.shortiri
   * @param {Localized} p.label
   * @param {Localized} p.comment
   * @param {boolean}   p.isblank
   */
  constructor({ iri, shortiri, label, comment } = {}) {
    this._iri      = iri;
    this._shortIri = shortiri;
    this._isBlank  = !iri;

    // prune empty labels/comments before adding
    this._label    = Object.fromEntries( Object.entries( label ).filter( ([_, val]) => val ) );
    this._comment  = Object.fromEntries( Object.entries( comment ).filter( ([_, val]) => val ) );

  }



  /**
   * clones this Concept but removes constrains if present
   * @returns {Concept}
   */
  clone() {
    return new Concept({
      iri:      this._iri,
      shortiri: this._shortIri,
      label:    JSON.parse( JSON.stringify( this._label )),
      comment:  JSON.parse( JSON.stringify( this._comment )),
      isblank:  this._isBlank,
    });
  }



  /**
   * @param {Variable} variable
   */
  setVariable( variable ){
    this.#variable = variable;
  }



  /**
   * @returns {Variable}
   */
  getVariable(){
    return this.#variable;
  }


  /**
   *
   * @returns {string}
   */
  getIri(){
    return this._iri;
  }


  /**
   *
   * @returns {string}
   */
  getShortIri(){
    return this._shortIri;
  }


  /**
   *
   * @returns {boolean}
   */
  isBlank(){
    return this._isBlank;
  }


  /**
   *
   * @returns {string}
   */
  getLabel(){
    for( const lang of Concept.#langPref ) {
      if ( lang in this._label ) {
        return this._label[ lang ];
      }
    }
    return Object.values( this._label )[ 0 ];
  }


  /**
   *
   * @returns {string}
   */
  getComment(){
    for( const lang of Concept.#langPref ) {
      if ( lang in this._comment ) {
        return this._comment[ lang ];
      }
    }
    return Object.values( this._comment )[ 0 ];
  }

}


/* XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */


export class Variable extends Concept {

  /** @type {Concept} */
  #property;
  /** @type {Concept} */
  #ooi;
  /** @type {Concept} */
  #matrix;
  /** @type {Array.<Concept>} */
  #context = [];
  /** @type {Array.<Constraint>} */
  #constraints = [];



  /**
   * @param {Concept} prop
   */
  setProperty( prop ) {
    prop.setVariable( this );
    this.#property = prop;
  }


  /**
   * @param {Concept} ooi
   */
  setObjectOfInterest( ooi ) {
    ooi.setVariable( this );
    this.#ooi = ooi;
  }


  /**
   * @param {Concept} matrix
   */
  setMatrix( matrix ) {
    matrix.setVariable( this );
    this.#matrix = matrix;
  }


  /**
   * @param {Concept} ctx
   */
  addContextObject( ctx ) {
    ctx.setVariable( this );
    this.#context.push( ctx );
  }


  /**
   * @param {Constraint}  constraint
   * @param {...Concept}  entities
   */
  addConstraint( constraint, ...entities ) {

    // check that entity is assigned to this variable
    if( entities.some( (e) => e.getVariable() != this ) ) {
      throw Error('Can only constrain entities of the same variable!');
    }

    // add reverse links
    for ( const entity of entities ) {
      entity.addConstraint( constraint );
      constraint.addEntity( entity );
    }

    this.#constraints.push( constraint );

  }


  /**
   *
   * @returns {Entity}
   */
  getProperty() {
    return this.#property;
  }


  /**
   *
   * @returns {Entity}
   */
  getObjectOfInterest() {
    return this.#ooi;
  }


  /**
   *
   * @returns {Entity}
   */
  getMatrix() {
    return this.#matrix;
  }


  /**
   *
   * @returns {Array.<Entity>}
   */
  getContextObjects() {
    return this.#context.slice( 0 );
  }


  /**
   *
   * @returns {Array.<Constraint>}
   */
  getConstraints() {
    return this.#constraints.slice( 0 );
  }



  toString() {
    return `[Variable ${ this._iri ? `(${this._iri})` : '(_blank)' }`
  + (
    Object.values( this._label ).length
     ? '\n  label:\n' + Object.entries(this._label).map( ([ key, value] ) => `    ${key}: ${value}` ).join('\n')
     : ''
  )
  + (
    Object.values( this._comment ).length
     ? '\n  comment:\n' + Object.entries(this._comment).map( ([ key, value] ) => `    ${key}: ${value}` ).join('\n')
     : ''
  ) + `
  Property:
${this.#property ? this.#property.toString().split('\n').map( (l) => `    ${l}` ).join('\n') : '-' }
  ObjectOfInterest:
${this.#ooi ? this.#ooi.toString().split('\n').map( (l) => `    ${l}` ).join('\n') : '-' }
  Matrix:
${this.#matrix ? this.#matrix.toString().split('\n').map( (l) => `    ${l}` ).join('\n') : '-' }
  ContextObject:
${this.#context.length ? this.#context.map( (c) => c.toString().split('\n').map( (l) => `    ${l}` ).join('\n') ).join( '\n' ) : '-' }
]`;
  }


}


/* XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

export class Constraint extends Concept {

  /** @type {Array.<Concept>} */
  #constrains = [];

  /**
   *
   * @param {Concept} ent
   */
  addEntity( ent ) {
    this.#constrains.push( ent );
  }


  toString() {
    return `[Constraint ${ this._iri ? `(${this._iri})` : '(_blank)' }`
  + (
    Object.values( this._label ).length
     ? '\n  label:\n' + Object.entries(this._label).map( ([ key, value] ) => `    ${key}: ${value}` ).join('\n')
     : ''
  )
  + (
    Object.values( this._comment ).length
     ? '\n  comment:\n' + Object.entries(this._comment).map( ([ key, value] ) => `    ${key}: ${value}` ).join('\n')
     : ''
  )
  //  + `
  //  constrains:
  // ${this.#constrains.map( (c) => `    - ${c.getIri()}` ).join('\n') }
  + '\n]';
  }

}


/* XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

export class Entity extends Concept {

  /** @typedef {Array.<Constraint>} */
  #constrained = [];

  /**
   *
   * @param {Constraint} constraint
   */
  addConstraint( constraint ) {
    this.#constrained.push( constraint );
  }


  /**
   *
   * @returns {Array.<Constraint>}
   */
  getConstraints() {
    return Array.from( this.#constrained );
  }

  toString() {
    return `[Entity ${ this._iri ? `(${this._iri})` : '(_blank)' }`
  + (
    Object.values( this._label ).length
     ? '\n  label:\n' + Object.entries(this._label).map( ([ key, value] ) => `    ${key}: ${value}` ).join('\n')
     : ''
  )
  + (
    Object.values( this._comment ).length
     ? '\n  comment:\n' + Object.entries(this._comment).map( ([ key, value] ) => `    ${key}: ${value}` ).join('\n')
     : ''
  )
  + (
    Object.values( this.#constrained ).length
      ? '\n  constrained:\n' +
        this.#constrained
          .map(
            (c) => c.toString()
              .split('\n')
              .map( (l) => `    ${l}` )
              .join('\n')
          )
          .join( '\n' )
      : '-'
  ) + `
]`;
  }
}
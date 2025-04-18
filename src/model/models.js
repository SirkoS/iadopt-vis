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
  /** @type {string} */
  #role = '';


  /**
   *
   * @param {object}    p
   * @param {string}    p.iri
   * @param {string}    p.shortIri
   * @param {Localized} p.label
   * @param {Localized} p.comment
   * @param {boolean}   p.isBlank
   */
  constructor({ iri, shortIri, label, comment, isBlank } = {}) {
    this._iri      = iri;
    this._shortIri = shortIri;
    this._isBlank  = isBlank ?? !iri;

    // prune empty labels/comments before adding
    this._label    = Object.fromEntries( Object.entries( label ?? {} ).filter( ([_, val]) => val ) );
    this._comment  = Object.fromEntries( Object.entries( comment ?? {} ).filter( ([_, val]) => val ) );

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
   * @params {string} lang
   * @params {string} label
   */
  setLabel( lang, label ){
    this._label[ lang ] = label;
  }


  /**
   *
   * @returns {string}
   */
  getLabel(){

    // preferred language
    for( const lang of Concept.#langPref ) {
      if ( lang in this._label ) {
        return this._label[ lang ];
      }
    }

    // any language
    let label = Object.values( this._label )[ 0 ];
    if( label ) {
      return label;
    }

    // extract from URL
    const fragments = this._iri.split( '/' );
    return fragments.pop() || fragments.pop() || '[missing label]';

  }


  /**
   *
   * @params {string} lang
   * @params {string} comment
   */
  setComment( lang, comment ){
    this._comment[ lang ] = comment;
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


  /**
   *
   * @param {string} role
   */
  setRole( role ) {
    this.#role = role;
  }


  /**
   *
   * @returns {string}
   */
  getRole() {
    return this.#role;
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
  /** @type {Concept} */
  #statisticalModifier;
  /** @type {Array.<Concept>} */
  #context = [];
  /** @type {Array.<Constraint>} */
  #constraints = [];



  /**
   * @param {Property} prop
   */
  setProperty( prop ) {
    if( !(prop instanceof Property) ) {
      throw new Error( 'Can only assign instances of Property!' );
    }
    prop.setVariable( this );
    prop.setRole( 'Property' );
    this.#property = prop;
  }


  /**
   * @param {Entity} ooi
   */
  setObjectOfInterest( ooi ) {
    if( !(ooi instanceof Entity) ) {
      throw new Error( 'Can only assign instances of Entity!' );
    }
    ooi.setVariable( this );
    ooi.setRole( 'OoI' );
    this.#ooi = ooi;
  }


  /**
   * @param {Entity} matrix
   */
  setMatrix( matrix ) {
    if( !(matrix instanceof Entity) ) {
      throw new Error( 'Can only assign instances of Entity!' );
    }
    matrix.setVariable( this );
    matrix.setRole( 'Matrix' );
    this.#matrix = matrix;
  }


  /**
   * @param {Entity} statModifier
   */
  addStatisticalModifier( statModifier ) {
    if( !(statModifier instanceof Entity) ) {
      throw new Error( 'Can only assign instances of Entity!' );
    }
    statModifier.setVariable( this );
    statModifier.setRole( 'StatisticalModifier' );
    this.#statisticalModifier = statModifier;
  }


  /**
   * @param {Entity} ctx
   */
  addContextObject( ctx ) {
    if( !(ctx instanceof Entity) ) {
      throw new Error( 'Can only assign instances of Entity!' );
    }
    ctx.setVariable( this );
    ctx.setRole( 'ContextObject' );
    this.#context.push( ctx );
  }


  /**
   * @param {Constraint}  constraint
   * @param {...Entity}  entities
   */
  addConstraint( constraint, ...entities ) {
    if( !(constraint instanceof Constraint) ) {
      throw new Error( 'Can only assign instances of Constraint!' );
    }

    // check that entity is assigned to this variable
    if( entities.some( (e) => e.getVariable() != this ) ) {
      throw Error('Can only constrain entities of the same variable!');
    }

    // check that this constraint is not already added
    if( this.#constraints.includes( constraint ) ) {

      // in this case, only make sure all entities are assigned
      const assignedEntities = constraint.getEntities();
      for( const entity of entities ) {
        if( !assignedEntities.includes( entity ) ) {
          constraint.addEntity( entity );
          entity.addConstraint( constraint );
        }
      }

      // skip remainder
      return;
    }

    // add reverse links
    for ( const entity of entities ) {
      constraint.addEntity( entity );
      entity.addConstraint( constraint );
    }

    constraint.setRole( 'Constraint' );
    this.#constraints.push( constraint );

  }


  /**
   *
   * @returns {Property}
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
   * @returns {Entity}
   */
  getStatisticalModifier() {
    return this.#statisticalModifier;
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


  /**
   *
   * @returns {Array.<Entity>}
   */
  getEntities() {
    return this.#constrains.slice( 0 );
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
  /** @typedef {Object.<String, Array.<Entity>>} */
  #systemComponents = {};


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


  /**
   *
   * @param {String} property
   * @param {Entity} component
   */
  addComponent( property, component ) {
    if( !(property in this.#systemComponents) ) {
      this.#systemComponents[ property ] = [];
    }
    component.setVariable( this.getVariable() );
    component.setRole( 'SystemComponent' );
    this.#systemComponents[ property ].push( component );
  }


  /**
   *
   * @returns {Object.<String, Array.<Entity>>}
   */
  getComponents( property, component ) {
    // return a copy of the internal object
    return Object.entries( this.#systemComponents )
      .reduce( (result, entry) => {
        result[ entry[0] ] = Array.from( entry[1] );
        return result;
      }, {} );
  }

  /**
   *
   * @returns {number}
   */
  getComponentCount() {
    return Object.entries( this.#systemComponents )
      .reduce( (sum, entry) => sum + entry[1].length, 0 );
  }


  /**
   *
   * @returns {Boolean}
   */
  isSystem() {
    return Object.keys( this.#systemComponents ).length > 0;
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


/* XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

export class Property extends Entity {

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
  ) + `
]`;
  }

}

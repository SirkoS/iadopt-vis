import { QueryEngine } from '@comunica/query-sparql-rdfjs';
import { Constraint, Entity, Property, Variable } from './model/models.js';
import { parseRDF } from './parse.js';

const NS = {
  iop:  'https://w3id.org/iadopt/ont/',
  rdf:  'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
};
const PROP_MAP = {
  label:      [ NS.rdfs + 'label' ],
  comment:    [ NS.rdfs + 'comment', NS.rdfs + 'description' ],
  ooi:        [ NS.iop + 'hasObjectOfInterest' ],
  prop:       [ NS.iop + 'hasProperty' ],
  matrix:     [ NS.iop + 'hasMatrix' ],
  context:    [ NS.iop + 'hasContextObject' ],
  modifier:   [ NS.iop + 'hasStatisticalModifier' ],
  constraint: [ NS.iop + 'hasConstraint' ],
  sysComps:   [
    NS.iop + 'hasSource',
    NS.iop + 'hasTarget',
    NS.iop + 'hasPart',
  ],
};

/**
 * Parse a RDF representation of the Variable to the internal object format
 * @param   {string}                      content  TTL representation of the Variable
 * @returns {Promise.<Array.<Variable>>}           list of parsed Variables in content
 */
export default async function extract( content ) {

  // parse into graph
  const {store: graph, prefixes } = await parseRDF( content );

  // initialize engine
  const engine = new QueryEngine();

  // collect all Variables
  // variables might have multiple response rows
  const result = {};
  const entities = {};

  /* XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Variable XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

  let stream = await engine.queryBindings(`
    PREFIX iop: <${NS.iop}>

    SELECT DISTINCT
      ?variable
      ?label ?comment
    WHERE {
      VALUES ?labelProp { ${PROP_MAP.label.map( (el) => `<${el}>` ).join( ' ' )} }
      VALUES ?commentProp { ${PROP_MAP.comment.map( (el) => `<${el}>` ).join( ' ' )} }

      ?variable a iop:Variable ;
                iop:hasObjectOfInterest  ?ooi ;
                iop:hasProperty          ?prop .
      OPTIONAL { ?variable  ?labelProp    ?label . }
      OPTIONAL { ?variable  ?commentProp  ?comment . }
    }`, { sources: [graph] });
  for await (const binding of stream) {

    // build variable
    const variable = binding.get('variable').value;
    if( !(variable in result) ) {
      result[ variable ] = new Variable({
        iri:      variable,
        shortIri: getPrefixed( prefixes, variable ),
      });
    }
    /** @type {Variable} */
    const entry = result[ variable ];
    entities[ variable ] = entry;

    // add labels & descriptions
    let value = binding.get( 'label' );
    if( value ) {
      entities[ variable ].setLabel( value.language, value.value );
    }
    value = binding.get( 'comment' )?.value;
    if( value ) {
      entities[ variable ].setComment( value.language, value.value );
    }


    /* XXXXXXXXXXXXXXXXXXXXXXXXXXXX Components XXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

    stream = await engine.queryBindings(`
      PREFIX iop: <${NS.iop}>

      SELECT DISTINCT
        ?prop ?value ?label ?comment
      WHERE {
        VALUES ?prop {
          iop:hasContextObject
          iop:hasMatrix
          iop:hasObjectOfInterest
          iop:hasProperty
          iop:hasStatisticalModifier
        }
        VALUES ?labelProp   { ${PROP_MAP.label.map( (el) => `<${el}>` ).join( ' ' )} }
        VALUES ?commentProp { ${PROP_MAP.comment.map( (el) => `<${el}>` ).join( ' ' )} }

        <${variable}> ?prop ?value .
        OPTIONAL{ ?value ?labelProp   ?label . }
        OPTIONAL{ ?value ?commentProp ?comment . }
      }
      ORDER BY DESC(?prop)`, { sources: [graph] });

    // add non-unique properties
    for await ( const binding of stream ) {

      const key = binding.get('prop')?.value;

      // entity
      const entity = binding.get( 'value' ).value;
      if( !(entity in entities) ) {

        // determine type of class
        const Type = key.includes('hasProperty') ? Property : Entity;

        // create entity object
        entities[ entity ] = new Type({
          iri:      entity,
          shortIri: getPrefixed( prefixes, entity ),
          isBlank:  binding.get( 'value' ).termType == 'BlankNode'
        });

        // attach it with the correct role
        switch( true ) {

          // Property
          case key.includes( 'hasProperty' ):
            entry.setProperty( entities[ entity ] );
            break;

          // Matrix
          case key.includes( 'hasMatrix' ):
            entry.setMatrix( entities[ entity ] );
            break;

          // ObjectOfInterest
          case key.includes( 'hasObjectOfInterest' ):
            entry.setObjectOfInterest( entities[ entity ] );
            break;

          // ContextObject
          case key.includes( 'hasContextObject' ):
            entry.addContextObject( entities[ entity ] );
            break;

          // StatisticalModifier
          case key.includes( 'hasStatisticalModifier' ):
            entry.addStatisticalModifier( entities[ entity ] );
            break;

        }
      }

      // label
      let value = binding.get( 'label' );
      if( value ) {
        entities[ entity ].setLabel( value.language, value.value );
      }
      // description
      value = binding.get( 'comment' )?.value;
      if( value ) {
        entities[ entity ].setComment( value.language, value.value );
      }

    }


    /* XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Systems XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

    const varProps = [
      ... PROP_MAP.ooi, ... PROP_MAP.matrix, ... PROP_MAP.context,
      ... PROP_MAP.modifier, ... PROP_MAP.prop
    ];
    const sysStream = await engine.queryBindings(`
      PREFIX iop: <${NS.iop}>

      SELECT DISTINCT
        ?varProp ?system ?sysClass ?sysProp ?sysComp ?label ?comment
      WHERE {
        VALUES ?varProp  { ${varProps.map( (el) => `<${el}>` ).join( ' ' )} }
        VALUES ?sysClass { iop:System }
        VALUES ?sysProp  { ${PROP_MAP.sysComps.map( (el) => `<${el}>` ).join( ' ' )} }
        VALUES ?labelProp   { ${PROP_MAP.label.map( (el) => `<${el}>` ).join( ' ' )} }
        VALUES ?commentProp { ${PROP_MAP.comment.map( (el) => `<${el}>` ).join( ' ' )} }

        <${variable}> ?varProp ?system .
        ?system a        ?sysClass ;
                ?sysProp ?sysComp .

        OPTIONAL{ ?sysComp ?labelProp   ?label . }
        OPTIONAL{ ?sysComp ?commentProp ?comment . }
      }`, { sources: [graph] });

    for await ( const binding of sysStream ) {

      // build an entity for the component
      const component = binding.get( 'sysComp' );
      const entity = new Entity({
        iri:      component?.value,
        shortIri: getPrefixed( prefixes, component?.value ),
        isBlank:  component.termType == 'BlankNode',
      });
      entities[ entity.getIri() ] = entity;

      // add labels & descriptions
      let value = binding.get( 'label' );
      if( value ) {
        entity.setLabel( value.language, value.value );
      }
      value = binding.get( 'comment' )?.value;
      if( value ) {
        entity.setComment( value.language, value.value );
      }

      // link to parent component
      const parentIri = binding.get( 'system' )?.value;
      const parent = entities[ parentIri ];
      if( !parent ) {
        throw new Error( 'Could not extract parent of system component' );
      }
      parent.addComponent(
        binding.get( 'sysProp' )?.value,
        entity
      );

    }


    /* XXXXXXXXXXXXXXXXXXXXXXXXXXXX Constraints XXXXXXXXXXXXXXXXXXXXXXXXXXXX */

    const propStream = await engine.queryBindings(`
      PREFIX iop: <${NS.iop}>

      SELECT DISTINCT
        ?constraint ?label ?comment ?target
      WHERE {
        VALUES ?labelProp   { ${PROP_MAP.label.map( (el) => `<${el}>` ).join( ' ' )} }
        VALUES ?commentProp { ${PROP_MAP.comment.map( (el) => `<${el}>` ).join( ' ' )} }

        <${variable}> iop:hasConstraint ?constraint .
        OPTIONAL{ ?constraint ?labelProp   ?label . }
        OPTIONAL{ ?constraint ?commentProp ?comment . }
        OPTIONAL{ ?constraint iop:constrains ?target . }
      }`, { sources: [graph] });

    // add non-unique properties
    for await ( const binding of propStream ) {

      // entity
      const entity = binding.get( 'constraint' ).value;
      if( !(entity in entities) ) {
        entities[ entity ] = new Constraint({
          iri:      entity,
          shortIri: getPrefixed( prefixes, entity ),
          isBlank:  binding.get( 'constraint' ).termType == 'BlankNode'
        });
        entry.addConstraint( entities[ entity ] );

      }

      // label
      let value = binding.get( 'label' );
      if( value ) {
        entities[ entity ].setLabel( value.language, value.value );
      }
      // description
      value = binding.get( 'comment' )?.value;
      if( value ) {
        entities[ entity ].setComment( value.language, value.value );
      }

      // get the target of the constraint
      const target = binding.get( 'target' ).value;
      if( target ) {
        // some validation
        if( !(entity in entities) ) {
          throw new Error( 'Reference to undefined constraint!' );
        }
        if( !(target in entities) ) {
          throw new Error( 'Reference to undefined target of constraint!' );
        }
        entry.addConstraint( entities[ entity ], entities[ target ] );
      }

    }

  }

  // done
  return Object.values( result );

}


/**
 * shorten a given IRI by trying to apply prefixes
 * @param   {object} namespaces   map of prefixes and their expanded versions
 * @param   {string} iri          the IRI to shorten
 * @returns {string|null}         shortened IRI or null if no prefix was found
 */
function getPrefixed( namespaces, iri ) {
  for( const [key, value] of Object.entries( namespaces ) ) {
    if( iri.startsWith( value ) ) {
      return iri.replace( value, `${key}:` );
    }
  }
}

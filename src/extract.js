import N3 from 'n3';
import { QueryEngine } from '@comunica/query-sparql-rdfjs';
import { Constraint, Entity, Property, Variable } from './model/models.js';

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
  constraint: [ NS.iop + 'hasConstraint' ],
};

/**
 * Parse a TTL representation of the Variable to the internal object format
 * @param   {string} content  TTL representation of the Variable
 * @returns {object}          Object representation of the Variable
 */
export default async function extract( content ) {

  // parse into graph
  const {store: graph, prefixes } = await parseContent( content );

  // initialize engine
  const engine = new QueryEngine();

  // collect all Variables
  // variables might have multiple response rows
  const result = {};
  const entities = {};

  // first query: unique properties
  const variableStream = await engine.queryBindings(`
    PREFIX iop: <${NS.iop}>

    SELECT DISTINCT
      ?variable ?ooi ?prop ?matrix
      ?variableLabel ?variableComment
      ?ooiLabel ?ooiComment
      ?propLabel ?propComment
      ?matrixLabel ?matrixComment
    WHERE {
      VALUES ?labelProp { ${PROP_MAP.label.map( (el) => `<${el}>` ).join( ' ' )} }
      VALUES ?commentProp { ${PROP_MAP.comment.map( (el) => `<${el}>` ).join( ' ' )} }

      ?variable a iop:Variable ;
                iop:hasObjectOfInterest  ?ooi ;
                iop:hasProperty          ?prop .
      OPTIONAL { ?variable  ?labelProp    ?variableLabel . }
      OPTIONAL { ?variable  ?commentProp  ?variableComment . }
      OPTIONAL { ?ooi       ?labelProp    ?ooiLabel . }
      OPTIONAL { ?ooi       ?commentProp  ?ooiComment . }
      OPTIONAL { ?prop      ?labelProp    ?propLabel . }
      OPTIONAL { ?prop      ?commentProp  ?propComment . }
      OPTIONAL {
        ?variable iop:hasMatrix ?matrix .
        OPTIONAL { ?matrix ?labelProp    ?matrixLabel . }
        OPTIONAL { ?matrix ?commentProp  ?matrixComment . }
      }
    }`, { sources: [graph] });
  for await (const binding of variableStream) {

    // get variable
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

    // add unique properties
    for( const key of [ 'ooi', 'prop', 'matrix' ] ) {
      const value = binding.get( key )?.value;
      if( value ) {
        if( !(value in entities) ) {
          entities[ value ] = new (key == 'prop' ? Property : Entity)({
            iri:      value,
            shortIri: getPrefixed( prefixes, value ),
            isBlank:  binding.get( key ).termType == 'BlankNode',
          });
        }
        switch( key ) {
          case 'ooi':
            entry.setObjectOfInterest( entities[ value ] );
            break;
          case 'prop':
            entry.setProperty( entities[ value ] );
            break;
          case 'matrix':
            entry.setMatrix( entities[ value ] );
            break;
        }
      }
    }

    // add labels & descriptions
    for( const key of ['variable', 'ooi', 'prop', 'matrix' ]) {
      const entity = binding.get( key )?.value;
      if( entity ) {
        let value = binding.get( key + 'Label' );
        if( value ) {
          entities[ entity ].setLabel( value.language, value.value );
        }
        value = binding.get( key + 'Comment' )?.value;
        if( value ) {
          entities[ entity ].setComment( value.language, value.value );
        }
      }

    }

    // get non-unique properties
    const propStream = await engine.queryBindings(`
      PREFIX iop: <${NS.iop}>

      SELECT DISTINCT
        ?prop ?value ?label ?comment ?target
      WHERE {
        VALUES ?prop { iop:hasContextObject iop:hasConstraint }
        VALUES ?labelProp   { ${PROP_MAP.label.map( (el) => `<${el}>` ).join( ' ' )} }
        VALUES ?commentProp { ${PROP_MAP.comment.map( (el) => `<${el}>` ).join( ' ' )} }

        <${variable}> ?prop ?value .
        OPTIONAL{ ?value ?labelProp   ?label . }
        OPTIONAL{ ?value ?commentProp ?comment . }
        OPTIONAL{ ?value iop:constrains ?target . }
      }`, { sources: [graph] });

    // add non-unique properties
    for await ( const binding of propStream ) {
      const key = binding.get('prop')?.value;
      if( key ) {

        // entity
        const entity = binding.get( 'value' ).value;
        if( !(entity in entities) ) {
          if( key.includes( 'hasConstraint') ) {

            // Constraint
            entities[ entity ] = new Constraint({
              iri:      entity,
              shortIri: getPrefixed( prefixes, entity ),
              isBlank:  binding.get( 'value' ).termType == 'BlankNode'
            });
            entry.addConstraint( entities[ entity ] );

          } else {

            // ContextObject
            entities[ entity ] = new Entity({
              iri:      entity,
              shortIri: getPrefixed( prefixes, entity ),
              isBlank:  binding.get( 'value' ).termType == 'BlankNode'
            });
            entry.addContextObject( entities[ entity ] );

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

        // constrains
        if( key.includes( 'hasConstraint' ) ) {

          // get the target of the constraint
          const target = binding.get( 'target' ).value;
          if( target ) {
            entry.addConstraint( entities[ entity ],entities[ target ] );
          }

        }

      }
    }

  }

  // done
  return Object.values( result );

}

/**
 * @typedef  {Object} ParseResponse
 * @property {N3.Store}                 store     store holding graph data
 * @property {object.<string, string>}  prefixes  map of prefixes
 */

/**
 * parse a given RDF-string into a graph store
 * @param   {String}                  content   RDF-compliant data
 * @returns {Promise.<ParseResponse>}           parsed data
 */
function parseContent( content ) {
  return new Promise( (resolve, reject) => {
    const parser = new N3.Parser();
    const store = new N3.Store();
    parser.parse( content,
                  (error, quad, prefixes) => {

                    // errors
                    if( error ) {
                      reject( error );
                    }

                    // content
                    if (quad) {
                      store.add( quad );
                    } else {
                      resolve( { store, prefixes } );
                    }

                  });
  });
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

/**
 * convert a given Variable into a regular object
 * in order to serialize as JSON-LD
 *
 * @param   {import('./models').Variable}    variable
 * @returns {Object}
 */
export default function toJSONLD( variable ) {

  // keep track of blank node identifiers
  /** @type {Map<Concept, string>} */
  const blankNodeMap = new Map();

  // basic structure
  const result = {
    '@context': 'https://w3id.org/iadopt/Variable.context.jsonld',

    '@type':  'https://w3id.org/iadopt/ont/Variable',
    '@id':    variable.getIri(),
    label:    variable.getLabel(),
    comment:  variable.getComment(),

    property: {
      ... serializeEntity( variable.getProperty(), blankNodeMap ),
      '@type': [ 'https://w3id.org/iadopt/ont/Property' ],
    },

    statisticalModifier:  serializeEntity( variable.getStatisticalModifier(), blankNodeMap ),
    ooi:                  serializeEntity( variable.getObjectOfInterest(), blankNodeMap ),
    matrix:               serializeEntity( variable.getMatrix(), blankNodeMap ),

    context: variable.getContextObjects()?.map( (ctx) => serializeEntity( ctx ) ),
    constraint: [],

  };

  for( const c of variable.getConstraints() ) {
    result.constraint.push({
      '@type': [ 'https://w3id.org/iadopt/ont/Constraint' ],
      '@id':      c.isBlank() ? undefined : c.getIri(),
      label:      c.getLabel(),
      comment:    c.getComment(),
      constrains: c.getEntities()?.map( (e) => blankNodeMap.has( e ) ? blankNodeMap.get( e ) : e.getIri() ),
    });
  };

  return result;
}


/**
 * Serialize a single Entity.
 * Entity may be a System. Here, all sub-components are serialized as well
 *
 * @param   {import('./models').Entity}   ent
 * @param   {Map<Concept, string>}        blankNodeMap
 * @returns {Object|void}
 */
function serializeEntity( ent, blankNodeMap ) {

  // just return for empty object
  if( !ent ) {
    return;
  }

  // determine IRI
  let iri = ent.getIri();
  if( ent.isBlank() ) {
    if( !blankNodeMap.has( ent ) ) {
      blankNodeMap.set( ent, `_:b${blankNodeMap.size}` );
    }
    iri = blankNodeMap.get( ent );
  }

  // basic structure
  const result = {
    '@type': [ 'https://w3id.org/iadopt/ont/Entity' ],
    '@id':    iri,
    label:    ent.getLabel(),
    comment:  ent.getComment(),
  };

  // get components, if existing
  const components = ent.getComponents();
  if( Object.keys( components ).length > 0 ) {

    // add classes
    result['@type'].push(
      'https://w3id.org/iadopt/ont/System',
      ('hasPart' in components)
        ? 'https://w3id.org/iadopt/ont/SymetricSystem'
        : 'https://w3id.org/iadopt/ont/AsymetricSystem'
    );

    // add components
    for( const [key, values] of Object.entries( components ) ) {
      result[ key ] = values.length > 1
        ? values.map( (v) => serializeEntity( v, blankNodeMap ) )
        : serializeEntity( values[0], blankNodeMap );
    }
  }

  return result;
}
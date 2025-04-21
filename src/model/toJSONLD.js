/**
 * convert a given Variable into a regular object
 * in order to serialize as JSON-LD
 *
 * @param   {import('./models').Variable}    variable
 * @returns {Object}
 */
export default function toJSONLD( variable ) {

  // basic structure
  const result = {
    '@context': 'https://w3id.org/iadopt/Variable.context.jsonld',

    '@type':  'https://w3id.org/iadopt/ont/Variable',
    '@id':    variable.getIri(),
    label:    variable.getLabel(),
    comment:  variable.getComment(),

    property: {
      '@type': [ 'https://w3id.org/iadopt/ont/Property' ],
      '@id':    variable.getProperty()?.getIri(),
      label:    variable.getProperty()?.getLabel(),
      comment:  variable.getProperty()?.getComment(),
    },

    statisticalModifier:  serializeEntity( variable.getStatisticalModifier() ),
    ooi:                  serializeEntity( variable.getObjectOfInterest() ),
    matrix:               serializeEntity( variable.getMatrix() ),

    context: variable.getContextObjects()?.map( (ctx) => serializeEntity( ctx ) ),
    constraint: [],

  };

  for( const c of variable.getConstraints() ) {
    if( c.isBlank() ) {
      result.constraint.push({
        '@type': [ 'https://w3id.org/iadopt/ont/Constraint' ],
        label:      c.getLabel(),
        comment:    c.getComment(),
        constrains: c.getEntities()?.map( (e) => e.getIri() ),
      });

    } else {
      result.constraint.push({
        '@type': [ 'https://w3id.org/iadopt/ont/Constraint' ],
        '@id':      c.getIri(),
        label:      c.getLabel(),
        comment:    c.getComment(),
        constrains: c.getEntities()?.map( (e) => e.getIri() ),
      });
    }
  };

  return result;
}


/**
 * Serialize a single Entity.
 * Entity may be a System. Here, all subcomponents are serialized as well
 *
 * @param   {import('./models').Entity}   ent
 * @returns {Object|void}
 */
function serializeEntity( ent ) {

  // just return for empty object
  if( !ent ) {
    return;
  }

  // basic structure
  const result = {
    '@type': [ 'https://w3id.org/iadopt/ont/Entity' ],
    '@id':    ent.getIri(),
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
        ? values.map( (v) => serializeEntity( v ) )
        : serializeEntity( values[0] );
    }
  }

  return result;
}
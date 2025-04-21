// TODO figure out why including the classes directly results in a cyclic reference in the test of model/toJSONLD
export default function createVariable({ Constraint, Entity, Property, Variable }) {

  const result = new Variable({
    iri:      'http://example.org/iadopt/variable_system_constraint',
    label:    'Variable with a System and Constraints',
    comment:  'a variable definition that includes systems and constraints on all Entitys'
  });

  /* XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Property XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

  const prop = new Property({
    iri:      'http://example.org/iadopt/property',
    label:    'the Property of the variable',
    comment:  'some description of the Property'
  });
  result.setProperty( prop );

  result.addConstraint(new Constraint({
    label:    'blank constraint on the Property',
    comment:  'some description of the constraint on the Property',
    isBlank:  true,
  }), prop );

  /* XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Property XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

  const mod = new Entity({
    iri:      'http://example.org/iadopt/modifier',
    label:    'the StatisticalModifier of the variable',
    comment:  'some description of the StatisticalModifier'
  });
  result.setStatisticalModifier( mod );

  /* XXXXXXXXXXXXXXXXXXXXXXXXXXX ObjectOfInterest XXXXXXXXXXXXXXXXXXXXXXXXXXXX */

  const ooi = new Entity({
    iri:      'http://example.org/iadopt/ooi',
    label:    'the ObjectOfInterest of the variable',
    comment:  'some description of the ObjectOfInterest'
  });
  result.setObjectOfInterest( ooi );

  const ooiPart1 = new Entity({
    iri:      'http://example.org/iadopt/ooiPart1',
    label:    'first part of the OoI-System',
    comment:  'some description of the first part of the OoI-System'
  });
  ooi.addComponent( 'hasPart', ooiPart1 );

  result.addConstraint(new Constraint({
    iri:      'http://example.org/iadopt/ooiPart1Constraint',
    label:    'constraint on the first part of the OoI-System',
    comment:  'some description of the constraint on first part of the OoI-System',
  }), ooiPart1 );

  ooi.addComponent( 'hasPart', new Entity({
    iri:      'http://example.org/iadopt/ooiPart2',
    label:    'second part of the OoI-System',
    comment:  'some description of the second part of the OoI-System'
  }) );

  /* XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Matrix XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

  const matrix = new Entity({
    iri:      'http://example.org/iadopt/matrix',
    label:    'the Matrix of the variable',
    comment:  'some description of the Matrix'
  });
  result.setMatrix( matrix );

  result.addConstraint(new Constraint({
    iri:      'http://example.org/iadopt/matrixConstraint',
    label:    'constraint on the Matrix',
    comment:  'some description of the constraint on the Matrix',
  }), matrix );

  matrix.addComponent( 'hasSource', new Entity({
    iri:      'http://example.org/iadopt/matrixSource',
    label:    'the source of the Matrix-System',
    comment:  'some description of the source of the Matrix-System'
  }) );

  matrix.addComponent( 'hasTarget', new Entity({
    iri:      'http://example.org/iadopt/matrixTarget',
    label:    'the target of the Matrix-System',
    comment:  'some description of the target of the Matrix-System'
  }) );

  /* XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ContextObject XXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

  result.addContextObject(new Entity({
    iri:      'http://example.org/iadopt/context1',
    label:    'first ContextObject of the variable',
    comment:  'some description of the first ContextObject'
  }));

  result.addContextObject(new Entity({
    iri:      'http://example.org/iadopt/context2',
    label:    'second ContextObject of the variable',
    comment:  'some description of the second ContextObject'
  }));

  return result;

};

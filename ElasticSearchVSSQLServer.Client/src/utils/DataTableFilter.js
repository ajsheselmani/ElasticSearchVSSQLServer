export const mapFiltersToGraphQL = (filters, logicType, columns) => {
  const graphQLFilters = { and: [] };
  if (filters?.length > 0) {
    const userFilters = { [logicType.toLowerCase()]: [] };
    for (let i = 0; i < filters?.length; i++) {
      let query = {};
      let field =
        filters[i].field.replace(/\[0\]/g, '.some') + '.' + findTheOperator(filters[i].operator);

      for (let t = 0; t < 20; t++) {
        const regExpression = `[${t}]`;
        field = field.replace(regExpression, '.some');
      }
      const column = columns.find((col) => col.field === filters[i].field);
      let value;
      if (column?.type === 'number') {
        value = +filters[i].value;
      } else if (column?.type === 'dateTime') {
        var dateValue = new Date(filters[i].value);
        if (isNaN(dateValue.getTime())) {
          if (
            typeof filters[i].value === 'object' &&
            filters[i].value.gte &&
            filters[i].value.lte
          ) {
            userFilters[logicType.toLowerCase()].push({
              [filters[i].field]: {
                gte: filters[i].value.gte,
                lte: filters[i].value.lte,
              },
            });
            continue;
          }
          continue;
        }
        value = dateValue.toISOString();
      } else if (column?.type === 'decimal') {
        value = parseFloat(filters[i].value);
      } else {
        value = filters[i].value == undefined ? null : filters[i].value;
      }
      query = constructTree(field, value);
      userFilters[logicType.toLowerCase()].push(query);
    }

    graphQLFilters.and.push(userFilters);
  }

  return graphQLFilters;
};

export const constructTree = (path, value) => {
  const parts = path.split('.');
  let nestedObject = {};
  let current = nestedObject;
  for (let i = 0; i < parts?.length; i++) {
    let key = parts[i];
    if (path.includes('some') && (path.includes('isEmpty') || path.includes('isNotEmpty'))) {
      if (key == 'some' && path.includes('isEmpty')) {
        current['any'] = false;
        break;
      }
      if (key == 'some' && path.includes('isNotEmpty')) {
        current['any'] = true;
        break;
      }
    }
    if (i === parts?.length - 1) {
      if (key == 'isEmpty') key = 'eq';
      else if (key == 'isNotEmpty') key = 'neq';
      current[key] = value;
    } else {
      current[key] = {};
      current = current[key];
    }
  }
  return nestedObject;
};

const findTheOperator = (operator) => {
  const operatorMap = {
    '=': 'eq',
    equals: 'eq',
    is: 'eq',
    '>': 'gt',
    '   <': 'lt',
    '>=': 'gte',
    '<=': 'lte',
    '!=': 'neq',
    isAnyOf: 'in',
    contains: 'contains',
    startsWith: 'startsWith',
    endsWith: 'endsWith',
    isEmpty: 'isEmpty',
    isNotEmpty: 'isNotEmpty',
    after: 'gt',
    onOrAfter: 'gte',
    before: 'lt',
    onOrBefore: 'lte',
    not: 'neq',
    doesNotContain: 'ncontains',
    doesNotEqual: 'ncontains',
    some: 'some',
    gte: 'gte',
    lte: 'lte',
    none: 'none',
  };
  return operatorMap[operator] || 'eq';
};

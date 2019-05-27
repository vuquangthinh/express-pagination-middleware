const _ = require('lodash');

module.exports = (defaultLimit, defaultFilters = [], defaultSorts = []) => {
  return (req, res, next) => {
    // console.info(defaultLimit)
    let limit = Math.max(1, _.get(req, 'query.page_size', defaultLimit));
    if (isNaN(limit)) {
      limit = defaultLimit;
    }

    let page = parseInt(Math.max(1, _.get(req, 'query.page', 1)));
    if (isNaN(page)) {
      page = 1;
    }

    const offset = limit * (page - 1);

    // condition and sort (sequelize)
    let _filters = req.query.filters || {};
    let _sorts = req.query.sorts || {};

    const filters = _.pickBy(typeof _filters === 'object' ? _filters : {}, (val, key) => defaultFilters.includes(key));
    const sorts = _.pickBy(typeof _sorts === 'object' ? _sorts : {}, (val, key) => defaultSorts.includes(key));

    // normalize sorts
    req.pagination = {
      page,
      offset,
      limit,

      filters,
      sorts: Object.keys(sorts)
        .map(v => {
          let resu = [];
          if (v.includes('.')) {
            resu = [...v.split('.', 2)];
          } else {
            resu = [v];
          }

          if (String(sorts[v]) === '1') {
            resu.push('ASC');
          }

          if (String(sorts[v]) === '-1') {
            resu.push('DESC');
          }

          return resu;
        })
        .filter(v => v.length > 0)
    };

    res.pagination = (result, ext = {}) => {
      res.json({
        ...ext,
        current: page,
        total: Math.ceil(result.count / limit),
        total_record: result.count,
        limit,
        items: result.rows
      });
    };

    next();
  };
};

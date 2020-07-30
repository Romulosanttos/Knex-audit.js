import knex from 'knex';

export default class KnexAudit {
  constructor(knexLogger) {
    var defaults = knex({
      client: 'pg',
      connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'postgres',
        database: 'knex-logger'
      }
    });
    this.knexLogger = knexLogger || defaults;
  }

  audit(knex) {
    return new Promise(resolve => {
      resolve(new Proxy(knex, {
        get(target, property) {
          const tmp = target;
          tmp.on('query-response', (response, query) => {
            const { method, options, timeout, cancelOnTimeout, bindings, __knexQueryUid, sql } = query;
            const consult = {
              method,
              options,
              timeout,
              cancelOnTimeout,
              bindings,
              __knexQueryUid,
              sql
            };
            console.log('Executed a query:', consult);
            console.log('Received a response from:', response);
          });
          return target[property];
        }
      }));
    });
  }
}

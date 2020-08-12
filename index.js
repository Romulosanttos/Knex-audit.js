const knex = require('knex');
const debug = require('debug');

module.exports = class KnexAudit {
  constructor(knexLogger, knexLoggerTable) {
    const defaults = knex({
      client: 'pg',
      connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'postgres',
        database: 'knex-logger'
      }
    });
    this.knexLogger = knexLogger || defaults;
    this.knexLoggerTable = knexLoggerTable;
    
    this.debugMethod = debug('audit:method');
    this.debugExecuted = debug('audit:executed');
    this.debugReceived = debug('audit:received');

  }

  proxy(knex) {
    return new Promise(resolve => {
      resolve(new Proxy(knex, {
        get(target, property) {
          const tmp = target;
          tmp.on('query-response', (response, query) => {
            const { method, options, timeout, cancelOnTimeout, bindings, __knexQueryUid, sql } = query;
            const consult = {
              options,
              timeout,
              cancelOnTimeout,
              bindings,
              __knexQueryUid,
              sql
            };
            this.debugMethod(method);
            this.debugExecuted(consult);
            this.debugReceived(response);
            this.sendDB(method, consult, response);
          }).setMaxListeners(0);
          return target[property];
        }
      }));
    });
  }

  sendDB(method, consult, response) {
    return this.knexLogger(this.knexLoggerTable).insert({method, consult, response});
  }

};
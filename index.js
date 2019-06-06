const createError = require("http-errors");

class BetaVersionPlugin {
  constructor(config, stuff) {
    this.config = config;
    this.logger = stuff.logger;
    if (
      !Array.isArray(this.config.access) &&
      !Array.isArray(this.config.publish)
    ) {
      this.logger.error(
        `BetaVersion plugin is misconfigured. Please define access and/or publish parameter`
      );
      this.logger.warn(`BetaVersion:config`, this.config);
    }
  }

  allow_action(action) {
    this.logger.info(`BetaVersion:allow_action for ${action}`);
    return (user, pkg, callback) => {
      this.logger.trace(`allow_action2`, user, pkg);
      const { name, groups } = user;
      this.logger.trace(
        `BetaVersion: Username: ${name}, groups: ${groups.join(`,`)}`
      );
      const hasPermission = pkg[action].some(
        group => name === group || groups.includes(group)
      );

      if (hasPermission) {
        return callback(null, true);
      }

      this.logger.warn(
        `BetaVersion: No base permission to publish for ${
          name ? name : "anonymous"
        } and package: ${pkg.name}:${pkg.version}`
      );
      if (this.config[action]) {
        // Allow beta packages
        for (const item of this.config[action]) {
          for (const group of Object.keys(item)) {
            this.logger.info(
              `BetaVersion: checking ${group} => ${item[group]}`
            );
            if (
              groups.includes(group) &&
              RegExp(item[group]).test(pkg.version)
            ) {
              this.logger.warn(
                `BetaVersion: ${action} allowed for ${group}/${
                  name ? name : "anonymous"
                } and package ${pkg.name}:${pkg.version}`
              );
              return callback(null, true);
            }
          }
        }
        this.logger.warn(
          `BetaVersion: no package version match found for action ${action}`
        );
      } else {
        this.logger.warn(
          `BetaVersion: skipped check. No action ${action} configuration found`
        );
      }

      if (name) {
        callback(
          createError(
            403,
            `user ${name} is not allowed to ${action} package ${pkg.name}`
          )
        );
      } else {
        callback(
          createError(
            401,
            `authorization required to ${action} package ${pkg.name}`
          )
        );
      }
    };
  }

  allow_access(user, pkg, callback) {
    this.allow_action("access")(user, pkg, callback);
  }
  allow_publish(user, pkg, callback) {
    this.allow_action("publish")(user, pkg, callback);
  }
  allow_unpublish(user, pkg, callback) {
    const action = "unpublish";
    const hasSupport = pkg[action] ? pkg[action] : false;

    if (hasSupport === false) {
      return callback(null, undefined);
    }

    return this.allow_action(action)(user, pkg, callback);
  }
}

module.exports = (cfg, stuff) => new BetaVersionPlugin(cfg, stuff);

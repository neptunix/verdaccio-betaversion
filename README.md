# verdaccio-betaversion

Verdaccio Plugin to allow certain versions to be accessed or published for specified user groups

## Installation

```bash
$ npm i -g verdaccio-betaversion
```

## Configuration

In order to use the plugin the basic configuration is required. You must specify access and/or publish rules for the groups. Example configuration below:
```yaml
# config.yaml

auth:
  betaversion: { publish: [ { '$authenticated': '^.*-beta.*$'}], access: [ { 'user1': '^.*-user1.*$'} ] }
  htpasswd:
    file: ./htpasswd
  # Any other authentication plugins
packages:
  '@*/*':
    access: '$authenticated'
    publish: 'admin'
    unpublish: false
```

In the above case all `$authenticated` users are able to publish all plugins matching the version `^.*-beta.*$` and `user1` may access packages with `-user1` in the version.
Version restrictions are checked after the basic authentication and only if user is not allowed to perform the action. Multiple rules may be specified for each check;

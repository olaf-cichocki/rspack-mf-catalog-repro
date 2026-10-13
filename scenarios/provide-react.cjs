// Registers the installed react in the share scope, standing in for another container that provides it.
module.exports = function () {
  return {
    name: 'provide-react',
    beforeInit(args) {
      args.userOptions.shared = {
        ...args.userOptions.shared,
        react: {
          version: __non_webpack_require__('react/package.json').version,
          scope: 'default',
          lib: () => __non_webpack_require__('react'),
          shareConfig: { singleton: false, requiredVersion: false },
        },
      };
      return args;
    },
  };
};

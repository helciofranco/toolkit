module.exports = {
  name: 'fuel',
  script: 'src/index.ts',
  interpreter: 'bun',
  env: {
    PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`,
  },
};

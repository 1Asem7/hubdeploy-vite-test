// The fail-build branch: the build stops here on purpose, after Vite ran,
// so HubDeploy must report npm_build_failed and publish nothing.
console.error('fail-build: this branch fails on purpose.')
process.exit(1)

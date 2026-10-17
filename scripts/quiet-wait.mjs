// Prints nothing for 150 s, so the build log has a long silent stretch:
// only HubDeploy's ": ping" comments keep the stream open through Cloudflare.
setTimeout(() => {}, 150_000)

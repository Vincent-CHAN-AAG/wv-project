import assert from "node:assert/strict"
import test from "node:test"

import api from "./src/api/client"

const workspaceId = "b6d9d85e-8ee8-4c0f-8d15-1c72c1e915dc"

test("serves generated assets and HMR through the immutable workspace relay", async () => {
  const globals = globalThis as typeof globalThis & { __dirname?: string }
  globals.__dirname = `${process.cwd()}/template/project/frontend`
  process.env.VITE_PREVIEW_BASE = `/preview/${workspaceId}/`
  try {
    const { default: viteConfig } = await import("./vite.config")
    const config = viteConfig({
      command: "serve",
      mode: "test",
      isSsrBuild: false,
      isPreview: false,
    })
    assert.equal(config.base, `/preview/${workspaceId}/`)
    assert.equal(config.server?.hmr && typeof config.server.hmr === "object", true)
    assert.deepEqual(config.server?.allowedHosts, ["frontend-app"])
    const credentialPlugin = (config.plugins ?? [])
      .flat()
      .find(
        (plugin) =>
          plugin &&
          typeof plugin === "object" &&
          "name" in plugin &&
          plugin.name === "web-vibe-preview-credentials",
      )
    assert.ok(credentialPlugin, "preview module credential plugin must be configured")
    assert.ok(
      "transformIndexHtml" in credentialPlugin &&
        credentialPlugin.transformIndexHtml &&
        typeof credentialPlugin.transformIndexHtml === "object" &&
        "handler" in credentialPlugin.transformIndexHtml,
    )
    const transformed = await credentialPlugin.transformIndexHtml.handler(
      '<script type="module" src="/preview/app.js"></script>',
      {} as never,
    )
    assert.match(String(transformed), /type="module" crossorigin="use-credentials"/)
    const proxy = config.server?.proxy as Record<
      string,
      { rewrite?: (requestPath: string) => string }
    >
    const previewPrefix = `/preview/${workspaceId}`
    assert.equal(proxy["/api"], undefined)
    assert.equal(
      proxy[`${previewPrefix}/api`]?.rewrite?.(`${previewPrefix}/api/health?ready=1`),
      "/health?ready=1",
    )
    assert.equal(
      proxy[`${previewPrefix}/auth`]?.rewrite?.(`${previewPrefix}/auth/session`),
      "/auth/session",
    )
  } finally {
    delete process.env.VITE_PREVIEW_BASE
    delete globals.__dirname
  }
})

test("keeps generated API requests inside the scoped preview route", () => {
  assert.equal(api.defaults.baseURL, "./api")
  assert.notEqual(api.defaults.withCredentials, true)
  assert.equal(api.defaults.withXSRFToken, false)
  assert.equal(
    new URL(
      `${api.defaults.baseURL}/health`,
      `https://example.test/preview/${workspaceId}/`,
    ).pathname,
    `/preview/${workspaceId}/api/health`,
  )
})

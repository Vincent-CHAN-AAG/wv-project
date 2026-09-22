import axios from "axios"

const client = axios.create({
  baseURL: "./api",
  // Sandboxed previews have an opaque origin and cannot read document cookies.
  withXSRFToken: false,
})

// Request interceptor — add shared request metadata here when needed.
client.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — handle errors globally (e.g. 401 → redirect to login)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized — redirecting to login")
      // window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default client

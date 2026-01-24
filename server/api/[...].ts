export default defineEventHandler((event) => {
  const routePath = getRequestURL(event)
  console.log(` 404 == No match for ${routePath} ==`)
  return `The route you were trying to access does not exist: ${routePath}`
})
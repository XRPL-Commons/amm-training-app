export default defineEventHandler(async (event) => {
  console.log(`> new request ${event.method}: ${getRequestURL(event)}`)
  const params = getRouterParams(event)
  if (params && Object.keys(params).length > 0) {
    console.log(params)
  }
  const query = getQuery(event)
  if (query) {
    console.log('query', query)
  }
})

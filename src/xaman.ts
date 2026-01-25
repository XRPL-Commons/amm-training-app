/* @ts-ignore */
import API from '~/server/client'

export async function initializeWebsocket({ url, onMessage }: { url: string, onMessage?: any }) {
    /* @ts-ignore */
    const ws = new WebSocket(url);
    /* @ts-ignore */
    ws.onmessage = async (message) => {
      const responseObj = JSON.parse(message.data)
      const { signed, payload_uuidv4 } = responseObj
  
      // only handle signed messages
      if ((signed !== true) || !payload_uuidv4) {
        return
      }
  
      // get payload from backend
      const data: any = await API.XamanGetPayload({ uuid: payload_uuidv4 })

      // check network
      /* @ts-ignore */
      const runtimeConfig = useRuntimeConfig()
      if (data.response.environment_nodetype !== runtimeConfig.public.network) {
        // regen qr code
        alert('Wrong network used: network should be: ' + runtimeConfig.public.network);
        // await connectWallet()
        return
      }
  
      await onMessage({
        data,
        wsClose: () => ws.close()
      })
    }
  
    return ws
  }
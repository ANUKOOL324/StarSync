import {WebSocketServer , WebSocket} from "ws"
import crypto from "crypto";

const wss = new WebSocketServer({port:3001});

interface User{
    id:string;
    socket:WebSocket;
    room:string;
}

let userCount = 0;
const allSocket:User[] = [];

wss.on("connection",(socket)=>{
    const userId = crypto.randomUUID();

    socket.on("message",(message)=>{
        console.log(message.toString())
        const parsedMessage = JSON.parse(message.toString());
        if(parsedMessage.type =="join")
        {
            allSocket.push({
                id:userId,
                socket,
                room:parsedMessage.payload.roomId
            })
        }
        if(parsedMessage.type =="chat")
        {
            const currentUser = allSocket.find((x)=>x.socket==socket);
            for(let i = 0 ; i<allSocket.length;i++)
            {
                if(allSocket[i]?.room == currentUser?.room)
                {
                    allSocket[i]?.socket.send(JSON.stringify({mess:parsedMessage.payload.message,
                        senderId:currentUser?.id
                    }))
                }
            }
        }
    })
    socket.on("close", () => {
  const index = allSocket.findIndex(u => u.socket === socket);
  if (index !== -1) {
    allSocket.splice(index, 1);
  }
});

})
 

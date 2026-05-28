import { useEffect, useRef, useState } from 'react' 
import './App.css'

type ChatMessage={
  mess:string;
  senderId:string;
}

function App() {
 const [messages , setMessage] = useState<ChatMessage[]>([]);
 const inputRef = useRef<HTMLInputElement | null>(null);
 const wsRef = useRef<WebSocket | null>(null);

  useEffect(()=>{
    const ws = new WebSocket("ws://localhost:3001");
    ws.onmessage = (event) => {
      const parsed:ChatMessage = JSON.parse(event.data)
      setMessage(m=>[...m ,parsed])
    }

    inputRef.current?.focus();

    wsRef.current = ws;
   ws.onopen = () =>{
    ws.send(JSON.stringify({
      type:"join",
      payload:{
        roomId:"red"
      }
    }))
   }
   return () => {
    ws.close();
  };
  },[])

  return (
    <>
      <div className="flex-col h-dvh flex ">      
        <div className='flex-1 flex gap-4 flex-col bg-gray-300 relative overflow-scroll'>
          {messages.map((m , index)=>(<span key={index} className='p-4 w-max flex gap-1 h-max border border-dashed rounded-2xl bg-white text-black relative top-10 left-10'>
           <p className='text-sky-500 border rounded-3xl'>{m.senderId.slice()[0]}</p>: {m.mess}</span>))}
          </div>
        <div className='flex gap-1 items-center bg-black'>
          <input ref={inputRef} placeholder='...message' className='bg-white h-10 shadow-2xl drop-shadow-green-400 tracking-tight p-3 ml-1 mt-1 border border-amber-100 rounded-2xl mb-2 active:scale-98' ></input>
          <button className='bg-green-200 w-15 h-10 border-b-emerald-600 rounded-4xl cursor-pointer hover:bg-green-400 transition active:scale-70' onClick={()=>{
            wsRef.current.send(JSON.stringify({type:"chat",
              payload:{message:inputRef.current?.value}}))
          }}>Send</button>
        </div>
      </div>
    </>
  )
}

export default App

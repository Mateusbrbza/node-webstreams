import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import byteSize from 'byte-size';
import csvtojson from 'csvtojson';
import { Readable, Transform, Writable } from 'node:stream';
import { TransformStream } from 'node:stream/web';

const PORT = 8080;
// curl -N localhost:8080
createServer(async (request, response) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204, headers)
    response.end()
    return;
  }

  let counter = 0
  const filename = './data/animeflv.csv'
  const { size } = await stat(filename)

  console.log('processing', `${byteSize(size)}`)

  try {
    response.writeHead(200, headers);
    
    const abortController = new AbortController()
    
    request.once('close', _ => {
      console.log('connection was closed', counter)
      abortController.abort()
    })

    await Readable.toWeb(createReadStream(filename))
    .pipeThrough(Transform.toWeb(csvtojson()))
    .pipeThrough(new TransformStream({
      async transform(jsonLine, controller) {
        const data = JSON.parse(Buffer.from(jsonLine))
        const mappedData = JSON.stringify({
          title: data.title,
          description: data.description,
          url: data.url_anime
        })
        // make sure that data has a separator
        // in case nodejs is controlling the flow
        // it can hgold some string in memory and 
        // sent them all at once
        counter++
        controller.enqueue(mappedData.concat('\n'))
      }
    }))
    .pipeTo(Writable.toWeb(response), {
      signal: abortController.signal
    })
  } catch (error) {
    if (error.message.includes('abort')) return 
    console.log('somethign happened', error)
  }
})
  .listen(PORT)
  .on("listerning", _ => console.log("server is running at", PORT));

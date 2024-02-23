import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import byteSize from 'byte-size';

const PORT = 8080;
// curl -N localhost:8080
createServer(async (request, response) => {
  const filename = './data/animeflv.csv'
  const { size } = await stat(filename)
  console.log('processing', `${byteSize(size)}`)
  const fileStream = createReadStream(filename)
  .pipe(response)
})
  .listen(PORT)
  .on("listerning", _ => console.log("server is running at", PORT));

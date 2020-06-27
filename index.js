const { Chromeless } = require('chromeless')

const url = 'https://twitter.com/MariaOhisalo/status/1276833682775576582'
 
async function run() {
  const chromeless = new Chromeless()
 
  const tweetHtml = await chromeless
    .goto(url)
    .wait('article[role="article"]')
    .html()
 
  console.log(tweetHtml) // prints local file path or S3 url
 
  await chromeless.end()
}
 
run().catch(console.error.bind(console))
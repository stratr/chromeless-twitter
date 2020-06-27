const { Chromeless } = require('chromeless')

const url = 'https://twitter.com/MariaOhisalo/status/1276833682775576582'
const urls = ['https://twitter.com/MariaOhisalo/status/1276833682775576582']
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'

async function run() {
  const chromeless = new Chromeless()

  // fetch the title of each tweet page
  const tweetPromises = []
  urls.forEach(url => {
    const tweetTitle = chromeless
      .setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36')
      .goto(url)
      .wait('article[role="article"]')
      .evaluate(() => {
        return document.title.split('"')[1] // the actual tweet content
      })

    tweetPromises.push(tweetTitle)
  })

  Promise.all(tweetPromises)
    .then((title) => {
      console.log(title);
    })
    .catch(error => { 
      console.error(error.message)
    });

  await chromeless.end()
}

run().catch(console.error.bind(console))
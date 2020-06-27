const { Chromeless } = require('chromeless')
const { BigQuery } = require('@google-cloud/bigquery');
const { evaluate } = require('chromeless/dist/src/util');
const bigquery = new BigQuery();

const datasetId = 'tweets_eu'
const tableId = 'chromeless_tweets'

const urls = ['https://twitter.com/MariaOhisalo/status/1276833682775576582', 'https://twitter.com/hjallisharkimo/status/1276567729739386887']
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'

function sleep() {
  return new Promise(resolve => {
    setTimeout(resolve, 2000)
  })
}

async function run() {
  try {
    const masterChromeless = new Chromeless()

    await sleep() // Needed to wait for Chrome to start up

    const promises = urls.map(url => {
      return new Promise((resolve, reject) => {
        const chromeless = new Chromeless({ launchChrome: false })
        chromeless
          .setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36')
          .goto(url)
          .wait('article[role="article"]')
          .evaluate(() => {
            return document.title.split('"')[1] // the actual tweet content
          })
          .then(async evaluate => {
            await chromeless.end()
            resolve(evaluate)
          })
          .catch(err => reject(err))
      })
    })

    const tweets = await Promise.all(promises)

    tweets.forEach(tweet => console.log(`Tweet: ${tweet}`))

    //await masterChromeless.end()
  } catch (err) {
    console.error('error: ' + err)
  }
}

run()

// async function run() {
//   // fetch the title of each tweet page
//   const tweetPromises = []
//   urls.forEach(url => {
//     const chromeless = new Chromeless()
//     const tweetTitle = chromeless
//       .setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36')
//       .goto(url)
//       .wait('article[role="article"]')
//       .evaluate(() => {
//         return document.title.split('"')[1] // the actual tweet content
//       })

//     tweetPromises.push(tweetTitle)
//   })

//   Promise.all(tweetPromises)
//     .then((tweets) => {
//       console.log(tweets);
//     })
//     .catch(error => {
//       console.error(error.message)
//     });

//   await chromeless.end()
// }

async function insertRowsAsStream(rows) {
  // Inserts the JSON objects into my_dataset:my_table.

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const datasetId = 'my_dataset';
  // const tableId = 'my_table';
  // const rows = [
  //   {name: 'Tom', age: 30},
  //   {name: 'Jane', age: 32},
  // ];

  // Insert data into a table
  await bigquery
    .dataset(datasetId)
    .table(tableId)
    .insert(rows);
  console.log(`Inserted ${rows.length} rows`);
}

// run().catch(console.error.bind(console))
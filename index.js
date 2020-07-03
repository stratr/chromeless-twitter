const { Chromeless } = require('chromeless')
const { BigQuery } = require('@google-cloud/bigquery');
const { evaluate } = require('chromeless/dist/src/util');
const bigquery = new BigQuery();

const datasetId = 'tweets_eu'
const tableId = 'chromeless_tweets'

//const tweetIds = ['1276833682775576582', '1276567729739386887']
const tweetURL = 'https://twitter.com/i/web/status/'
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'

function sleep() {
  return new Promise(resolve => {
    setTimeout(resolve, 2000)
  })
}

async function main() {
  const tweetIds = await queryIds()
  // console.log(tweetIds)
  fetchTweets(tweetIds)
}

async function fetchTweets(tweetIds) {
  try {
    const masterChromeless = new Chromeless()

    await sleep() // Needed to wait for Chrome to start up

    const promises = tweetIds.map(id => {
      const url = tweetURL + id
      const id_str = id

      return new Promise((resolve, reject) => {
        const chromeless = new Chromeless({
          launchChrome: false,
          waitTimeout: 100000
        })
        chromeless
          .setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36')
          .goto(url)
          .wait('article[role="article"]')
          .evaluate((id_str) => {
            return {
              id_str: id_str,
              text: document.title.split('"')[1] // the actual tweet content
            }
          }, id)
          .then(async evaluate => {
            await chromeless.end()
            resolve(evaluate)
          })
          .catch(err => reject(err))
      })
    })

    const tweets = await Promise.all(promises)

    tweets.forEach((tweet) => {
      // console.log(`Tweet: ${tweet}`)
      console.log(tweet)
    })

    insertRowsAsStream(tweets)

    //await masterChromeless.end()
  } catch (err) {
    console.error('error: ' + err)
  }
}

async function insertRowsAsStream(rows) {
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

async function queryIds() {
  const query = `SELECT
  DISTINCT id_str
FROM
  \`tanelis.tweets_eu.missing_full_text\`
LIMIT
  50`;

  const options = {
    query: query,
    location: 'EU',
  };

  // Run the query as a job
  const [job] = await bigquery.createQueryJob(options);
  console.log(`Job ${job.id} started.`);

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  return rows.map(tweet => {return tweet.id_str});
}

//run()
main()
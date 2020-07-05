const { Chromeless } = require('chromeless')
const { BigQuery } = require('@google-cloud/bigquery');
const { evaluate } = require('chromeless/dist/src/util');
const bigquery = new BigQuery();

const datasetId = 'tweets_eu'
const tableId = 'chromeless_tweets'

//const tweetIds = ['1276833682775576582', '1276567729739386887']
const sqlLimit = '10'
const tweetURL = 'https://twitter.com/i/web/status/'
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'

function sleep(timeSeconds) {
  if (timeSeconds === null) {timeSeconds = 2}
  return new Promise(resolve => {
    setTimeout(resolve, timeSeconds*1000)
  })
}

async function main() {
  // run the process multiple times
  const runs = 100;
  for (let i = 0; i < runs; i++) {
    const tweetIds = await queryIds()
    if (tweetIds.length > 0) {
      await fetchTweets(tweetIds)
    } else {
      console.log('No more tweets to fetch')
    }
    await sleep(10)
  }
}

async function fetchTweets(tweetIds) {
  try {
    const masterChromeless = new Chromeless()
    const heading404 = 'h1[data-testid="error-detail"]'

    await sleep() // Needed to wait for Chrome to start up

    const promises = tweetIds.map(id => {
      const url = tweetURL + id
      const id_str = id

      return new Promise((resolve, reject) => {
        const chromeless = new Chromeless({
          launchChrome: false,
          waitTimeout: 50000
        })
        chromeless
          .setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36')
          .goto(url)
          .wait(`article[role="article"], ${heading404}`)
          //.wait('body')
          .evaluate((id_str) => {
            const firstIndex = document.title.indexOf('"')
            const lastIndex = document.title.lastIndexOf('"')
            const docTitle = document.title.indexOf('"') > -1 ? document.title.slice(firstIndex, lastIndex) : document.title
            return {
              id_str: id_str,
              text: docTitle // the actual tweet content
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

    await insertRowsAsStream(tweets.filter(tweet => {return tweet.text !== ''}))

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
  ${sqlLimit}`;

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
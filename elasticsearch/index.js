const faker = require("faker");
const es = require("elasticsearch");
const rs = require("randomstring");

const client = new es.Client({
  host: process.env.bogus_elastic_host+":9200",
  log: ['error', 'warning']
});

const indexes = ["first", "second", "third", "fourth", "fifth"];

setup();

setInterval(randfunc, 50);
function query() {
  const thisindex = randindex();
  const randletter = randomletter();
  client.search(
    {
      index: thisindex,
      body: {
        query: {
          prefix: { title: randletter }
        }
      }
    },
    function(error, response) {
      if (error) {
        console.log("Query error");
      } else {
        console.log(
          'Query for "' +
            randletter +
            '" in the ' +
            thisindex +
            " index resulted in " +
            response.hits.total +
            " hits"
        );
      }
    }
  );
}
function setup() {
  // if (client.indices.exists({index: "first"})){
  //     console.log('first already exists');
  // }else{
  for (var index in indexes) {
    client.indices.create({ index: index }, function(err, resp) {
      console.log(resp);
    });
  }

  // }
}
function insertdoc() {
  const thistitle = faker.name.findName();
  const thisindex = randindex();
  client.index(
    {
      index: thisindex,
      type: "doc",
      body: {
        title: thistitle,
        tags: ["y", "z"], 
        text: faker.lorem.paragraphs(Math.floor(Math.random() * 20))
      }
    },
    function(error, response) {
      if (error) {
        console.log("error creating doc" + error);
      } else {
        console.log(
          "Added " +
            response._id +
            ": " +
            thistitle +
            " to the " +
            thisindex +
            " index"
        );
      }
    }
  );
}
function getcount() {
  var thisindex = randindex();
  client.count(
    {
      index: thisindex
    },
    function(error, response) {
        if (response != null) {
            console.log("Count for the " + thisindex + " index is " + response.count);
        }
      
    }
  );
}
function deletedoc() {
  const thisindex = randindex();
  const randletter = randomletter();
  client.search(
    {
      index: thisindex,
      body: {
        query: {
          prefix: { title: randletter }
        }
      }
    },
    function(error, response) {
      if (error) {
        console.log("Query error");
      } else {
        console.log(
          'Query (deletion) for "' +
            randletter +
            '" in the ' +
            thisindex +
            " index resulted in " +
            response.hits.total +
            " hits"
        );
        response.hits.hits.forEach((hit, index) => {
          console.log(hit._id);

          client.delete({
              index: thisindex,
              type: hit._type,
              id: hit._id
            },
            function(err, resp) {
              if (err) {
                console.log(err);
              } else {
                console.log("deleted " + hit._id);
              }
            }
          );
        });
        // for (var hit in response) {
        //     console.log(hit._id)

        // }
      }
    }
  );
}

function pingelastic() {
  client.ping(
    {
      requestTimeout: 30000
    },
    function(error) {
      if (error) {
        console.error("The cluster is down");
      } else {
        console.log("The cluster is working fine");
      }
    }
  );
}

function randfunc() {
  const randnum = Math.floor(Math.random() * 5);
  setTimeout(
    [insertdoc, deletedoc, query, pingelastic, getcount][randnum],
    Math.random() * 2000
  );
}

function randindex() {
  const thisindex = indexes[Math.floor(Math.random() * indexes.length)];
  return thisindex;
}

function randomletter() {
  return rs.generate({
    charset: "alphabetic",
    length: 1,
    // capitalization: "lowercase"
  });
}

var MQTTbroker = '127.0.0.1';
var MQTTport = 9001;
var MQTTsubTopic; // variable for MQTT Topic

var chart; // global variuable for chart
var dataTopics = new Array();

//mqtt broker
var client = new Messaging.Client(MQTTbroker, MQTTport,
  "myclientid_" + parseInt(Math.random() * 100, 10));
  client.onMessageArrived = onMessageArrived;
  client.onConnectionLost = onConnectionLost;
  //connect to broker is at the bottom of the init() function !!!!


  //mqtt connecton options including the mqtt broker subscriptions
  var options = {
    timeout: 3,
    onSuccess: function () {
      console.log("mqtt connected and subscribing to " + MQTTsubTopic);
      // Connection succeeded; subscribe to our topics
      client.subscribe(MQTTsubTopic, {qos: 1});
    },
    onFailure: function (message) {
      console.log("Connection failed, ERROR: " + message.errorMessage);
    }
  };


  // can be used to Initialize MQ
  function connectMQTT (gatewayId){
    MQTTsubTopic = 'gateways/'+ gatewayId +'/sensors/+/data'
    console.log ("MQTT topic is " + MQTTsubTopic);
    client.connect(options);   // Connect to MQTT Server
  };

  //can be used to reconnect on connection lost
  function onConnectionLost(responseObject) {
    console.log("connection lost: " + responseObject.errorMessage);
  };

  //what is done when a message arrives from the broker
  function onMessageArrived(message) {
    console.log(message.destinationName, '',message.payloadString);

    var json;

    try {
      json = JSON.parse(message.payloadString);
    } catch(e) {

    }

    updateTable(json);

    //check if it is a new topic, if not add it to the array
    if (dataTopics.indexOf(message.destinationName) < 0){
      console.log("New Data Topic", message.destinationName)
      dataTopics.push(message.destinationName); //add new topic to array
      var y = dataTopics.indexOf(message.destinationName); //get the index no

      //create new data series for the chart
      var newseries = {
        id: y,
        name: message.destinationName,
        data: []
      };

      chart.addSeries(newseries); //add the series
    };

    var y = dataTopics.indexOf(message.destinationName); //get the index no of the topic from the array
    var myEpoch = new Date().getTime(); //get current epoch time
    //		         var thenum = message.payloadString.replace( /^\D+/g, ''); //remove any text spaces from the message
    var thenum = json.value;
    var plotMqtt = [myEpoch, Number(thenum)]; //create the array
    if (isNumber(thenum)) { //check if it is a real number and not text
      plot(plotMqtt, y);	//send it to the plot function
    };
  };

  //check if a real number
  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };

  //function that is called once the document has loaded
  function init() {
    console.log ("Data Collected is " + document.getElementById("gatewayInfo").value)
    console.log ("Started Init Function")
    document.getElementById("gatewayInfo").disabled = true;
    var gatewayId = document.getElementById("gatewayInfo").value
    console.log ("Gateway Id is ", gatewayId)

    // Connect to MQTT broker
    connectMQTT(gatewayId);
    chart.setTitle({text: 'Plotting Realtime data from Gateway ' + gatewayId});
    chart.setTitle(null, {text: 'broker: ' + MQTTbroker + ' | port: ' + MQTTport + ' | topic : ' + MQTTsubTopic});

    Highcharts.setOptions({
      global: {
        useUTC: false
      }
    });


  };

  //this adds the plots to the chart
  function plot(point, chartno) {

    var series = chart.series[0],
    shift = series.data.length > 20; // shift if the series is
    // longer than 20
    // add the point
    chart.series[chartno].addPoint(point, true, shift);
    chart.subtitle

  };


  function updateTable(data) {
    var table = document.getElementById("dataTable");
    var row = table.insertRow(1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
   cell1.innerHTML = data.gateway_id;
   cell2.innerHTML = data.sensor_id;
   cell3.innerHTML = data.value;
   cell4.innerHTML = data.timestamp;
  }

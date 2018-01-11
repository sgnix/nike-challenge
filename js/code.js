app.Connection = (() => {

    var webSocket;

    function Connection(startup) {
      var self = this;

      var webSocketError = () => {
        console.log("Error");
      };

      // Fallback for Firefox
      window.WebSocket = window.WebSocket || window.MozWebSocket;

      webSocket = new WebSocket('ws://' + location.hostname + ':8080');

      webSocket.onopen = () => {
        console.log("Client connected");
        if (startup) {
          startup();
        }
      };

      webSocket.onerror = webSocketError;

      webSocket.onmessage = (message) => {
        var data = {};
        try {
          data = JSON.parse(message);
        } catch (e) {
          console.log("Bad JSON message [" + message + "]");
        }
      };

      webSocket.onclose = webSocketError;
    }

    Connection.prototype.send = function (action, args) {
      var message = JSON.stringify({
        action: action,
        args: args
      });
      webSocket.send(message);
    };

    return Connection;
})();
